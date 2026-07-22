import { useCallback, useEffect, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react-native'
import { aiApi } from '@/api'
import { Screen } from '@/components/layout/Screen'
import { PageHead } from '@/components/ui/PageHead'
import { Button } from '@/components/ui/Button'
import { MetricTile } from '@/components/ui/MetricTile'
import { LoadingState } from '@/components/ui/LoadingState'
import { formatCurrency } from '@/utils/format'
import { colors, radius } from '@/theme'
import { lightTap } from '@/utils/haptics'

function currentPeriod() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function shiftPeriod(period: string, delta: number) {
  const [y, m] = period.split('-').map(Number)
  const d = new Date(y, (m || 1) - 1 + delta, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function formatPeriodLabel(period: string) {
  const [y, m] = period.split('-').map(Number)
  if (!y || !m) return period
  return new Date(y, m - 1, 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
}

export default function AiReplayScreen() {
  const [period, setPeriod] = useState(currentPeriod())
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async (p: string, force = false) => {
    setLoading(true)
    try {
      const res = await aiApi.replay({ period: p, ...(force ? { force: '1' } : {}) })
      setData(res)
      setError('')
    } catch (err: any) {
      setError(err.message || 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load(period)
  }, [load, period])

  if (loading && !data) {
    return (
      <Screen>
        <LoadingState label="Writing replay…" />
      </Screen>
    )
  }

  const stats = data?.stats || {}
  const timeline = data?.timeline || []

  return (
    <Screen>
      <PageHead
        kicker="Intelligence"
        title="Money Replay"
        subtitle="Your month as a short story"
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.periodRow}>
        <Pressable
          style={styles.periodBtn}
          onPress={() => {
            lightTap()
            setPeriod((p) => shiftPeriod(p, -1))
          }}
        >
          <ChevronLeft size={20} color={colors.brand} />
        </Pressable>
        <View style={styles.periodMid}>
          <Text style={styles.periodLabel}>{formatPeriodLabel(period)}</Text>
          <Text style={styles.periodCode}>{data?.period || period}</Text>
        </View>
        <Pressable
          style={styles.periodBtn}
          onPress={() => {
            lightTap()
            setPeriod((p) => shiftPeriod(p, 1))
          }}
        >
          <ChevronRight size={20} color={colors.brand} />
        </Pressable>
      </View>

      <Button
        variant="secondary"
        onPress={() => {
          lightTap()
          load(period, true)
        }}
      >
        <RefreshCw size={16} color={colors.brand} /> Rebuild story
      </Button>

      <View style={styles.metrics}>
        <MetricTile label="Income" value={formatCurrency(stats.income)} />
        <MetricTile label="Expense" value={formatCurrency(stats.expense)} />
        <MetricTile
          label="Net"
          value={formatCurrency(stats.net)}
          trend={Number(stats.net) >= 0 ? 'up' : 'down'}
          hint={Number(stats.net) >= 0 ? 'Surplus month' : 'Deficit month'}
        />
      </View>

      <View style={styles.story}>
        <Text style={styles.storyKicker}>Story</Text>
        <Text style={styles.body}>{data?.summary || 'No story for this month yet.'}</Text>
      </View>

      <Text style={styles.section}>Timeline</Text>
      {timeline.length === 0 ? (
        <Text style={styles.empty}>No events recorded for this period.</Text>
      ) : (
        timeline.map((ev: any, i: number) => (
          <View key={`${ev.type}-${i}`} style={styles.event}>
            <View style={styles.eventDot} />
            <View style={styles.eventBody}>
              <Text style={styles.eventLabel}>{ev.label || ev.title}</Text>
              <Text style={styles.muted}>
                {[ev.date, ev.amount != null ? formatCurrency(ev.amount) : null]
                  .filter(Boolean)
                  .join(' · ')}
              </Text>
            </View>
          </View>
        ))
      )}
    </Screen>
  )
}

const styles = StyleSheet.create({
  error: { color: colors.danger, marginBottom: 8 },
  periodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
    paddingVertical: 8,
    paddingHorizontal: 6,
  },
  periodBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  periodMid: { flex: 1, alignItems: 'center' },
  periodLabel: { fontWeight: '800', color: colors.ink, fontSize: 15 },
  periodCode: { fontSize: 11, color: colors.muted, marginTop: 2 },
  metrics: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginVertical: 12 },
  story: {
    backgroundColor: colors.brandSoft,
    borderRadius: radius.lg,
    padding: 16,
    marginBottom: 16,
  },
  storyKicker: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.brand,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  body: { color: colors.ink, lineHeight: 21, fontSize: 14 },
  section: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 10,
  },
  empty: { color: colors.muted, fontSize: 13 },
  event: { flexDirection: 'row', gap: 12, marginBottom: 14 },
  eventDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.brand,
    marginTop: 4,
  },
  eventBody: { flex: 1 },
  eventLabel: { fontWeight: '600', color: colors.ink, fontSize: 13 },
  muted: { color: colors.muted, fontSize: 12, marginTop: 2 },
})
