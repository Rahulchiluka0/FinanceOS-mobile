import { useCallback, useEffect, useState } from 'react'
import { Alert, Keyboard, Pressable, StyleSheet, Text, View } from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { Copy, Pencil, Plus, Star, Trash2 } from 'lucide-react-native'
import { transactionsApi } from '@/api'
import { useData, useEnsureData } from '@/context/DataContext'
import { Screen } from '@/components/layout/Screen'
import { PageHead } from '@/components/ui/PageHead'
import { Button } from '@/components/ui/Button'
import { ActionOrb } from '@/components/ui/ActionChip'
import { IconButton } from '@/components/ui/IconButton'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { SelectField } from '@/components/ui/SelectField'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { LoadingState } from '@/components/ui/LoadingState'
import { useDebounce } from '@/hooks/useDebounce'
import { formatCurrency, formatDate } from '@/utils/format'
import { colors, radius } from '@/theme'
import { successTap } from '@/utils/haptics'
import type { Transaction } from '@/types'

const PAGE_SIZE = 20

const emptyForm = {
  id: '',
  title: '',
  type: 'expense',
  amount: '',
  accountId: '',
  toAccountId: '',
  categoryId: '',
  date: new Date().toISOString().slice(0, 10),
  notes: '',
  receipt: false,
  receiptUrl: '',
  tags: [] as string[],
  tagInput: '',
}

