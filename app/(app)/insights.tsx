import { useCallback, useEffect, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { router } from 'expo-router'
import { aiApi } from '@/api'
import { Screen } from '@/components/layout/Screen'
import { PageHead } from '@/components/ui/PageHead'
import { Badge } from '@/components/ui/Badge'
import { MetricTile } from '@/components/ui/MetricTile'
import { Button } from '@/components/ui/Button'
import { LoadingState } from '@/components/ui/LoadingState'
import { colors, radius } from '@/theme'
import { lightTap } from '@/utils/haptics'

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'overspend', label: 'Money' },
  { id: 'risk', label: 'Risk' },
  { id: 'opportunity', label: 'Tips' },
  { id: 'goal', label: 'Goals' },
]

const PATTERN_LABELS: Record<string, string> = {
  top_spend: 'Top spend',
  weekend_lift: 'Weekend lift',
  post_payday_lift: 'Post-payday',
  category_mom: 'Category MoM',
  subscription_creep: 'Subscriptions',
  cashflow_volatility: 'Cashflow volatility',
}

function severityTone(s: string): 'danger' | 'warning' | 'info' | 'success' | 'neutral' {
  if (s === 'high') return 'danger'
  if (s === 'medium') return 'warning'
  return 'info'
}

export default function InsightsScreen() {
  const [pack, setPack] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('all')

  const load = useCallback(async () => {
    try {
      const data = await aiApi.smartInsights()
      setPack(data)
      setError('')
    } catch (err: any) {
      setError(err.message || 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const refresh = async () => {
    setRefreshing(true)
    lightTap()
    try {
      await aiApi.refreshInsights()
      await aiApi.refreshPatterns()
      await load()
    } catch (err: any) {
      setError(err.message || 'Refresh failed')
    } finally {
      setRefreshing(false)
    }
  }

  const dismiss = async (id: string) => {
    try {
      await aiApi.dismissInsight(id)
      setPack((p: any) => ({
        ...p,
        insights: (p?.insights || []).filter((i: any) => i.id !== id),
      }))
    } catch (err: any) {
      setError(err.message || 'Dismiss failed')
    }
  }

  if (loading && !pack) {
    return (
      <Screen>
        <LoadingState label="Loading coach…" />
      </Screen>
    )
  }

  const insights = (pack?.insights || []).filter((i: any) => {
    if (filter === 'all') return true
    if (filter === 'goal') return i.type === 'goal' || i.type === 'win'
    return i.type === filter
  })
  const patterns = pack?.patterns || []

  return (
    <Screen>
      <PageHead
        kicker="Intelligence"
        title="Smart Insights"
        subtitle="Coach cards + spending patterns from your Twin"
        actions={
          <Button size="sm" variant="secondary" onPress={refresh} disabled={refreshing}>
            {refreshing ? '…' : 'Refresh'}
          </Button>
        }
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.metrics}>
        <MetricTile label="Insights" value={String((pack?.insights || []).length)} />
        <MetricTile label="Patterns" value={String(patterns.length)} hint={pack?.period} />
      </View>

      <View style={styles.filters}>
        {FILTERS.map((f) => (
          <Pressable
            key={f.id}
            onPress={() => setFilter(f.id)}
            style={[styles.chip, filter === f.id && styles.chipActive]}
          >
            <Text style={[styles.chipText, filter === f.id && styles.chipTextActive]}>{f.label}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.section}>Coach feed</Text>
      {insights.length === 0 && <Text style={styles.muted}>No insights in this filter.</Text>}
      {insights.map((i: any) => (
        <View key={i.id} style={styles.card}>
          <View style={styles.row}>
            <Badge tone={severityTone(i.severity)}>{i.severity}</Badge>
            <Badge tone="neutral">{i.type}</Badge>
          </View>
          <Text style={styles.title}>{i.title}</Text>
          <Text style={styles.body}>{i.body}</Text>
          <View style={styles.row}>
            {i.action?.href ? (
              <Button
                size="sm"
                variant="secondary"
                onPress={() => {
                  const href = String(i.action.href).replace(/^\//, '')
                  router.push(`/(app)/${href}` as any)
                }}
              >
                {i.action.label || 'Open'}
              </Button>
            ) : null}
            <Button size="sm" variant="ghost" onPress={() => dismiss(i.id)}>
              Dismiss
            </Button>
          </View>
        </View>
      ))}

      <Text style={[styles.section, { marginTop: 16 }]}>Patterns · {pack?.period}</Text>
      {patterns.map((p: any) => (
        <View key={p.key} style={styles.card}>
          <Text style={styles.patternKey}>{PATTERN_LABELS[p.key] || p.key}</Text>
          <Text style={styles.body}>{p.summary}</Text>
        </View>
      ))}
    </Screen>
  )
}

const styles = StyleSheet.create({
  error: { color: colors.danger, marginBottom: 8, fontSize: 13 },
  metrics: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12 },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipActive: { borderColor: colors.brand, backgroundColor: colors.brandSoft },
  chipText: { fontSize: 12, fontWeight: '600', color: colors.muted },
  chipTextActive: { color: colors.brand },
  section: { fontWeight: '700', color: colors.ink, marginBottom: 8, fontSize: 15 },
  muted: { color: colors.muted, fontSize: 13, marginBottom: 8 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
  },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
  title: { fontWeight: '700', color: colors.ink, fontSize: 15 },
  body: { color: colors.muted, fontSize: 13, lineHeight: 18 },
  patternKey: { fontSize: 11, fontWeight: '700', color: colors.brand, textTransform: 'uppercase' },
})
