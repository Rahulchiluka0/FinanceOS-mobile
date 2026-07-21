import { useMemo, useState } from 'react'
import { Alert, StyleSheet, Text, View } from 'react-native'
import {
  Archive,
  ArrowLeftRight,
  Banknote,
  Building2,
  CreditCard,
  Pencil,
  Plus,
  Smartphone,
  Wallet,
} from 'lucide-react-native'
import { useData, useEnsureData } from '@/context/DataContext'
import { Screen } from '@/components/layout/Screen'
import { PageHead } from '@/components/ui/PageHead'
import { Button } from '@/components/ui/Button'
import { ActionChip, ActionOrb } from '@/components/ui/ActionChip'
import { IconButton } from '@/components/ui/IconButton'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { SelectField } from '@/components/ui/SelectField'
import { ColorField } from '@/components/ui/ColorField'
import { EmptyState } from '@/components/ui/EmptyState'
import { LoadingState } from '@/components/ui/LoadingState'
import { formatCurrency } from '@/utils/format'
import { colors, radius } from '@/theme'
import { successTap } from '@/utils/haptics'
import type { Account } from '@/types'

const TYPES = [
  { label: 'Cash', value: 'cash' },
  { label: 'Bank', value: 'bank' },
  { label: 'Wallet', value: 'wallet' },
  { label: 'Credit Card', value: 'credit_card' },
  { label: 'UPI', value: 'upi' },
]

const TYPE_META: Record<
  string,
  { label: string; Icon: typeof Wallet }
> = {
  cash: { label: 'Cash', Icon: Banknote },
  bank: { label: 'Bank', Icon: Building2 },
  wallet: { label: 'Wallet', Icon: Wallet },
  credit_card: { label: 'Credit card', Icon: CreditCard },
  upi: { label: 'UPI', Icon: Smartphone },
}

const emptyForm = {
  id: '',
  name: '',
  type: 'bank',
  openingBalance: '0',
  balance: '',
  color: '#1A56DB',
}

function typeKey(type?: string) {
  return String(type || 'bank')
    .toLowerCase()
    .replace(/\s+/g, '_')
}

