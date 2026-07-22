import { useCallback, useEffect, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { router } from 'expo-router'
import { Activity, FlaskConical, RefreshCw } from 'lucide-react-native'
import { aiApi } from '@/api'
import { Screen } from '@/components/layout/Screen'
import { PageHead } from '@/components/ui/PageHead'
import { MetricTile } from '@/components/ui/MetricTile'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { LoadingState } from '@/components/ui/LoadingState'
import { formatCurrency } from '@/utils/format'
import { colors, radius } from '@/theme'
import { lightTap } from '@/utils/haptics'

function riskTone(level?: string): 'success' | 'warning' | 'danger' | 'neutral' {
  const l = (level || '').toLowerCase()
  if (l === 'low') return 'success'
  if (l === 'medium') return 'warning'
  if (l === 'high' || l === 'critical') return 'danger'
  return 'neutral'
}

export default function AiCfoScreen() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    try {
      const res = await aiApi.profile()
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

  const refresh = async () => {
    setRefreshing(true)
    lightTap()
    try {
      const res = await aiApi.refreshProfile()
      setData(res)
    } catch (err: any) {
      setError(err.message || 'Refresh failed')
    } finally {
      setRefreshing(false)
    }
  }

  const p = data?.profile
  if (loading && !p) {
    return (
      <Screen>
        <LoadingState label="Building Twin…" />
      </Screen>
    )
  }

  const tone = riskTone(p?.risk?.level)

  return (
    <Screen>
      <PageHead
        kicker="Intelligence"
        title="Personal CFO"
        subtitle={
          data?.asOf
            ? `Based on data as of ${new Date(data.asOf).toLocaleString('en-IN')}`
            : 'Financial Twin detail'
        }
        actions={
          <Pressable onPress={refresh} style={styles.refreshBtn} disabled={refreshing}>
            <RefreshCw size={16} color={colors.brand} />
          </Pressable>
        }
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {p && (
        <>
          <View style={styles.hero}>
            <Text style={styles.heroKicker}>Twin health</Text>
            <Text style={styles.heroScore}>{p.health?.overall ?? 0}</Text>
            <Badge tone={tone}>{(p.risk?.level || 'low').toUpperCase()} RISK</Badge>
            {(p.risk?.reasons || []).length > 0 ? (
              <Text style={styles.heroReason}>{(p.risk.reasons || []).slice(0, 2).join(' · ')}</Text>
            ) : null}
          </View>

          <View style={styles.shortcuts}>
            <Pressable
              style={styles.shortcut}
              onPress={() => {
                lightTap()
                router.push('/(app)/ai-health')
              }}
            >
              <Activity size={16} color={colors.brand} />
              <Text style={styles.shortcutText}>Health factors</Text>
            </Pressable>
            <Pressable
              style={styles.shortcut}
              onPress={() => {
                lightTap()
                router.push('/(app)/ai-simulator')
              }}
            >
              <FlaskConical size={16} color={colors.brand} />
              <Text style={styles.shortcutText}>Simulate</Text>
            </Pressable>
          </View>

          <View style={styles.metrics}>
            <MetricTile label="Balance" value={formatCurrency(p.cash?.totalBalance)} />
            <MetricTile label="Savings" value={`${p.cash?.savingsRate ?? 0}%`} />
            <MetricTile label="Runway" value={`${p.buffers?.runwayMonths ?? 0} mo`} />
            <MetricTile label="Net worth" value={formatCurrency(p.wealth?.netWorth)} />
          </View>

          <View style={styles.card}>
            <Text style={styles.title}>Cashflow</Text>
            <Text style={styles.row}>
              <Text style={styles.rowLabel}>Liquid </Text>
              {formatCurrency(p.cash?.liquidBalance)}
            </Text>
            <Text style={styles.row}>
              <Text style={styles.rowLabel}>Income </Text>
              {formatCurrency(p.cash?.monthlyIncome)}/mo
            </Text>
            <Text style={styles.row}>
              <Text style={styles.rowLabel}>Expense </Text>
              {formatCurrency(p.cash?.monthlyExpense)}/mo
            </Text>
            <Text style={styles.row}>
              <Text style={styles.rowLabel}>Invested </Text>
              {formatCurrency(p.wealth?.invested)}
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.title}>Obligations</Text>
            <Text style={styles.row}>
              <Text style={styles.rowLabel}>Debt </Text>
              {formatCurrency(p.debt?.totalDebt)}
            </Text>
            <Text style={styles.row}>
              <Text style={styles.rowLabel}>EMI </Text>
              {formatCurrency(p.debt?.emiMonthly)}/mo
            </Text>
            <Text style={styles.row}>
              <Text style={styles.rowLabel}>Subs </Text>
              {formatCurrency(p.obligations?.subscriptionsMonthly)}/mo
            </Text>
            <Text style={styles.row}>
              <Text style={styles.rowLabel}>Bills (7d) </Text>
              {(p.obligations?.billsDue7d || []).length || 'none'}
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.title}>Budgets & goals</Text>
            <Text style={styles.muted}>
              {p.budgets?.onTrack} on track · {p.budgets?.atRisk} at risk · {p.budgets?.over} over
            </Text>
            <Text style={styles.muted}>Goals avg {p.goals?.completionPctAvg}%</Text>
            {(p.goals?.active || []).slice(0, 4).map((g: any) => (
              <Text key={g.id} style={styles.goalLine}>
                {g.name}: {formatCurrency(g.current)} / {formatCurrency(g.target)}
              </Text>
            ))}
            <Button variant="secondary" onPress={() => router.push('/(app)/goals')}>
              Open goals
            </Button>
          </View>
        </>
      )}
    </Screen>
  )
}

const styles = StyleSheet.create({
  refreshBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brandSoft,
  },
  error: { color: colors.danger, marginBottom: 8 },
  hero: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
    gap: 6,
  },
  heroKicker: { fontSize: 11, fontWeight: '700', color: colors.muted, textTransform: 'uppercase' },
  heroScore: { fontSize: 44, fontWeight: '800', color: colors.ink, letterSpacing: -1 },
  heroReason: { fontSize: 12, color: colors.inkSoft, lineHeight: 17, marginTop: 4 },
  shortcuts: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  shortcut: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.brandSoft,
    paddingVertical: 12,
    borderRadius: radius.md,
  },
  shortcutText: { color: colors.brand, fontWeight: '700', fontSize: 13 },
  metrics: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6,
  },
  title: { fontWeight: '700', color: colors.ink, marginBottom: 4 },
  row: { color: colors.ink, fontSize: 13, lineHeight: 20 },
  rowLabel: { color: colors.muted, fontWeight: '600' },
  muted: { color: colors.muted, fontSize: 13, lineHeight: 18 },
  goalLine: { color: colors.inkSoft, fontSize: 13, marginTop: 2 },
})
