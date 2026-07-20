import { useMemo, useState } from 'react'
import { Alert, StyleSheet, Text, View } from 'react-native'
import { useData, useEnsureData } from '@/context/DataContext'
import { Screen } from '@/components/layout/Screen'
import { PageHead } from '@/components/ui/PageHead'
import { Button } from '@/components/ui/Button'
import { ActionOrb } from '@/components/ui/ActionChip'
import { IconButton } from '@/components/ui/IconButton'
import { Pause, Pencil, Play, Plus, Trash2 } from 'lucide-react-native'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { SelectField } from '@/components/ui/SelectField'
import { Badge } from '@/components/ui/Badge'
import { MetricTile } from '@/components/ui/MetricTile'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatCurrency, formatDate } from '@/utils/format'
import { colors, radius } from '@/theme'
import { successTap } from '@/utils/haptics'

const empty = { id: '', name: '', amount: '', cycle: 'monthly', nextRenewal: '', status: 'active' }

export default function SubscriptionsScreen() {
  useEnsureData(['subscriptions'])
  const {
    subscriptions,
    loading,
    refresh,
    saveSubscription,
    setSubscriptionStatus,
    deleteSubscription,
  } = useData()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(empty)
  const [busy, setBusy] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)

  const { monthly, yearly, activeCount } = useMemo(() => {
    let m = 0
    let y = 0
    let active = 0
    subscriptions.forEach((s) => {
      if (s.status !== 'active') return
      active += 1
      const cycle = String(s.cycle || '').toLowerCase()
      if (cycle === 'yearly' || cycle === 'annual') y += Number(s.amount) || 0
      else m += Number(s.amount) || 0
    })
    return { monthly: m, yearly: y + m * 12, activeCount: active }
  }, [subscriptions])

  const onSave = async () => {
    if (!form.name.trim() || !form.amount) return Alert.alert('Name and amount required')
    setBusy(true)
    try {
      await saveSubscription({
        id: form.id || undefined,
        name: form.name.trim(),
        amount: form.amount,
        cycle: form.cycle,
        nextRenewal: form.nextRenewal,
        status: form.status || 'active',
      })
      await successTap()
      setOpen(false)
    } catch (e: any) {
      Alert.alert('Error', e.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Screen refreshing={loading} onRefresh={() => refresh(['subscriptions'])}>
      <PageHead
        kicker="Recurring spend"
        title="Subscriptions"
        subtitle="Track streaming, SaaS, and memberships."
        actions={<ActionOrb label="Add subscription" icon={Plus} onPress={() => { setForm({ ...empty, nextRenewal: new Date().toISOString().slice(0, 10) }); setOpen(true) }} />}
      />

      <View style={styles.metrics}>
        <MetricTile label="Monthly cost" value={formatCurrency(monthly)} hint="Active subs" />
        <MetricTile label="Yearly cost" value={formatCurrency(yearly)} hint="Monthly × 12 + annual" />
        <MetricTile label="Active" value={String(activeCount)} hint="Subscriptions" />
      </View>

      {!subscriptions.length ? <EmptyState title="No subscriptions yet" /> : null}
      <View style={styles.list}>
        {subscriptions.map((s) => (
          <View key={s.id} style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.name}>{s.name}</Text>
              <Text style={styles.amt}>{formatCurrency(s.amount)}</Text>
            </View>
            <View style={styles.chips}>
              <Badge tone="neutral">{String(s.cycle)}</Badge>
              <Badge tone={s.status === 'active' ? 'success' : 'warning'}>{s.status}</Badge>
            </View>
            <Text style={styles.meta}>Next renewal {formatDate(s.nextRenewal)}</Text>
            <View style={styles.actions}>
              <IconButton
                label={s.status === 'active' ? 'Pause' : 'Resume'}
                icon={s.status === 'active' ? Pause : Play}
                tone="muted"
                loading={busyId === s.id}
                disabled={busyId !== null && busyId !== s.id}
                onPress={async () => {
                  setBusyId(s.id)
                  try {
                    await setSubscriptionStatus(s.id, s.status === 'active' ? 'paused' : 'active')
                    await successTap()
                  } catch (e: any) {
                    Alert.alert('Error', e.message)
                  } finally {
                    setBusyId(null)
                  }
                }}
              />
              <IconButton
                label="Edit subscription"
                icon={Pencil}
                tone="brand"
                onPress={() => {
                  setForm({
                    id: s.id,
                    name: s.name,
                    amount: String(s.amount),
                    cycle: String(s.cycle || 'monthly').toLowerCase(),
                    nextRenewal: String(s.nextRenewal || '').slice(0, 10),
                    status: s.status || 'active',
                  })
                  setOpen(true)
                }}
              />
              <IconButton
                label="Delete subscription"
                icon={Trash2}
                tone="danger"
                loading={busyId === `del-${s.id}`}
                disabled={busyId !== null && busyId !== `del-${s.id}`}
                onPress={() =>
                  Alert.alert('Delete subscription?', s.name, [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Delete',
                      style: 'destructive',
                      onPress: async () => {
                        setBusyId(`del-${s.id}`)
                        try {
                          await deleteSubscription(s.id)
                          await successTap()
                        } catch (e: any) {
                          Alert.alert('Error', e.message)
                        } finally {
                          setBusyId(null)
                        }
                      },
                    },
                  ])
                }
              />
            </View>
          </View>
        ))}
      </View>

      <Modal
        open={open}
        title={form.id ? 'Edit subscription' : 'Add subscription'}
        onClose={() => setOpen(false)}
      >
        <Input label="Name" value={form.name} onChangeText={(name) => setForm((f) => ({ ...f, name }))} />
        <Input
          label="Amount (₹)"
          keyboardType="numeric"
          value={form.amount}
          onChangeText={(amount) => setForm((f) => ({ ...f, amount }))}
        />
        <SelectField
          label="Cycle"
          value={form.cycle}
          options={[
            { label: 'Monthly', value: 'monthly' },
            { label: 'Yearly', value: 'yearly' },
          ]}
          onChange={(cycle) => setForm((f) => ({ ...f, cycle }))}
        />
        <Input
          label="Next renewal (YYYY-MM-DD)"
          value={form.nextRenewal}
          onChangeText={(nextRenewal) => setForm((f) => ({ ...f, nextRenewal }))}
        />
        <Button loading={busy} onPress={onSave}>
          Save
        </Button>
      </Modal>
    </Screen>
  )
}

const styles = StyleSheet.create({
  metrics: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 14 },
  list: { gap: 10 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    gap: 8,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  name: { fontWeight: '800', color: colors.ink, flex: 1 },
  amt: { fontWeight: '800', color: colors.ink },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  meta: { color: colors.muted, fontSize: 13 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
})
