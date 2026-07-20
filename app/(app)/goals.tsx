import { useState } from 'react'
import { Alert, StyleSheet, Text, View } from 'react-native'
import { useData, useEnsureData } from '@/context/DataContext'
import { Screen } from '@/components/layout/Screen'
import { PageHead } from '@/components/ui/PageHead'
import { Button } from '@/components/ui/Button'
import { ActionOrb } from '@/components/ui/ActionChip'
import { IconButton } from '@/components/ui/IconButton'
import { ArrowDownToLine, ArrowUpFromLine, Pencil, Plus, Trash2 } from 'lucide-react-native'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { ColorField } from '@/components/ui/ColorField'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatCurrency, formatDate } from '@/utils/format'
import { colors, radius } from '@/theme'
import { successTap } from '@/utils/haptics'
import type { Goal } from '@/types'

const empty = { id: '', name: '', target: '', deadline: '', color: '#1A56DB', current: '0' }

export default function GoalsScreen() {
  useEnsureData(['goals'])
  const { goals, loading, refresh, saveGoal, adjustGoal, deleteGoal } = useData()
  const [open, setOpen] = useState(false)
  const [adjust, setAdjust] = useState<{ goal: Goal; mode: 'deposit' | 'withdraw' } | null>(null)
  const [form, setForm] = useState(empty)
  const [amount, setAmount] = useState('')
  const [busy, setBusy] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)

  const onSave = async () => {
    if (!form.name.trim() || !form.target) return Alert.alert('Name and target required')
    setBusy(true)
    try {
      await saveGoal({
        id: form.id || undefined,
        name: form.name.trim(),
        target: form.target,
        deadline: form.deadline || null,
        color: form.color,
        current: form.id ? form.current : 0,
      })
      await successTap()
      setOpen(false)
    } catch (e: any) {
      Alert.alert('Error', e.message)
    } finally {
      setBusy(false)
    }
  }

  const onAdjust = async () => {
    if (!adjust) return
    const value = Number(amount)
    if (!value || value <= 0) return Alert.alert('Enter an amount greater than zero')
    if (adjust.mode === 'withdraw' && value > Number(adjust.goal.current)) {
      return Alert.alert('Error', `Cannot withdraw more than ${formatCurrency(adjust.goal.current)}`)
    }
    setBusy(true)
    try {
      await adjustGoal(adjust.goal.id, adjust.mode === 'deposit' ? value : -value)
      await successTap()
      setAdjust(null)
      setAmount('')
    } catch (e: any) {
      Alert.alert('Error', e.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Screen refreshing={loading} onRefresh={() => refresh(['goals'])}>
      <PageHead
        kicker="Save up"
        title="Savings Goals"
        subtitle="Track targets, deadlines, and progress."
        actions={<ActionOrb label="Add goal" icon={Plus} onPress={() => { setForm(empty); setOpen(true) }} />}
      />
      {!goals.length ? <EmptyState title="No savings goals yet" /> : null}
      <View style={styles.list}>
        {goals.map((g) => {
          const done = Number(g.current) >= Number(g.target) && Number(g.target) > 0
          return (
            <View key={g.id} style={styles.card}>
              <View style={[styles.swatch, { backgroundColor: g.color || colors.brand }]} />
              <View style={{ flex: 1, gap: 6 }}>
                <View style={styles.row}>
                  <Text style={styles.name}>
                    {g.name}
                    {done ? ' ✓' : ''}
                  </Text>
                </View>
                <Text style={styles.meta}>{g.deadline ? `Due ${formatDate(g.deadline)}` : 'No deadline'}</Text>
                <Text style={styles.amount}>{formatCurrency(g.current)}</Text>
                <Text style={styles.meta}>of {formatCurrency(g.target)}</Text>
                <ProgressBar value={g.current} max={g.target} />
                <View style={styles.actions}>
                  <IconButton
                    label="Deposit"
                    icon={ArrowDownToLine}
                    tone="success"
                    onPress={() => {
                      setAdjust({ goal: g, mode: 'deposit' })
                      setAmount('')
                    }}
                  />
                  <IconButton
                    label="Withdraw"
                    icon={ArrowUpFromLine}
                    tone="warning"
                    onPress={() => {
                      setAdjust({ goal: g, mode: 'withdraw' })
                      setAmount('')
                    }}
                  />
                  <IconButton
                    label="Edit goal"
                    icon={Pencil}
                    tone="brand"
                    onPress={() => {
                      setForm({
                        id: g.id,
                        name: g.name,
                        target: String(g.target),
                        deadline: g.deadline ? String(g.deadline).slice(0, 10) : '',
                        color: g.color || '#1A56DB',
                        current: String(g.current ?? 0),
                      })
                      setOpen(true)
                    }}
                  />
                  <IconButton
                    label="Delete goal"
                    icon={Trash2}
                    tone="danger"
                    loading={busyId === g.id}
                    disabled={busyId !== null && busyId !== g.id}
                    onPress={() =>
                      Alert.alert('Delete goal?', g.name, [
                        { text: 'Cancel', style: 'cancel' },
                        {
                          text: 'Delete',
                          style: 'destructive',
                          onPress: async () => {
                            setBusyId(g.id)
                            try {
                              await deleteGoal(g.id)
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
            </View>
          )
        })}
      </View>

      <Modal open={open} title={form.id ? 'Edit goal' : 'New goal'} onClose={() => setOpen(false)}>
        <Input label="Name" value={form.name} onChangeText={(name) => setForm((f) => ({ ...f, name }))} />
        <Input
          label="Target (₹)"
          keyboardType="numeric"
          value={form.target}
          onChangeText={(target) => setForm((f) => ({ ...f, target }))}
        />
        <Input
          label="Deadline (YYYY-MM-DD)"
          value={form.deadline}
          onChangeText={(deadline) => setForm((f) => ({ ...f, deadline }))}
          placeholder="2026-12-31"
        />
        {form.id ? (
          <Input
            label="Current saved (₹)"
            keyboardType="numeric"
            value={form.current}
            onChangeText={(current) => setForm((f) => ({ ...f, current }))}
            hint="Use Deposit/Withdraw for day-to-day changes"
          />
        ) : null}
        <ColorField value={form.color} onChange={(color) => setForm((f) => ({ ...f, color }))} />
        <Button loading={busy} onPress={onSave}>
          Save
        </Button>
      </Modal>

      <Modal
        open={Boolean(adjust)}
        title={adjust?.mode === 'deposit' ? 'Deposit' : 'Withdraw'}
        onClose={() => setAdjust(null)}
      >
        <Text style={styles.meta}>
          Goal: {adjust?.goal.name}
          {adjust?.mode === 'withdraw'
            ? ` · Available ${formatCurrency(adjust.goal.current)}`
            : ''}
        </Text>
        <Input
          label="Amount (₹)"
          keyboardType="numeric"
          value={amount}
          onChangeText={setAmount}
        />
        <Button loading={busy} onPress={onAdjust}>
          {adjust?.mode === 'deposit' ? 'Deposit' : 'Withdraw'}
        </Button>
      </Modal>
    </Screen>
  )
}

const styles = StyleSheet.create({
  list: { gap: 10 },
  card: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
  },
  swatch: { width: 6, borderRadius: 6 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontWeight: '800', color: colors.ink, fontSize: 16 },
  amount: { fontSize: 22, fontWeight: '800', color: colors.ink },
  meta: { color: colors.muted, fontSize: 13 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
})