export default function TransactionsScreen() {
  useEnsureData(['accounts', 'categories', 'tags'])
  const {
    accounts,
    categories,
    tags,
    saveTransaction,
    deleteTransaction,
    toggleFavorite,
    duplicateTransaction,
  } = useData()

  const [q, setQ] = useState('')
  const debouncedQ = useDebounce(q, 300)
  const [type, setType] = useState('all')
  const [tag, setTag] = useState('all')
  const [page, setPage] = useState(1)
  const [rows, setRows] = useState<Transaction[]>([])
  const [meta, setMeta] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [editOpen, setEditOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [busy, setBusy] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)

  const activeAccounts = accounts.filter((a) => !a.archived)
  const activeCategories = categories.filter((c) => !c.archived)

  const loadPage = useCallback(async () => {
    setLoading(true)
    try {
      const result = await transactionsApi.listPage({
        page,
        limit: PAGE_SIZE,
        q: debouncedQ || undefined,
        type: type === 'all' ? undefined : type,
        tag: tag === 'all' ? undefined : tag,
      })
      setRows((result.data || []) as Transaction[])
      setMeta(result.meta)
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to load transactions')
    } finally {
      setLoading(false)
    }
  }, [page, debouncedQ, type, tag])

  useEffect(() => {
    setPage(1)
  }, [debouncedQ, type, tag])

  useEffect(() => {
    loadPage()
  }, [loadPage])

  const openCreate = () => {
    setForm({
      ...emptyForm,
      accountId: activeAccounts[0]?.id || '',
      toAccountId: activeAccounts[1]?.id || '',
      categoryId: activeCategories.find((c) => c.type === 'expense')?.id || '',
    })
    setEditOpen(true)
  }

  const openEdit = (t: Transaction) => {
    setForm({
      id: t.id,
      title: t.title,
      type: t.type,
      amount: String(t.amount),
      accountId: t.accountId,
      toAccountId: t.toAccountId || '',
      categoryId: t.categoryId || '',
      date: t.date?.slice(0, 10) || '',
      notes: t.notes || '',
      receipt: Boolean(t.receipt || t.receiptUrl),
      receiptUrl: t.receiptUrl || '',
      tags: t.tags || [],
      tagInput: '',
    })
    setEditOpen(true)
  }

  const scanReceipt = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync()
    if (!perm.granted) {
      Alert.alert('Camera permission needed to scan receipts')
      return
    }
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.6,
      allowsEditing: true,
    })
    if (!result.canceled && result.assets[0]) {
      setForm((f) => ({
        ...f,
        receipt: true,
        receiptUrl: result.assets[0].uri,
      }))
      await successTap()
    }
  }

  const onSave = async () => {
    if (!form.title.trim() || !form.amount) return Alert.alert('Title and amount are required')
    setBusy(true)
    try {
      await saveTransaction({
        id: form.id || undefined,
        title: form.title.trim(),
        type: form.type,
        amount: form.amount,
        accountId: form.accountId,
        toAccountId: form.toAccountId || undefined,
        categoryId: form.categoryId || undefined,
        date: form.date,
        notes: form.notes,
        receipt: form.receipt,
        receiptUrl: form.receiptUrl,
        tags: form.tags,
      })
      await successTap()
      setEditOpen(false)
      await loadPage()
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to save')
    } finally {
      setBusy(false)
    }
  }

  const addTag = () => {
    const normalized = String(form.tagInput ?? '')
      .trim()
      .toLowerCase()
      .replace(/^#/, '')
      .replace(/\s+/g, '-')
    if (!normalized) return

    Keyboard.dismiss()
    setForm((f) => {
      const current = Array.isArray(f.tags) ? f.tags : []
      if (current.includes(normalized)) return { ...f, tagInput: '' }
      return { ...f, tags: [...current, normalized], tagInput: '' }
    })
  }

  return (
    <Screen refreshing={loading} onRefresh={loadPage}>
      <PageHead
        kicker="Ledger"
        title="Transactions"
        subtitle="Search, filter, and manage your money moves."
        actions={<ActionOrb label="Add transaction" icon={Plus} onPress={openCreate} />}
      />

      <Input placeholder="Search transactions…" value={q} onChangeText={setQ} />
      <SelectField
        label="Type"
        value={type}
        options={[
          { label: 'All', value: 'all' },
          { label: 'Income', value: 'income' },
          { label: 'Expense', value: 'expense' },
          { label: 'Transfer', value: 'transfer' },
        ]}
        onChange={setType}
      />
      {tags.length > 0 ? (
        <SelectField
          label="Tag"
          value={tag}
          options={[{ label: 'All tags', value: 'all' }, ...tags.map((t) => ({ label: t.name, value: t.name }))]}
          onChange={setTag}
        />
      ) : null}

      {loading && !rows.length ? <LoadingState /> : null}
      {!loading && rows.length === 0 ? (
        <EmptyState title="No transactions" subtitle="Try adjusting filters or add your first entry." />
      ) : null}

      <View style={styles.list}>
        {rows.map((t) => (
          <View key={t.id} style={styles.card}>
            <View style={styles.cardTop}>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>{t.title}</Text>
                <Text style={styles.meta}>
                  {t.category || t.type} · {t.account} · {formatDate(t.date)}
                </Text>
                {t.tags?.length ? (
                  <View style={styles.tags}>
                    {t.tags.map((tg) => (
                      <Badge key={tg} tone="neutral">
                        #{tg}
                      </Badge>
                    ))}
                  </View>
                ) : null}
              </View>
              <View style={{ alignItems: 'flex-end', gap: 4 }}>
                <Badge
                  tone={t.type === 'income' ? 'success' : t.type === 'expense' ? 'danger' : 'info'}
                >
                  {t.type}
                </Badge>
                <Text
                  style={[
                    styles.amount,
                    {
                      color:
                        t.type === 'income'
                          ? colors.success
                          : t.type === 'expense'
                            ? colors.danger
                            : colors.ink,
                    },
                  ]}
                >
                  {formatCurrency(t.amount)}
                </Text>
              </View>
            </View>
            <View style={styles.actions}>
              <IconButton
                label={t.favorite ? 'Unfavorite' : 'Favorite'}
                icon={Star}
                tone={t.favorite ? 'warning' : 'muted'}
                loading={busyId === `fav-${t.id}`}
                disabled={busyId !== null}
                onPress={async () => {
                  setBusyId(`fav-${t.id}`)
                  try {
                    await toggleFavorite(t.id)
                    await loadPage()
                    await successTap()
                  } catch (e: any) {
                    Alert.alert('Error', e.message)
                  } finally {
                    setBusyId(null)
                  }
                }}
              />
              <IconButton
                label="Duplicate"
                icon={Copy}
                tone="muted"
                loading={busyId === `dup-${t.id}`}
                disabled={busyId !== null}
                onPress={async () => {
                  setBusyId(`dup-${t.id}`)
                  try {
                    await duplicateTransaction(t.id)
                    await loadPage()
                    await successTap()
                  } catch (e: any) {
                    Alert.alert('Error', e.message)
                  } finally {
                    setBusyId(null)
                  }
                }}
              />
              <IconButton label="Edit" icon={Pencil} tone="brand" onPress={() => openEdit(t)} />
              <IconButton
                label="Delete"
                icon={Trash2}
                tone="danger"
                loading={busyId === `del-${t.id}`}
                disabled={busyId !== null}
                onPress={() =>
                  Alert.alert('Delete transaction?', t.title, [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Delete',
                      style: 'destructive',
                      onPress: async () => {
                        setBusyId(`del-${t.id}`)
                        try {
                          await deleteTransaction(t.id)
                          await loadPage()
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

      {meta ? (
        <View style={styles.pager}>
          <Button size="sm" variant="ghost" disabled={page <= 1} onPress={() => setPage((p) => p - 1)}>
            Prev
          </Button>
          <Text style={styles.meta}>
            Page {meta.page || page} / {meta.totalPages || 1}
          </Text>
          <Button
            size="sm"
            variant="ghost"
            disabled={page >= (meta.totalPages || 1)}
            onPress={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </View>
      ) : null}

      <Modal open={editOpen} title={form.id ? 'Edit transaction' : 'New transaction'} onClose={() => setEditOpen(false)}>
        <Input
          label="Title"
          placeholder="e.g. Swiggy order"
          value={form.title}
          onChangeText={(title) => setForm((f) => ({ ...f, title }))}
        />
        <SelectField
          label="Type"
          value={form.type}
          options={[
            { label: 'Income', value: 'income' },
            { label: 'Expense', value: 'expense' },
            { label: 'Transfer', value: 'transfer' },
          ]}
          onChange={(type) => setForm((f) => ({ ...f, type }))}
        />
        <Input
          label="Amount"
          placeholder="e.g. 640"
          keyboardType="numeric"
          value={form.amount}
          onChangeText={(amount) => setForm((f) => ({ ...f, amount }))}
        />
        {form.type !== 'transfer' ? (
          <SelectField
            label="Category"
            value={form.categoryId}
            options={activeCategories
              .filter((c) => c.type === form.type || form.type === 'transfer')
              .map((c) => ({ label: c.name, value: c.id }))}
            onChange={(categoryId) => setForm((f) => ({ ...f, categoryId }))}
          />
        ) : null}
        <SelectField
          label={form.type === 'transfer' ? 'From account' : 'Account'}
          value={form.accountId}
          options={activeAccounts.map((a) => ({ label: a.name, value: a.id }))}
          onChange={(accountId) => setForm((f) => ({ ...f, accountId }))}
        />
        {form.type === 'transfer' ? (
          <SelectField
            label="To account"
            value={form.toAccountId}
            options={activeAccounts.map((a) => ({ label: a.name, value: a.id }))}
            onChange={(toAccountId) => setForm((f) => ({ ...f, toAccountId }))}
          />
        ) : null}
        <Input
          label="Date (YYYY-MM-DD)"
          placeholder="2026-07-21"
          value={form.date}
          onChangeText={(date) => setForm((f) => ({ ...f, date }))}
        />
        <Input
          label="Notes"
          placeholder="Optional notes…"
          value={form.notes}
          onChangeText={(notes) => setForm((f) => ({ ...f, notes }))}
        />
        <View style={styles.tagRow}>
          <View style={{ flex: 1 }}>
            <Input
              label="Add tag"
              placeholder="Add tag, e.g. travel"
              value={form.tagInput}
              onChangeText={(tagInput) => setForm((f) => ({ ...f, tagInput }))}
              onSubmitEditing={addTag}
              returnKeyType="done"
              blurOnSubmit
            />
          </View>
          <Button size="sm" variant="secondary" onPress={addTag} style={styles.tagAddBtn}>
            Add
          </Button>
        </View>
        <View style={styles.tags}>
          {(form.tags || []).map((tg) => (
            <Pressable
              key={tg}
              onPress={() =>
                setForm((f) => ({
                  ...f,
                  tags: (Array.isArray(f.tags) ? f.tags : []).filter((x) => x !== tg),
                }))
              }
              style={styles.tagChip}
              accessibilityLabel={`Remove tag ${tg}`}
            >
              <Text style={styles.tagChipText}>{`#${tg} ×`}</Text>
            </Pressable>
          ))}
        </View>
        <Button variant="secondary" onPress={scanReceipt}>
          {form.receipt ? 'Receipt attached · Rescan' : 'Scan receipt (camera)'}
        </Button>
        <Button loading={busy} onPress={onSave}>
          Save transaction
        </Button>
      </Modal>
    </Screen>
  )
}

const styles = StyleSheet.create({
  list: { gap: 10, marginTop: 12 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    gap: 10,
  },
  cardTop: { flexDirection: 'row', gap: 10 },
  title: { fontSize: 15, fontWeight: '800', color: colors.ink },
  meta: { fontSize: 12, color: colors.muted, marginTop: 2 },
  amount: { fontSize: 16, fontWeight: '800' },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
  actions: { flexDirection: 'row', gap: 18 },
  pager: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  tagRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-end' },
  tagAddBtn: { marginBottom: 2 },
  tagChip: {
    backgroundColor: colors.brandSoft,
    borderRadius: radius.full,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  tagChipText: { fontSize: 12, fontWeight: '700', color: colors.brand },
})
