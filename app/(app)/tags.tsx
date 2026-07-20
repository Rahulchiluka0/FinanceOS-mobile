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
import { ColorField } from '@/components/ui/ColorField'
import { EmptyState } from '@/components/ui/EmptyState'
import { colors, radius } from '@/theme'
import { successTap } from '@/utils/haptics'

const empty = { id: '', name: '', color: '#1A56DB' }

export default function TagsScreen() {
  useEnsureData(['tags', 'transactions'])
  const { tags, transactions, loading, refresh, saveTag, deleteTag } = useData()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(empty)
  const [filter, setFilter] = useState('')
  const [busy, setBusy] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)

  const counts = useMemo(() => {
    const map: Record<string, number> = {}
    transactions.forEach((tx) =>
      (tx.tags || []).forEach((t) => {
        map[t] = (map[t] || 0) + 1
      }),
    )
    return map
  }, [transactions])

  const filtered = tags.filter(
    (t) => !filter || t.name.toLowerCase().includes(filter.toLowerCase()),
  )

  const onSave = async () => {
    if (!form.name.trim()) return Alert.alert('Name is required')
    setBusy(true)
    try {
      await saveTag({
        id: form.id || undefined,
        name: form.name.trim(),
        color: form.color,
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
    <Screen refreshing={loading} onRefresh={() => refresh(['tags', 'transactions'])}>
      <PageHead
        kicker="Labels"
        title="Tags"
        subtitle="Organize transactions — filter by tag in the ledger."
        actions={<ActionOrb label="Add tag" icon={Plus} onPress={() => { setForm(empty); setOpen(true) }} />}
      />

      <Input
        label="Filter"
        placeholder="Filter tags…"
        value={filter}
        onChangeText={setFilter}
      />

      {!filtered.length ? <EmptyState title="No tags match your filter" /> : null}
      <View style={styles.list}>
        {filtered.map((t) => (
          <View key={t.id} style={styles.card}>
            <View style={[styles.dot, { backgroundColor: t.color || colors.brand }]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>#{t.name}</Text>
              <Text style={styles.meta}>
                {counts[t.name] || 0} transaction{(counts[t.name] || 0) !== 1 ? 's' : ''}
              </Text>
            </View>
            <IconButton
              label="Edit tag"
              icon={Pencil}
              tone="brand"
              onPress={() => {
                setForm({ id: t.id, name: t.name, color: t.color || '#1A56DB' })
                setOpen(true)
              }}
            />
            <IconButton
              label="Delete tag"
              icon={Trash2}
              tone="danger"
              loading={busyId === t.id}
              disabled={busyId !== null && busyId !== t.id}
              onPress={() =>
                Alert.alert('Delete tag?', `#${t.name}`, [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                      setBusyId(t.id)
                      try {
                        await deleteTag(t.id)
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
        ))}
      </View>

      <Modal open={open} title={form.id ? 'Edit tag' : 'Add tag'} onClose={() => setOpen(false)}>
        <Input
          label="Name"
          hint="Spaces become hyphens; stored lowercase"
          value={form.name}
          onChangeText={(name) =>
            setForm((f) => ({ ...f, name: name.replace(/\s/g, '-').toLowerCase() }))
          }
        />
        <ColorField value={form.color} onChange={(color) => setForm((f) => ({ ...f, color }))} />
        <Button loading={busy} onPress={onSave}>
          Save
        </Button>
      </Modal>
    </Screen>
  )
}

const styles = StyleSheet.create({
  list: { gap: 10, marginTop: 12 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
  },
  dot: { width: 12, height: 12, borderRadius: 4 },
  name: { fontWeight: '800', color: colors.ink },
  meta: { color: colors.muted, fontSize: 12 },
})
