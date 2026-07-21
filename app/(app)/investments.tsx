import { useMemo, useState } from 'react'
import { Alert, StyleSheet, Text, View } from 'react-native'
import { useData, useEnsureData } from '@/context/DataContext'
import { Screen } from '@/components/layout/Screen'
import { PageHead } from '@/components/ui/PageHead'
import { Button } from '@/components/ui/Button'
import { ActionOrb } from '@/components/ui/ActionChip'
import { IconButton } from '@/components/ui/IconButton'
import { Pencil, Plus, Trash2 } from 'lucide-react-native'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { SelectField } from '@/components/ui/SelectField'
import { Badge } from '@/components/ui/Badge'
import { MetricTile } from '@/components/ui/MetricTile'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatCurrency } from '@/utils/format'
import { colors, radius } from '@/theme'
import { successTap } from '@/utils/haptics'
import type { Investment } from '@/types'

const TYPES = ['Stocks', 'Mutual Funds', 'FDs', 'Gold', 'Crypto', 'Real Estate']
const empty = { id: '', name: '', type: 'Stocks', invested: '', value: '' }

function invValue(i: Investment) {
  return Number(i.value ?? i.currentValue ?? 0)
}

export default function InvestmentsScreen() {
  useEnsureData(['investments'])
  const { investments, loading, refresh, saveInvestment, deleteInvestment } = useData()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(empty)
  const [busy, setBusy] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)

  const totals = useMemo(() => {
    const value = investments.reduce((s, i) => s + invValue(i), 0)
    const invested = investments.reduce((s, i) => s + (Number(i.invested) || 0), 0)
    return { value, invested, pl: value - invested }
  }, [investments])

  const byType = useMemo(() => {
    const map: Record<string, Investment[]> = {}
    investments.forEach((i) => {
      const t = i.type || 'Other'
      if (!map[t]) map[t] = []
      map[t].push(i)
    })
    return map
  }, [investments])

  const onSave = async () => {
    if (!form.name.trim() || !form.invested || form.value === '') {
      return Alert.alert('Name, invested, and current value required')
    }
    setBusy(true)
    try {
      await saveInvestment({
        id: form.id || undefined,
        name: form.name.trim(),
        type: form.type,
        invested: form.invested,
        value: form.value,
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
    <Screen refreshing={loading} onRefresh={() => refresh(['investments'])}>
      <PageHead
        kicker="Portfolio"
        title="Investments"
        subtitle="Stocks, mutual funds, FDs, gold, crypto, and more."
        actions={<ActionOrb label="Add investment" icon={Plus} onPress={() => { setForm(empty); setOpen(true) }} />}
      />

      <View style={styles.metrics}>
        <MetricTile label="Portfolio value" value={formatCurrency(totals.value)} hint="All holdings" />
        <MetricTile label="Total invested" value={formatCurrency(totals.invested)} />
        <MetricTile
          label="P/L"
          value={formatCurrency(totals.pl)}
          hint={totals.pl >= 0 ? 'Unrealized gain' : 'Unrealized loss'}
          trend={totals.pl >= 0 ? 'up' : 'down'}
        />
      </View>

      {!investments.length ? <EmptyState title="No investments yet" /> : null}

      {Object.entries(byType).map(([type, items]) => (
        <View key={type} style={styles.section}>
          <View style={styles.row}>
            <Text style={styles.h2}>{type}</Text>
            <Badge tone="info">
              {formatCurrency(items.reduce((s, i) => s + invValue(i), 0))}
            </Badge>
          </View>
          <View style={styles.list}>
            {items.map((i) => {
              const value = invValue(i)
              const pl = value - (Number(i.invested) || 0)
              return (
                <View key={i.id} style={styles.card}>
                  <View style={styles.row}>
                    <Text style={styles.name}>{i.name}</Text>
                    <Text style={styles.amt}>{formatCurrency(value)}</Text>
                  </View>
                  <Text style={[styles.pl, pl >= 0 ? styles.pos : styles.neg]}>
                    {pl >= 0 ? '+' : ''}
                    {formatCurrency(pl)}
                  </Text>
                  <View style={styles.actions}>
                    <IconButton
                      label="Edit investment"
                      icon={Pencil}
                      tone="brand"
                      onPress={() => {
                        setForm({
                          id: i.id,
                          name: i.name,
                          type: i.type || 'Stocks',
                          invested: String(i.invested),
                          value: String(value),
                        })
                        setOpen(true)
                      }}
                    />
                    <IconButton
                      label="Delete investment"
                      icon={Trash2}
                      tone="danger"
                      loading={busyId === i.id}
                      disabled={busyId !== null && busyId !== i.id}
                      onPress={() =>
                        Alert.alert('Delete investment?', i.name, [
                          { text: 'Cancel', style: 'cancel' },
                          {
                            text: 'Delete',
                            style: 'destructive',
                            onPress: async () => {
                              setBusyId(i.id)
                              try {
                                await deleteInvestment(i.id)
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
              )
            })}
          </View>
        </View>
      ))}

      <Modal
        open={open}
        title={form.id ? 'Edit investment' : 'Add investment'}
        onClose={() => setOpen(false)}
      >
        <Input
          label="Name"
          placeholder="e.g. Nifty 50 index fund"
          value={form.name}
          onChangeText={(name) => setForm((f) => ({ ...f, name }))}
        />
        <SelectField
          label="Type"
          value={form.type}
          options={TYPES.map((t) => ({ label: t, value: t }))}
          onChange={(type) => setForm((f) => ({ ...f, type }))}
        />
        <Input
          label="Invested (₹)"
          placeholder="e.g. 50000"
          keyboardType="numeric"
          value={form.invested}
          onChangeText={(invested) => setForm((f) => ({ ...f, invested }))}
        />
        <Input
          label="Current value (₹)"
          placeholder="e.g. 62500"
          keyboardType="numeric"
          value={form.value}
          onChangeText={(value) => setForm((f) => ({ ...f, value }))}
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
  section: { marginBottom: 16, gap: 10 },
  h2: { fontSize: 16, fontWeight: '800', color: colors.ink },
  list: { gap: 10 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    gap: 6,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  name: { fontWeight: '800', color: colors.ink, flex: 1 },
  amt: { fontWeight: '800', color: colors.ink },
  pl: { fontSize: 13, fontWeight: '700' },
  pos: { color: colors.success },
  neg: { color: colors.danger },
  actions: { flexDirection: 'row', gap: 6, marginTop: 4 },
})
