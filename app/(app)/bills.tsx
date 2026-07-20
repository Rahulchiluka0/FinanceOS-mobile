import { useMemo, useState } from 'react'
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native'
import { useData, useEnsureData } from '@/context/DataContext'
import { Screen } from '@/components/layout/Screen'
import { PageHead } from '@/components/ui/PageHead'
import { Button } from '@/components/ui/Button'
import { ActionOrb } from '@/components/ui/ActionChip'
import { IconButton } from '@/components/ui/IconButton'
import { CircleCheck, CircleDashed, Pencil, Plus, Trash2 } from 'lucide-react-native'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { SelectField } from '@/components/ui/SelectField'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatCurrency, formatDate } from '@/utils/format'
import { colors, radius } from '@/theme'
import { successTap } from '@/utils/haptics'
import type { Bill } from '@/types'

const BILL_CATS = ['Rent', 'Utilities', 'Insurance', 'Credit cards', 'Other']
const empty = {
  id: '',
  title: '',
  category: '',
  amount: '',
  dueDate: '',
  accountId: '',
  status: 'unpaid',
}

export default function BillsScreen() {
  useEnsureData(['bills', 'accounts'])
  const { bills, accounts, loading, refresh, saveBill, toggleBillPaid, deleteBill } = useData()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(empty)
  const [tab, setTab] = useState<'unpaid' | 'paid'>('unpaid')
  const [busy, setBusy] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)

  const activeAccounts = useMemo(() => accounts.filter((a) => !a.archived), [accounts])
  const unpaid = bills.filter((b) => b.status === 'unpaid')
  const paid = bills.filter((b) => b.status === 'paid')
  const visible = tab === 'unpaid' ? unpaid : paid
  const dueTotal = useMemo(() => unpaid.reduce((s, b) => s + (Number(b.amount) || 0), 0), [unpaid])

  const accountName = (b: Bill) =>
    activeAccounts.find((a) => String(a.id) === String(b.accountId))?.name || '—'
  const dueOf = (b: Bill) => b.dueDate || b.due || ''

  const onSave = async () => {
    if (!form.title.trim() || !form.amount) return Alert.alert('Title and amount required')
    if (!form.category) return Alert.alert('Choose a category')
    setBusy(true)
    try {
      await saveBill({
        id: form.id || undefined,
        title: form.title.trim(),
        category: form.category,
        amount: form.amount,
        dueDate: form.dueDate,
        accountId: form.accountId || null,
        status: form.status,
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
    <Screen refreshing={loading} onRefresh={() => refresh(['bills', 'accounts'])}>
      <PageHead
        kicker="Due dates"
        title="Bills"
        subtitle={
          bills.length
            ? `Unpaid total ${formatCurrency(dueTotal)} · ${unpaid.length} pending`
            : 'Track rent, utilities, and other due dates.'
        }
        actions={<ActionOrb label="Add bill" icon={Plus} onPress={() => { setForm({ ...empty, dueDate: new Date().toISOString().slice(0, 10) }); setOpen(true) }} />}
      />

      {bills.length ? (
        <View style={styles.chips}>
          {(['unpaid', 'paid'] as const).map((t) => (
            <Pressable
              key={t}
              onPress={() => setTab(t)}
              style={[styles.chip, tab === t && styles.chipActive]}
            >
              <Text style={[styles.chipText, tab === t && styles.chipTextActive]}>
                {t === 'unpaid' ? `Unpaid (${unpaid.length})` : `Paid (${paid.length})`}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      {!bills.length ? <EmptyState title="No bills yet" /> : null}
      {bills.length && !visible.length ? (
        <EmptyState title={tab === 'unpaid' ? 'All caught up' : 'No paid bills yet'} />
      ) : null}

      <View style={styles.list}>
        {visible.map((b) => (
          <View key={b.id} style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.name}>{b.title}</Text>
              <Text style={styles.amt}>{formatCurrency(b.amount)}</Text>
            </View>
            <View style={styles.chips}>
              <Badge tone="neutral">{b.category}</Badge>
              <Badge tone={b.status === 'paid' ? 'success' : 'warning'}>{b.status}</Badge>
            </View>
            <Text style={styles.meta}>
              Due {formatDate(dueOf(b))} · {accountName(b)}
            </Text>
            <View style={styles.actions}>
              <IconButton
                label={b.status === 'unpaid' ? 'Mark paid' : 'Mark unpaid'}
                icon={b.status === 'unpaid' ? CircleCheck : CircleDashed}
                tone={b.status === 'unpaid' ? 'success' : 'warning'}
                loading={busyId === b.id}
                disabled={busyId !== null && busyId !== b.id}
                onPress={async () => {
                  setBusyId(b.id)
                  try {
                    await toggleBillPaid(b.id)
                    await successTap()
                  } catch (e: any) {
                    Alert.alert('Error', e.message)
                  } finally {
                    setBusyId(null)
                  }
                }}
              />
              <IconButton
                label="Edit bill"
                icon={Pencil}
                tone="brand"
                onPress={() => {
                  setForm({
                    id: b.id,
                    title: b.title,
                    category: b.category || '',
                    amount: String(b.amount),
                    dueDate: String(dueOf(b)).slice(0, 10),
                    accountId: b.accountId || '',
                    status: b.status || 'unpaid',
                  })
                  setOpen(true)
                }}
              />
              <IconButton
                label="Delete bill"
                icon={Trash2}
                tone="danger"
                loading={busyId === `del-${b.id}`}
                disabled={busyId !== null && busyId !== `del-${b.id}`}
                onPress={() =>
                  Alert.alert('Delete bill?', b.title, [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Delete',
                      style: 'destructive',
                      onPress: async () => {
                        setBusyId(`del-${b.id}`)
                        try {
                          await deleteBill(b.id)
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

      <Modal open={open} title={form.id ? 'Edit bill' : 'Add bill'} onClose={() => setOpen(false)}>
        <Input label="Title" value={form.title} onChangeText={(title) => setForm((f) => ({ ...f, title }))} />
        <SelectField
          label="Category"
          value={form.category}
          options={[
            { label: 'Select category…', value: '' },
            ...BILL_CATS.map((c) => ({ label: c, value: c })),
          ]}
          onChange={(category) => setForm((f) => ({ ...f, category }))}
        />
        <Input
          label="Amount (₹)"
          keyboardType="numeric"
          value={form.amount}
          onChangeText={(amount) => setForm((f) => ({ ...f, amount }))}
        />
        <Input
          label="Due date (YYYY-MM-DD)"
          value={form.dueDate}
          onChangeText={(dueDate) => setForm((f) => ({ ...f, dueDate }))}
          placeholder="2026-07-25"
        />
        <SelectField
          label="Account (optional)"
          value={form.accountId}
          options={[
            { label: 'None', value: '' },
            ...activeAccounts.map((a) => ({ label: a.name, value: a.id })),
          ]}
          onChange={(accountId) => setForm((f) => ({ ...f, accountId }))}
        />
        <Button loading={busy} onPress={onSave}>
          Save
        </Button>
      </Modal>
    </Screen>
  )
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.brandSoft, borderColor: colors.brand },
  chipText: { fontSize: 13, fontWeight: '600', color: colors.muted },
  chipTextActive: { color: colors.brand },
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
  meta: { color: colors.muted, fontSize: 13 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
})
