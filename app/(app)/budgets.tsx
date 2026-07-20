import { useState } from 'react'
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
import { ProgressBar } from '@/components/ui/ProgressBar'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatCurrency } from '@/utils/format'
import { colors, radius } from '@/theme'
import { successTap } from '@/utils/haptics'

export default function BudgetsScreen() {
  useEnsureData(['budgets', 'categories', 'notifications'])
  const { budgets, categories, loading, refresh, saveBudget, deleteBudget } = useData()
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [form, setForm] = useState({
    id: '',
    categoryId: '',
    period: 'monthly',
    limit: '',
    alertAt: '80',
  })
  const expenseCats = categories.filter((c) => c.type === 'expense' && !c.archived)
  const over = budgets.filter((b) => b.spent > b.limit)

  const onSave = async () => {
    if (!form.categoryId || !form.limit) return Alert.alert('Category and limit required')
    setBusy(true)
    try {
      await saveBudget({
        id: form.id || undefined,
        categoryId: form.categoryId,
        period: form.period,
        limit: form.limit,
        alertAt: form.alertAt,
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
    <Screen refreshing={loading} onRefresh={() => refresh(['budgets', 'categories'])}>
      <PageHead
        kicker="Limits"
        title="Budgets"
        subtitle="Track spending against category limits."
        actions={
          <ActionOrb
            label="Add budget"
            icon={Plus}
            disabled={!expenseCats.length}
            onPress={() => {
              setForm({
                id: '',
                categoryId: expenseCats[0]?.id || '',
                period: 'monthly',
                limit: '',
                alertAt: '80',
              })
              setOpen(true)
            }}
          />
        }
      />
      {over.length ? <Text style={styles.warn}>{over.length} budget(s) over limit</Text> : null}
      {!budgets.length ? <EmptyState title="No budgets yet" /> : null}
      <View style={styles.list}>
        {budgets.map((b) => (
          <View key={b.id} style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.name}>{b.category}</Text>
              <Badge tone="info">{b.period}</Badge>
            </View>
            <Text style={styles.meta}>
              {formatCurrency(b.spent)} / {formatCurrency(b.limit)}
            </Text>
            <ProgressBar value={b.spent} max={b.limit} warnOnOver overLabel="Over budget" />
            <View style={styles.actions}>
              <IconButton
                label="Edit budget"
                icon={Pencil}
                tone="brand"
                onPress={() => {
                  setForm({
                    id: b.id,
                    categoryId: b.categoryId,
                    period: String(b.period).toLowerCase(),
                    limit: String(b.limit),
                    alertAt: String(b.alertAt ?? 80),
                  })
                  setOpen(true)
                }}
              />
              <IconButton
                label="Delete budget"
                icon={Trash2}
                tone="danger"
                loading={busyId === b.id}
                disabled={busyId !== null && busyId !== b.id}
                onPress={() =>
                  Alert.alert('Delete budget?', String(b.category || 'Budget'), [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Delete',
                      style: 'destructive',
                      onPress: async () => {
                        setBusyId(b.id)
                        try {
                          await deleteBudget(b.id)
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
      <Modal open={open} title={form.id ? 'Edit budget' : 'New budget'} onClose={() => setOpen(false)}>
        <SelectField
          label="Category"
          value={form.categoryId}
          options={expenseCats.map((c) => ({ label: c.name, value: c.id }))}
          onChange={(categoryId) => setForm((f) => ({ ...f, categoryId }))}
        />
        <SelectField
          label="Period"
          value={form.period}
          options={[
            { label: 'Weekly', value: 'weekly' },
            { label: 'Monthly', value: 'monthly' },
            { label: 'Yearly', value: 'yearly' },
          ]}
          onChange={(period) => setForm((f) => ({ ...f, period }))}
        />
        <Input
          label="Limit (₹)"
          keyboardType="numeric"
          value={form.limit}
          onChangeText={(limit) => setForm((f) => ({ ...f, limit }))}
        />
        <Input
          label="Alert at (%)"
          keyboardType="numeric"
          value={form.alertAt}
          onChangeText={(alertAt) => setForm((f) => ({ ...f, alertAt }))}
        />
        <Button loading={busy} onPress={onSave}>
          Save
        </Button>
      </Modal>
    </Screen>
  )
}

const styles = StyleSheet.create({
  warn: { color: colors.danger, fontWeight: '700', marginBottom: 10 },
  list: { gap: 10 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    gap: 8,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontWeight: '800', color: colors.ink },
  meta: { color: colors.muted, fontSize: 13 },
  actions: { flexDirection: 'row', gap: 8 },
})
