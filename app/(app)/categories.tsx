import { useMemo, useState } from 'react'
import { Alert, StyleSheet, Text, View } from 'react-native'
import { useData, useEnsureData } from '@/context/DataContext'
import { Screen } from '@/components/layout/Screen'
import { PageHead } from '@/components/ui/PageHead'
import { Button } from '@/components/ui/Button'
import { ActionChip, ActionOrb } from '@/components/ui/ActionChip'
import { IconButton } from '@/components/ui/IconButton'
import { Archive, ArchiveRestore, Eye, EyeOff, GitBranchPlus, Pencil, Plus } from 'lucide-react-native'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { SelectField } from '@/components/ui/SelectField'
import { ColorField } from '@/components/ui/ColorField'
import { EmptyState } from '@/components/ui/EmptyState'
import { Badge } from '@/components/ui/Badge'
import { colors, radius } from '@/theme'
import { successTap } from '@/utils/haptics'
import type { Category } from '@/types'

const empty = { id: '', name: '', type: 'expense', color: '#1A56DB', parentId: '' }

function buildFamilies(items: Category[]) {
  const roots = items
    .filter((c) => !c.parentId)
    .sort((a, b) => a.name.localeCompare(b.name))

  const families = roots.map((root) => ({
    root,
    children: items
      .filter((c) => c.parentId === root.id)
      .sort((a, b) => a.name.localeCompare(b.name)),
  }))

  const nestedIds = new Set(families.flatMap((f) => [f.root.id, ...f.children.map((c) => c.id)]))
  const orphans = items
    .filter((c) => !nestedIds.has(c.id))
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((root) => ({ root, children: [] as Category[] }))

  return [...families, ...orphans]
}

