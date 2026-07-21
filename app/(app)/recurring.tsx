import { useMemo, useState } from 'react'
import { Alert, StyleSheet, Text, View } from 'react-native'
import { useData, useEnsureData } from '@/context/DataContext'
import { Screen } from '@/components/layout/Screen'
import { PageHead } from '@/components/ui/PageHead'
import { Button } from '@/components/ui/Button'
import { ActionOrb } from '@/components/ui/ActionChip'
import { IconButton } from '@/components/ui/IconButton'
import { Pause, Pencil, Play, Plus, SkipForward, Square, Trash2 } from 'lucide-react-native'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { SelectField } from '@/components/ui/SelectField'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatCurrency, formatDate } from '@/utils/format'
import { colors, radius } from '@/theme'
import { successTap } from '@/utils/haptics'
import type { Recurring } from '@/types'

const empty = {
  id: '',
  title: '',
  amount: '',
  frequency: 'monthly',
  type: '',
  nextDate: '',
  accountId: '',
  categoryId: '',
}

export default function RecurringScreen() {
  useEnsureData(['recurring', 'accounts', 'categories'])
  const {
    recurring,
    accounts,
    categories,
    loading,
    refresh,
    saveRecurring,
    setRecurringStatus,
    skipRecurring,
    deleteRecurring,
  } = useData()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(empty)
  const [busy, setBusy] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)

  const activeAccounts = useMemo(() => accounts.filter((a) => !a.archived), [accounts])
  const categoryOptions = categories.filter(
    (c) =>
      !c.archived &&
      form.type &&
      (form.type === 'income' ? c.type === 'income' : c.type === 'expense'),
  )

  const accountName = (r: Recurring) =>
    r.account || activeAccounts.find((a) => String(a.id) === String(r.accountId))?.name || '—'
  const categoryName = (r: Recurring) =>
    r.category || categories.find((c) => String(c.id) === String(r.categoryId))?.name || null

  const onSave = async () => {
    if (!form.title.trim() || !form.amount) return Alert.alert('Title and amount required')
    if (!form.type) return Alert.alert('Choose a type (income or expense)')
    if (!form.accountId) return Alert.alert('Choose an account')
    setBusy(true)
    try {
      await saveRecurring({
        id: form.id || undefined,
        title: form.title.trim(),
        amount: form.amount,
        frequency: form.frequency,
        type: form.type,
        nextDate: form.nextDate,
        accountId: form.accountId,
        categoryId: form.categoryId || null,
      })
      await successTap()
      setOpen(false)
    } catch (e: any) {
      Alert.alert('Error', e.message)
    } finally {
      setBusy(false)
    }
  }

  const runAction = async (id: string, fn: () => Promise<void>) => {
    if (busyId) return
    setBusyId(id)
    try {
      await fn()
      await successTap()
    } catch (e: any) {
      Alert.alert('Error', e.message)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <Screen refreshing={loading} onRefresh={() => refresh(['recurring', 'accounts', 'categories'])}>
      <PageHead
        kicker="Automation"
        title="Recurring"
        subtitle="Auto-create daily, weekly, monthly, or custom entries."
        actions={<ActionOrb label="Add recurring" icon={Plus} onPress={() => { setForm({ ...empty, nextDate: new Date().toISOString().slice(0, 10) }); setOpen(true) }} />}
      />
      {!recurring.length ? <EmptyState title="No recurring rules yet" /> : null}
      <View style={styles.list}>
        {recurring.map((r) => {
          const cat = categoryName(r)
          const tone = r.status === 'active' ? 'success' : r.status === 'paused' ? 'warning' : 'neutral'
          return (
            <View key={r.id} style={styles.card}>
              <View style={styles.row}>
                <Text style={styles.name}>{r.title}</Text>
                <Text style={[styles.amt, r.type === 'income' ? styles.pos : styles.neg]}>
                  {r.type === 'income' ? '+' : '−'}
                  {formatCurrency(r.amount)}
                </Text>
              </View>
              <View style={styles.chips}>
                <Badge tone={r.type === 'income' ? 'success' : 'neutral'}>{r.type}</Badge>
                <Badge tone={tone}>{r.status}</Badge>
                {cat ? <Badge tone="neutral">{cat}</Badge> : null}
              </View>
              <Text style={styles.meta}>
                {r.frequency} · Next {formatDate(r.nextDate)} · {accountName(r)}
              </Text>
              <View style={styles.actions}>
                {r.status !== 'ended' ? (
                  <IconButton
                    label={r.status === 'active' ? 'Pause' : 'Resume'}
                    icon={r.status === 'active' ? Pause : Play}
                    tone="muted"
                    loading={busyId === r.id}
                    disabled={busyId !== null && busyId !== r.id}
                    onPress={() =>
                      runAction(r.id, () =>
                        setRecurringStatus(r.id, r.status === 'active' ? 'paused' : 'active'),
                      )
                    }
                  />
                ) : null}
                {r.status === 'active' ? (
                  <IconButton
                    label="Skip"
                    icon={SkipForward}
                    tone="warning"
                    loading={busyId === r.id}
                    disabled={busyId !== null && busyId !== r.id}
                    onPress={() => runAction(r.id, () => skipRecurring(r.id))}
                  />
                ) : null}
                {r.status !== 'ended' ? (
                  <IconButton
                    label="End"
                    icon={Square}
                    tone="muted"
                    loading={busyId === r.id}
                    disabled={busyId !== null && busyId !== r.id}
                    onPress={() => runAction(r.id, () => setRecurringStatus(r.id, 'ended'))}
                  />
                ) : null}
                <IconButton
                  label="Edit recurring"
                  icon={Pencil}
                  tone="brand"
                  onPress={() => {
                    setForm({
                      id: r.id,
                      title: r.title,
                      amount: String(r.amount),
                      frequency: String(r.frequency || 'monthly').toLowerCase(),
                      type: r.type,
                      nextDate: String(r.nextDate || '').slice(0, 10),
                      accountId: r.accountId || '',
                      categoryId: r.categoryId || '',
                    })
                    setOpen(true)
                  }}
                />
                <IconButton
                  label="Delete recurring"
                  icon={Trash2}
                  tone="danger"
                  loading={busyId === r.id}
                  disabled={busyId !== null && busyId !== r.id}
                  onPress={() =>
                    Alert.alert('Delete rule?', r.title, [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Delete',
                        style: 'destructive',
                        onPress: () => runAction(r.id, () => deleteRecurring(r.id)),
                      },
                    ])
                  }
                />
              </View>
            </View>
          )
        })}
      </View>

      <Modal open={open} title={form.id ? 'Edit recurring' : 'Add recurring'} onClose={() => setOpen(false)}>
        <Input
          label="Title"
          placeholder="e.g. Salary"
          value={form.title}
          onChangeText={(title) => setForm((f) => ({ ...f, title }))}
        />
        <Input
          label="Amount (₹)"
          placeholder="e.g. 75000"
          keyboardType="numeric"
          value={form.amount}
          onChangeText={(amount) => setForm((f) => ({ ...f, amount }))}
        />
        <SelectField
          label="Frequency"
          value={form.frequency}
          options={[
            { label: 'Daily', value: 'daily' },
            { label: 'Weekly', value: 'weekly' },
            { label: 'Monthly', value: 'monthly' },
            { label: 'Yearly', value: 'yearly' },
            { label: 'Custom', value: 'custom' },
          ]}
          onChange={(frequency) => setForm((f) => ({ ...f, frequency }))}
        />
        <SelectField
          label="Type"
          value={form.type}
          options={[
            { label: 'Select type…', value: '' },
            { label: 'Expense', value: 'expense' },
            { label: 'Income', value: 'income' },
          ]}
          onChange={(type) => setForm((f) => ({ ...f, type, categoryId: '' }))}
        />
        <SelectField
          label="Account"
          value={form.accountId}
          options={[
            { label: 'Select account…', value: '' },
            ...activeAccounts.map((a) => ({ label: a.name, value: a.id })),
          ]}
          onChange={(accountId) => setForm((f) => ({ ...f, accountId }))}
        />
        <SelectField
          label="Category (optional)"
          value={form.categoryId}
          options={[
            { label: 'None', value: '' },
            ...categoryOptions.map((c) => ({ label: c.name, value: c.id })),
          ]}
          onChange={(categoryId) => setForm((f) => ({ ...f, categoryId }))}
        />
        <Input
          label="Next date (YYYY-MM-DD)"
          value={form.nextDate}
          onChangeText={(nextDate) => setForm((f) => ({ ...f, nextDate }))}
          placeholder="2026-07-20"
        />
        <Button loading={busy} onPress={onSave}>
          Save
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
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  name: { fontWeight: '800', color: colors.ink, flex: 1 },
  amt: { fontWeight: '800' },
  pos: { color: colors.success },
  neg: { color: colors.danger },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  meta: { color: colors.muted, fontSize: 13 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
})
