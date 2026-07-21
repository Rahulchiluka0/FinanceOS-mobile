import { useState } from 'react'
import { Alert, StyleSheet, Text, View } from 'react-native'
import { loansApi } from '@/api'
import { useData, useEnsureData } from '@/context/DataContext'
import { Screen } from '@/components/layout/Screen'
import { PageHead } from '@/components/ui/PageHead'
import { Button } from '@/components/ui/Button'
import { ActionOrb } from '@/components/ui/ActionChip'
import { IconButton } from '@/components/ui/IconButton'
import { CalendarClock, Pencil, Plus, Trash2 } from 'lucide-react-native'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatCurrency, formatDate } from '@/utils/format'
import { colors, radius } from '@/theme'
import { successTap } from '@/utils/haptics'
import type { Loan } from '@/types'

const empty = {
  id: '',
  name: '',
  principal: '',
  remaining: '',
  rate: '8',
  emi: '',
  nextDue: '',
  tenureMonths: '60',
  paidMonths: '0',
}

type ScheduleRow = { month: number; dueDate: string; amount: number; remaining: number }

export default function LoansScreen() {
  useEnsureData(['loans'])
  const { loans, loading, refresh, saveLoan, deleteLoan } = useData()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(empty)
  const [busy, setBusy] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [scheduleLoan, setScheduleLoan] = useState<Loan | null>(null)
  const [schedule, setSchedule] = useState<ScheduleRow[]>([])
  const [scheduleLoading, setScheduleLoading] = useState(false)

  const totalRemaining = loans.reduce((s, l) => s + (Number(l.remaining) || 0), 0)
  const totalEmi = loans.reduce((s, l) => s + (Number(l.emi) || 0), 0)

  const onSave = async () => {
    if (!form.name.trim() || !form.principal || !form.remaining || !form.emi) {
      return Alert.alert('Name, principal, remaining, and EMI are required')
    }
    setBusy(true)
    try {
      await saveLoan({
        id: form.id || undefined,
        name: form.name.trim(),
        principal: form.principal,
        remaining: form.remaining,
        rate: form.rate,
        emi: form.emi,
        nextDue: form.nextDue || null,
        tenureMonths: form.tenureMonths,
        paidMonths: form.paidMonths,
      })
      await successTap()
      setOpen(false)
    } catch (e: any) {
      Alert.alert('Error', e.message)
    } finally {
      setBusy(false)
    }
  }

  const openSchedule = async (loan: Loan) => {
    setScheduleLoan(loan)
    setSchedule([])
    setScheduleLoading(true)
    try {
      const data = await loansApi.schedule(loan.id)
      setSchedule(Array.isArray(data) ? data : [])
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to load schedule')
    } finally {
      setScheduleLoading(false)
    }
  }

  return (
    <Screen refreshing={loading} onRefresh={() => refresh(['loans'])}>
      <PageHead
        kicker="Debt"
        title="Loans & EMI"
        subtitle={`Outstanding ${formatCurrency(totalRemaining)} · EMI ${formatCurrency(totalEmi)}/mo`}
        actions={<ActionOrb label="Add loan" icon={Plus} onPress={() => { setForm(empty); setOpen(true) }} />}
      />
      {!loans.length ? <EmptyState title="No loans yet" /> : null}
      <View style={styles.list}>
        {loans.map((l) => {
          const principal = Number(l.principal) || 0
          const remaining = Number(l.remaining) || 0
          const rate = l.rate ?? l.interestRate ?? 0
          const pct = principal ? Math.round(((principal - remaining) / principal) * 100) : 0
          return (
            <View key={l.id} style={styles.card}>
              <View style={styles.row}>
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={styles.name}>{l.name}</Text>
                  <Badge tone="info">{rate}% p.a.</Badge>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.amt}>{formatCurrency(l.emi)}/mo</Text>
                  <Text style={styles.meta}>Due {formatDate(l.nextDue)}</Text>
                </View>
              </View>
              <Text style={styles.meta}>
                {formatCurrency(remaining)} remaining of {formatCurrency(principal)}
              </Text>
              <ProgressBar value={principal - remaining} max={principal || 1} />
              <Text style={styles.meta}>
                {pct}% paid · {l.paidMonths || 0}/{l.tenureMonths} months
              </Text>
              <View style={styles.actions}>
                <IconButton
                  label="EMI schedule"
                  icon={CalendarClock}
                  tone="brand"
                  loading={busyId === `sch-${l.id}`}
                  disabled={(busyId !== null && busyId !== `sch-${l.id}`) || scheduleLoading}
                  onPress={async () => {
                    setBusyId(`sch-${l.id}`)
                    try {
                      await openSchedule(l)
                    } finally {
                      setBusyId(null)
                    }
                  }}
                />
                <IconButton
                  label="Edit loan"
                  icon={Pencil}
                  tone="muted"
                  onPress={() => {
                    setForm({
                      id: l.id,
                      name: l.name,
                      principal: String(l.principal),
                      remaining: String(l.remaining),
                      rate: String(rate),
                      emi: String(l.emi),
                      nextDue: l.nextDue ? String(l.nextDue).slice(0, 10) : '',
                      tenureMonths: String(l.tenureMonths),
                      paidMonths: String(l.paidMonths || 0),
                    })
                    setOpen(true)
                  }}
                />
                <IconButton
                  label="Delete loan"
                  icon={Trash2}
                  tone="danger"
                  loading={busyId === l.id}
                  disabled={busyId !== null && busyId !== l.id}
                  onPress={() =>
                    Alert.alert('Delete loan?', l.name, [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Delete',
                        style: 'destructive',
                        onPress: async () => {
                          setBusyId(l.id)
                          try {
                            await deleteLoan(l.id)
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

      <Modal open={open} title={form.id ? 'Edit loan' : 'Add loan'} onClose={() => setOpen(false)}>
        <Input
          label="Name"
          placeholder="e.g. Home loan — HDFC"
          value={form.name}
          onChangeText={(name) => setForm((f) => ({ ...f, name }))}
        />
        <Input
          label="Principal (₹)"
          placeholder="e.g. 2500000"
          keyboardType="numeric"
          value={form.principal}
          onChangeText={(principal) => setForm((f) => ({ ...f, principal }))}
        />
        <Input
          label="Remaining (₹)"
          placeholder="e.g. 1800000"
          keyboardType="numeric"
          value={form.remaining}
          onChangeText={(remaining) => setForm((f) => ({ ...f, remaining }))}
        />
        <Input
          label="Rate (%)"
          placeholder="e.g. 8.5"
          keyboardType="decimal-pad"
          value={form.rate}
          onChangeText={(rate) => setForm((f) => ({ ...f, rate }))}
        />
        <Input
          label="EMI (₹)"
          placeholder="e.g. 21500"
          keyboardType="numeric"
          value={form.emi}
          onChangeText={(emi) => setForm((f) => ({ ...f, emi }))}
        />
        <Input
          label="Next due (YYYY-MM-DD)"
          placeholder="2026-08-01"
          value={form.nextDue}
          onChangeText={(nextDue) => setForm((f) => ({ ...f, nextDue }))}
        />
        <Input
          label="Tenure (months)"
          placeholder="e.g. 240"
          keyboardType="numeric"
          value={form.tenureMonths}
          onChangeText={(tenureMonths) => setForm((f) => ({ ...f, tenureMonths }))}
        />
        <Input
          label="Paid months"
          placeholder="e.g. 36"
          keyboardType="numeric"
          value={form.paidMonths}
          onChangeText={(paidMonths) => setForm((f) => ({ ...f, paidMonths }))}
        />
        <Button loading={busy} onPress={onSave}>
          Save
        </Button>
      </Modal>

      <Modal
        open={Boolean(scheduleLoan)}
        title={scheduleLoan ? `EMI · ${scheduleLoan.name}` : 'EMI schedule'}
        onClose={() => setScheduleLoan(null)}
      >
        {scheduleLoading ? <Text style={styles.meta}>Loading schedule…</Text> : null}
        {!scheduleLoading && !schedule.length ? (
          <Text style={styles.meta}>No remaining installments.</Text>
        ) : null}
        <View style={{ gap: 8 }}>
          {schedule.map((row) => (
            <View key={`${row.month}-${row.dueDate}`} style={styles.schedRow}>
              <Text style={styles.name}>#{row.month}</Text>
              <Text style={styles.meta}>{formatDate(row.dueDate)}</Text>
              <Text style={styles.amt}>{formatCurrency(row.amount)}</Text>
              <Text style={styles.meta}>Bal {formatCurrency(row.remaining)}</Text>
            </View>
          ))}
        </View>
        <Button variant="ghost" onPress={() => setScheduleLoan(null)}>
          Close
        </Button>
      </Modal>
    </Screen>
  )
}

const styles = StyleSheet.create({
  list: { gap: 10 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    gap: 8,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  name: { fontWeight: '800', color: colors.ink },
  amt: { fontWeight: '800', color: colors.ink },
  meta: { color: colors.muted, fontSize: 13 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  schedRow: {
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    gap: 2,
  },
})
