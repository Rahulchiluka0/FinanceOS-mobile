import { useMemo, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useData, useEnsureData } from '@/context/DataContext'
import { Screen } from '@/components/layout/Screen'
import { PageHead } from '@/components/ui/PageHead'
import { ActionChip } from '@/components/ui/ActionChip'
import { CheckCheck } from 'lucide-react-native'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatDate } from '@/utils/format'
import { colors, radius } from '@/theme'
import { successTap } from '@/utils/haptics'

const typeTone: Record<string, 'warning' | 'danger' | 'success' | 'info' | 'neutral'> = {
  budget: 'warning',
  bill: 'danger',
  goal: 'success',
  balance: 'info',
  recurring: 'neutral',
}

export default function NotificationsScreen() {
  useEnsureData(['notifications'])
  const {
    notifications,
    loading,
    refresh,
    markNotificationRead,
    markAllNotificationsRead,
    unreadCount,
  } = useData()
  const [filter, setFilter] = useState('all')
  const [busyAll, setBusyAll] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    if (filter === 'all') return notifications
    return notifications.filter((n) => n.type === filter)
  }, [notifications, filter])

  const types = [...new Set(notifications.map((n) => n.type).filter(Boolean))] as string[]

  return (
    <Screen refreshing={loading} onRefresh={() => refresh(['notifications'])}>
      <PageHead
        kicker="Inbox"
        title="Notifications"
        subtitle={`${unreadCount} unread`}
        actions={
          unreadCount > 0 ? (
            <ActionChip
              label="Mark all read"
              tone="soft"
              icon={CheckCheck}
              loading={busyAll}
              onPress={async () => {
                setBusyAll(true)
                try {
                  await markAllNotificationsRead()
                  await successTap()
                } finally {
                  setBusyAll(false)
                }
              }}
            />
          ) : undefined
        }
      />

      <View style={styles.chips}>
        <Pressable
          onPress={() => setFilter('all')}
          style={[styles.chip, filter === 'all' && styles.chipActive]}
        >
          <Text style={[styles.chipText, filter === 'all' && styles.chipTextActive]}>All</Text>
        </Pressable>
        {types.map((t) => (
          <Pressable
            key={t}
            onPress={() => setFilter(t)}
            style={[styles.chip, filter === t && styles.chipActive]}
          >
            <Text style={[styles.chipText, filter === t && styles.chipTextActive]}>{t}</Text>
          </Pressable>
        ))}
      </View>

      {!filtered.length ? <EmptyState title="No notifications" /> : null}
      <View style={styles.list}>
        {filtered.map((n) => (
          <Pressable
            key={n.id}
            disabled={busyId === n.id}
            style={[styles.card, !n.read && styles.unread, busyId === n.id && styles.cardBusy]}
            onPress={async () => {
              if (n.read || busyId) return
              setBusyId(n.id)
              try {
                await markNotificationRead(n.id)
                await successTap()
              } finally {
                setBusyId(null)
              }
            }}
          >
            <View style={[styles.dot, n.read && styles.dotRead]} />
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={styles.name}>{n.title || 'Notification'}</Text>
              <Text style={styles.body}>{n.body || n.message || ''}</Text>
              {n.type ? <Badge tone={typeTone[n.type] || 'neutral'}>{n.type}</Badge> : null}
            </View>
            <Text style={styles.meta}>{formatDate(n.createdAt)}</Text>
          </Pressable>
        ))}
      </View>
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
    flexDirection: 'row',
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
  },
  cardBusy: { opacity: 0.55 },
  unread: { borderColor: colors.brand },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.brand,
    marginTop: 4,
  },
  dotRead: { backgroundColor: colors.borderStrong },
  name: { fontWeight: '800', color: colors.ink },
  body: { color: colors.inkSoft, fontSize: 13 },
  meta: { color: colors.muted, fontSize: 11 },
})