export default function CategoriesScreen() {
  useEnsureData(['categories'])
  const { categories, loading, refresh, saveCategory, archiveCategory } = useData()
  const [showArchived, setShowArchived] = useState(false)
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [form, setForm] = useState(empty)

  const visible = useMemo(
    () => categories.filter((c) => (showArchived ? true : !c.archived)),
    [categories, showArchived],
  )

  const income = useMemo(
    () => buildFamilies(visible.filter((c) => c.type === 'income')),
    [visible],
  )
  const expense = useMemo(
    () => buildFamilies(visible.filter((c) => c.type === 'expense')),
    [visible],
  )

  const parentOptions = categories.filter(
    (c) =>
      !c.parentId &&
      !c.archived &&
      c.type === form.type &&
      c.id !== form.id,
  )

  const openCreate = (type = 'expense', parentId = '') => {
    setForm({ ...empty, type, parentId: parentId || '' })
    setOpen(true)
  }

  const openEdit = (cat: Category) => {
    setForm({
      id: cat.id,
      name: cat.name,
      type: cat.type,
      color: cat.color || '#1A56DB',
      parentId: cat.parentId || '',
    })
    setOpen(true)
  }

  const onSave = async () => {
    if (!form.name.trim()) return Alert.alert('Name is required')
    setBusy(true)
    try {
      await saveCategory({
        id: form.id || undefined,
        name: form.name.trim(),
        type: form.type,
        color: form.color,
        parentId: form.parentId || null,
      })
      await successTap()
      setOpen(false)
    } catch (e: any) {
      Alert.alert('Error', e.message)
    } finally {
      setBusy(false)
    }
  }

  const onArchive = (cat: Category) => {
    Alert.alert(cat.archived ? 'Restore category?' : 'Archive category?', cat.name, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: cat.archived ? 'Restore' : 'Archive',
        style: cat.archived ? 'default' : 'destructive',
        onPress: async () => {
          setBusyId(cat.id)
          try {
            await archiveCategory(cat.id)
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

  const renderFamily = (family: { root: Category; children: Category[] }, type: string) => {
    const { root, children } = family
    return (
      <View key={root.id} style={[styles.card, root.archived && styles.archived]}>
        <View style={[styles.dot, { backgroundColor: root.color || colors.brand }]} />
        <View style={{ flex: 1, gap: 6 }}>
          <View style={styles.row}>
            <Text style={styles.name}>{root.name}</Text>
            {root.archived ? <Badge tone="warning">Archived</Badge> : <Badge tone="neutral">Parent</Badge>}
          </View>

          {children.map((child) => (
            <View key={child.id} style={[styles.child, child.archived && styles.archived]}>
              <View style={[styles.childDot, { backgroundColor: child.color || colors.brand }]} />
              <Text style={styles.childName}>{child.name}</Text>
              <IconButton label="Edit subcategory" icon={Pencil} tone="brand" onPress={() => openEdit(child)} />
              <IconButton
                label={child.archived ? 'Restore subcategory' : 'Archive subcategory'}
                icon={child.archived ? ArchiveRestore : Archive}
                tone={child.archived ? 'success' : 'danger'}
                loading={busyId === child.id}
                disabled={busyId !== null && busyId !== child.id}
                onPress={() => onArchive(child)}
              />
            </View>
          ))}

          <View style={styles.actions}>
            <IconButton
              label="Add subcategory"
              icon={GitBranchPlus}
              tone="brand"
              onPress={() => openCreate(type, root.id)}
            />
            <IconButton label="Edit category" icon={Pencil} tone="muted" onPress={() => openEdit(root)} />
            <IconButton
              label={root.archived ? 'Restore category' : 'Archive category'}
              icon={root.archived ? ArchiveRestore : Archive}
              tone={root.archived ? 'success' : 'danger'}
              loading={busyId === root.id}
              disabled={busyId !== null && busyId !== root.id}
              onPress={() => onArchive(root)}
            />
          </View>
        </View>
      </View>
    )
  }

  const renderGroup = (title: string, type: string, families: ReturnType<typeof buildFamilies>) => {
    if (!families.length) return null
    return (
      <View style={styles.section}>
        <Text style={styles.h2}>{title}</Text>
        {families.map((f) => renderFamily(f, type))}
      </View>
    )
  }

  return (
    <Screen refreshing={loading} onRefresh={() => refresh(['categories'])}>
      <PageHead
        kicker="Taxonomy"
        title="Categories"
        subtitle="Organize income and expenses."
        actions={
          <>
            <ActionChip
              label={showArchived ? 'Hide archived' : 'Archived'}
              tone="muted"
              icon={showArchived ? EyeOff : Eye}
              onPress={() => setShowArchived((v) => !v)}
            />
            <ActionOrb label="Add category" icon={Plus} onPress={() => openCreate('expense')} />
          </>
        }
      />

      {!visible.length ? <EmptyState title="No categories" /> : null}
      {renderGroup('Income', 'income', income)}
      {renderGroup('Expense', 'expense', expense)}

      <Modal open={open} title={form.id ? 'Edit category' : 'New category'} onClose={() => setOpen(false)}>
        <Input label="Name" value={form.name} onChangeText={(name) => setForm((f) => ({ ...f, name }))} />
        <SelectField
          label="Type"
          value={form.type}
          options={[
            { label: 'Income', value: 'income' },
            { label: 'Expense', value: 'expense' },
          ]}
          onChange={(type) => setForm((f) => ({ ...f, type, parentId: '' }))}
        />
        <SelectField
          label="Parent (optional)"
          value={form.parentId || ''}
          options={[
            { label: 'None', value: '' },
            ...parentOptions.map((p) => ({ label: p.name, value: p.id })),
          ]}
          onChange={(parentId) => setForm((f) => ({ ...f, parentId }))}
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
  section: { marginBottom: 16, gap: 10 },
  h2: { fontSize: 16, fontWeight: '800', color: colors.ink },
  card: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
  },
  archived: { opacity: 0.55 },
  dot: { width: 10, height: 10, borderRadius: 5, marginTop: 6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  name: { fontWeight: '800', color: colors.ink, fontSize: 15 },
  child: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.bgElevated,
    borderRadius: radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  childDot: { width: 8, height: 8, borderRadius: 4 },
  childName: { flex: 1, fontWeight: '600', color: colors.inkSoft, fontSize: 13 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
})