export default function AccountsScreen() {
  useEnsureData(['accounts'])
  const { accounts, loading, refresh, saveAccount, archiveAccount, transferMoney } = useData()
  const [editOpen, setEditOpen] = useState(false)
  const [transferOpen, setTransferOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [transfer, setTransfer] = useState({ fromId: '', toId: '', amount: '' })
  const [busy, setBusy] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)

  const active = useMemo(() => accounts.filter((a) => !a.archived), [accounts])
  const total = active.reduce((s, a) => s + (Number(a.balance) || 0), 0)

  const openCreate = () => {
    setForm(emptyForm)
    setEditOpen(true)
  }

  const openEdit = (a: Account) => {
    setForm({
      id: a.id,
      name: a.name,
      type: typeKey(String(a.type || 'bank')),
      openingBalance: String(a.openingBalance ?? 0),
      balance: String(a.balance ?? 0),
      color: a.color || '#1A56DB',
    })
    setEditOpen(true)
  }

  const openTransfer = () => {
    const fromId = active[0]?.id || ''
    const toId = active.find((a) => a.id !== fromId)?.id || ''
    setTransfer({ fromId, toId, amount: '' })
    setTransferOpen(true)
  }

  const onSave = async () => {
    if (!form.name.trim()) return Alert.alert('Name is required')
    setBusy(true)
    try {
      await saveAccount({
        id: form.id || undefined,
        name: form.name.trim(),
        type: form.type,
        openingBalance: form.openingBalance,
        balance: form.id ? form.balance : undefined,
        color: form.color,
      })
      await successTap()
      setEditOpen(false)
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to save account')
    } finally {
      setBusy(false)
    }
  }

  const onTransfer = async () => {
    if (!transfer.fromId || !transfer.toId || !transfer.amount) {
      return Alert.alert('Fill all transfer fields')
    }
    if (transfer.fromId === transfer.toId) {
      return Alert.alert('Choose two different accounts')
    }
    setBusy(true)
    try {
      await transferMoney({
        fromId: transfer.fromId,
        toId: transfer.toId,
        amount: Number(transfer.amount),
      })
      await successTap()
      setTransferOpen(false)
      setTransfer({ fromId: '', toId: '', amount: '' })
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Transfer failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Screen refreshing={loading} onRefresh={() => refresh(['accounts'])}>
      <PageHead
        kicker="Accounts"
        title="Wallets"
        subtitle={`${active.length} active · manage balances & transfers`}
        actions={
          <>
            <ActionChip
              label="Transfer"
              tone="soft"
              icon={ArrowLeftRight}
              disabled={active.length < 2}
              onPress={openTransfer}
            />
            <ActionOrb label="Add account" icon={Plus} onPress={openCreate} />
          </>
        }
      />

      {active.length > 0 ? (
        <View style={styles.summary}>
          <Text style={styles.summaryLabel}>Combined balance</Text>
          <Text style={styles.summaryValue}>{formatCurrency(total)}</Text>
          <View style={styles.summaryDots}>
            {active.slice(0, 6).map((a) => (
              <View
                key={a.id}
                style={[styles.dot, { backgroundColor: a.color || colors.brand }]}
              />
            ))}
            {active.length > 6 ? (
              <Text style={styles.moreDots}>+{active.length - 6}</Text>
            ) : null}
          </View>
        </View>
      ) : null}

      {loading && !accounts.length ? <LoadingState /> : null}
      {!loading && active.length === 0 ? (
        <EmptyState
          title="No accounts yet"
          subtitle="Add a bank, cash, or UPI wallet to get started."
        />
      ) : null}

      <View style={styles.list}>
        {active.map((a) => {
          const key = typeKey(String(a.type))
          const meta = TYPE_META[key] || TYPE_META.bank
          const Icon = meta.Icon
          const accent = a.color || colors.brand

          return (
            <View key={a.id} style={styles.card}>
              <View style={[styles.cardAccent, { backgroundColor: accent }]} />
              <View style={styles.cardBody}>
                <View style={styles.cardTop}>
                  <View style={[styles.avatar, { backgroundColor: `${accent}22` }]}>
                    <Icon size={20} color={accent} strokeWidth={2.2} />
                  </View>
                  <View style={styles.cardCopy}>
                    <Text style={styles.name} numberOfLines={1}>
                      {a.name}
                    </Text>
                    <Text style={styles.type}>{meta.label}</Text>
                  </View>
                  <View style={styles.actions}>
                    <IconButton
                      label="Edit account"
                      icon={Pencil}
                      tone="brand"
                      onPress={() => openEdit(a)}
                    />
                    <IconButton
                      label="Archive account"
                      icon={Archive}
                      tone="danger"
                      loading={busyId === a.id}
                      disabled={busyId !== null && busyId !== a.id}
                      onPress={() =>
                        Alert.alert('Archive account?', a.name, [
                          { text: 'Cancel', style: 'cancel' },
                          {
                            text: 'Archive',
                            style: 'destructive',
                            onPress: async () => {
                              setBusyId(a.id)
                              try {
                                await archiveAccount(a.id)
                                await successTap()
                              } catch (err: any) {
                                Alert.alert('Error', err.message || 'Failed to archive')
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

                <View style={styles.balanceRow}>
                  <View>
                    <Text style={styles.balanceLabel}>Available</Text>
                    <Text style={styles.balance}>{formatCurrency(a.balance)}</Text>
                  </View>
                  <View style={styles.openingBox}>
                    <Text style={styles.openingLabel}>Opening</Text>
                    <Text style={styles.openingValue}>
                      {formatCurrency(a.openingBalance || 0)}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          )
        })}
      </View>

      <Modal
        open={editOpen}
        title={form.id ? 'Edit account' : 'New account'}
        onClose={() => setEditOpen(false)}
      >
        <Input
          label="Name"
          placeholder="e.g. HDFC Savings"
          value={form.name}
          onChangeText={(name) => setForm((f) => ({ ...f, name }))}
        />
        <SelectField
          label="Type"
          value={form.type}
          options={TYPES}
          onChange={(type) => setForm((f) => ({ ...f, type }))}
        />
        <Input
          label="Opening balance"
          placeholder="0"
          keyboardType="numeric"
          value={form.openingBalance}
          onChangeText={(openingBalance) => setForm((f) => ({ ...f, openingBalance }))}
        />
        {form.id ? (
          <Input
            label="Current balance"
            placeholder="0"
            keyboardType="numeric"
            value={form.balance}
            onChangeText={(balance) => setForm((f) => ({ ...f, balance }))}
          />
        ) : null}
        <ColorField value={form.color} onChange={(color) => setForm((f) => ({ ...f, color }))} />
        <Button loading={busy} onPress={onSave} block>
          Save account
        </Button>
      </Modal>

      <Modal open={transferOpen} title="Transfer money" onClose={() => setTransferOpen(false)}>
        <SelectField
          label="From"
          value={transfer.fromId}
          options={active.map((a) => ({ label: a.name, value: a.id }))}
          onChange={(fromId) => setTransfer((t) => ({ ...t, fromId }))}
        />
        <SelectField
          label="To"
          value={transfer.toId}
          options={active.map((a) => ({ label: a.name, value: a.id }))}
          onChange={(toId) => setTransfer((t) => ({ ...t, toId }))}
        />
        <Input
          label="Amount"
          placeholder="e.g. 5000"
          keyboardType="numeric"
          value={transfer.amount}
          onChangeText={(amount) => setTransfer((t) => ({ ...t, amount }))}
        />
        <Button loading={busy} onPress={onTransfer} block>
          Transfer
        </Button>
      </Modal>
    </Screen>
  )
}

const styles = StyleSheet.create({
  summary: {
    backgroundColor: colors.ink,
    borderRadius: radius.lg,
    paddingHorizontal: 18,
    paddingVertical: 16,
    marginBottom: 16,
    gap: 4,
  },
  summaryLabel: {
    color: 'rgba(240,246,255,0.65)',
    fontSize: 12,
    fontWeight: '600',
  },
  summaryValue: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.6,
  },
  summaryDots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  moreDots: {
    color: 'rgba(240,246,255,0.55)',
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 2,
  },
  list: { gap: 12 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  cardAccent: {
    width: 4,
  },
  cardBody: {
    flex: 1,
    padding: 14,
    gap: 14,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  name: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.ink,
    letterSpacing: -0.2,
  },
  type: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.muted,
    textTransform: 'capitalize',
  },
  actions: {
    flexDirection: 'row',
    gap: 6,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 12,
    paddingTop: 2,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  balanceLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  balance: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.ink,
    letterSpacing: -0.4,
  },
  openingBox: {
    alignItems: 'flex-end',
    backgroundColor: colors.bgElevated,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
  },
  openingLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  openingValue: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.inkSoft,
    marginTop: 2,
  },
})
