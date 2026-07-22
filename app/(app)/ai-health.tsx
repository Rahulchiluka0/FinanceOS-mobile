import { useCallback, useEffect, useMemo, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { router } from 'expo-router'
import { AlertTriangle, Brain } from 'lucide-react-native'
import { aiApi } from '@/api'
import { Screen } from '@/components/layout/Screen'
import { PageHead } from '@/components/ui/PageHead'
import { MetricTile } from '@/components/ui/MetricTile'
import { Badge } from '@/components/ui/Badge'
import { LoadingState } from '@/components/ui/LoadingState'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { SeriesBarChart } from '@/components/charts/SeriesBarChart'
import { colors, radius } from '@/theme'
import { lightTap } from '@/utils/haptics'

const FACTOR_LABELS: Record<string, string> = {
  savingsRate: 'Savings rate',
  emergencyFund: 'Emergency fund',
  debtBurden: 'Debt burden',
  investmentRatio: 'Investment ratio',
  budgetDiscipline: 'Budget discipline',
  cashflowStability: 'Cashflow stability',
  goalProgress: 'Goal progress',
  incomeStability: 'Income stability',
}

function riskTone(level?: string): 'success' | 'warning' | 'danger' | 'neutral' {
  const l = (level || '').toLowerCase()
  if (l === 'low') return 'success'
  if (l === 'medium') return 'warning'
  if (l === 'high' || l === 'critical') return 'danger'
  return 'neutral'
}

function mapCtaHref(href?: string) {
  if (!href) return null
  if (href.startsWith('/ai/cfo') || href.includes('cfo')) return '/(app)/ai-cfo'
  if (href.startsWith('/ai/simulator') || href.includes('simulator')) return '/(app)/ai-simulator'
  if (href.startsWith('/goals')) return '/(app)/goals'
  if (href.startsWith('/budgets')) return '/(app)/budgets'
  if (href.startsWith('/loans')) return '/(app)/loans'
  if (href.startsWith('/investments')) return '/(app)/investments'
  if (href.startsWith('/accounts')) return '/(app)/(tabs)/accounts'
  return null
}

export default function AiHealthScreen() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    try {
      const res = await aiApi.healthScore()
      setData(res)
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

  const historyPoints = useMemo(() => {
    const hist = Array.isArray(data?.history) ? data.history : []
    return hist.map((h: any) => {
      const day = String(h.asOf || '').slice(5, 10)
      return {
        value: Number(h.overall) || 0,
        label: day,
        caption: `${String(h.asOf || '').slice(0, 10)} · ${h.overall}/100`,
      }
    })
  }, [data?.history])

  const delta = useMemo(() => {
    const hist = data?.history || []
    if (hist.length < 2) return null
    const a = Number(hist[hist.length - 2]?.overall) || 0
    const b = Number(hist[hist.length - 1]?.overall) || 0
    return b - a
  }, [data?.history])

  if (loading && !data) {
    return (
      <Screen>
        <LoadingState label="Scoring…" />
      </Screen>
    )
  }

  const entries = Object.entries(data?.factors || {}) as [string, any][]
  const risk = data?.risk?.level || '—'
  const tone = riskTone(risk)

  return (
    <Screen>
      <PageHead
        kicker="Intelligence"
        title="Financial Health"
        subtitle={
          data?.asOf
            ? `Scored ${new Date(data.asOf).toLocaleDateString('en-IN')}`
            : 'Multi-factor Twin score'
        }
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={[styles.hero, tone === 'danger' && styles.heroDanger, tone === 'warning' && styles.heroWarn]}>
        <View style={styles.heroTop}>
          <Badge tone={tone}>{(risk || '—').toString().toUpperCase()} RISK</Badge>
          {delta != null ? (
            <Text style={styles.delta}>
              {delta > 0 ? '+' : ''}
              {delta} vs prior day
            </Text>
          ) : null}
        </View>
        <Text style={styles.heroScore}>{data?.overall ?? 0}</Text>
        <Text style={styles.heroOutOf}>out of 100</Text>
        {(data?.risk?.reasons || []).length > 0 ? (
          <View style={styles.reasonRow}>
            <AlertTriangle size={14} color={tone === 'danger' ? colors.danger : colors.warning} />
            <Text style={styles.reasonText}>{(data.risk.reasons || []).slice(0, 2).join(' · ')}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.metrics}>
        <MetricTile
          label="Overall"
          value={`${data?.overall ?? 0}/100`}
          hint={delta != null ? `${delta >= 0 ? '+' : ''}${delta} day` : 'Today’s score'}
          trend={delta != null && delta >= 0 ? 'up' : 'down'}
        />
        <MetricTile
          label="Snapshots"
          value={String((data?.history || []).length)}
          hint="Daily Twin history"
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Score history</Text>
        <Text style={styles.cardSub}>
          {(data?.history || []).length < 2
            ? 'Only today’s point so far — a new bar appears each day Twin rebuilds.'
            : 'Daily health score from Twin rebuilds'}
        </Text>
        <SeriesBarChart
          points={historyPoints}
          height={96}
          emptyLabel="No health snapshots yet. Refresh Twin from Personal CFO."
        />
      </View>

      <Pressable
        style={styles.linkCard}
        onPress={() => {
          lightTap()
          router.push('/(app)/ai-cfo')
        }}
      >
        <Brain size={18} color={colors.brand} />
        <View style={{ flex: 1 }}>
          <Text style={styles.linkTitle}>Open Personal CFO</Text>
          <Text style={styles.linkSub}>See cash, debt, budgets & Twin detail</Text>
        </View>
      </Pressable>

      <Text style={styles.sectionLabel}>What drives your score</Text>
      {entries.map(([key, f]) => {
        const href = mapCtaHref(f.cta?.href)
        return (
          <View key={key} style={styles.card}>
            <View style={styles.factorHead}>
              <Text style={styles.title}>{FACTOR_LABELS[key] || key}</Text>
              <Text style={styles.scorePill}>{f.score}/100</Text>
            </View>
            <Text style={styles.meta}>Weight {Math.round((f.weight || 0) * 100)}%</Text>
            <ProgressBar value={f.score} max={100} warnOnOver={false} />
            <Text style={styles.why}>{f.why}</Text>
            {f.cta?.label ? (
              href ? (
                <Pressable
                  onPress={() => {
                    lightTap()
                    router.push(href as any)
                  }}
                >
                  <Text style={styles.cta}>{f.cta.label} →</Text>
                </Pressable>
              ) : (
                <Text style={styles.cta}>{f.cta.label}</Text>
              )
            ) : null}
          </View>
        )
      })}
    </Screen>
  )
}

const styles = StyleSheet.create({
  error: { color: colors.danger, marginBottom: 8 },
  hero: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  heroWarn: { borderColor: 'rgba(217,119,6,0.35)', backgroundColor: '#fffbeb' },
  heroDanger: { borderColor: 'rgba(220,38,38,0.3)', backgroundColor: '#fef2f2' },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 8,
  },
  delta: { fontSize: 12, fontWeight: '600', color: colors.muted },
  heroScore: {
    fontSize: 52,
    fontWeight: '800',
    color: colors.ink,
    letterSpacing: -1.5,
    lineHeight: 56,
  },
  heroOutOf: { fontSize: 13, color: colors.muted, marginBottom: 8 },
  reasonRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  reasonText: { flex: 1, fontSize: 12, color: colors.inkSoft, lineHeight: 17 },
  metrics: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  cardTitle: { fontWeight: '700', color: colors.ink, fontSize: 15 },
  cardSub: { color: colors.muted, fontSize: 12, marginTop: 4, marginBottom: 10, lineHeight: 17 },
  linkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.brandSoft,
    borderRadius: radius.lg,
    padding: 14,
    marginBottom: 16,
  },
  linkTitle: { fontWeight: '700', color: colors.brand, fontSize: 14 },
  linkSub: { color: colors.inkSoft, fontSize: 12, marginTop: 2 },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  factorHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  title: { fontWeight: '700', color: colors.ink, flex: 1 },
  scorePill: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.brand,
    backgroundColor: colors.brandSoft,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  meta: { color: colors.muted, fontSize: 12, marginVertical: 6 },
  why: { color: colors.ink, fontSize: 13, marginTop: 8, lineHeight: 18 },
  cta: { color: colors.brand, fontSize: 13, marginTop: 8, fontWeight: '700' },
})
