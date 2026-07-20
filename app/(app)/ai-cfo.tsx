import { useCallback, useEffect, useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { aiApi } from '@/api'
import { Screen } from '@/components/layout/Screen'
import { PageHead } from '@/components/ui/PageHead'
import { MetricTile } from '@/components/ui/MetricTile'
import { Button } from '@/components/ui/Button'
import { LoadingState } from '@/components/ui/LoadingState'
import { formatCurrency } from '@/utils/format'
import { colors, radius } from '@/theme'

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
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Button variant="secondary" onPress={refresh} disabled={refreshing}>
        {refreshing ? 'Refreshing…' : 'Refresh Twin'}
      </Button>

      {p && (
        <>
          <View style={styles.metrics}>
            <MetricTile label="Health" value={`${p.health?.overall ?? 0}/100`} />
            <MetricTile label="Balance" value={formatCurrency(p.cash?.totalBalance)} />
            <MetricTile label="Savings" value={`${p.cash?.savingsRate ?? 0}%`} />
            <MetricTile label="Runway" value={`${p.buffers?.runwayMonths ?? 0} mo`} />
          </View>

          <View style={styles.card}>
            <Text style={styles.title}>Cash & wealth</Text>
            <Text style={styles.muted}>
              Liquid {formatCurrency(p.cash?.liquidBalance)} · Net worth{' '}
              {formatCurrency(p.wealth?.netWorth)}
            </Text>
            <Text style={styles.muted}>
              Income {formatCurrency(p.cash?.monthlyIncome)} / Expense{' '}
              {formatCurrency(p.cash?.monthlyExpense)}
            </Text>
            <Text style={styles.muted}>Invested {formatCurrency(p.wealth?.invested)}</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.title}>Debt & obligations</Text>
            <Text style={styles.muted}>
              Debt {formatCurrency(p.debt?.totalDebt)} · EMI {formatCurrency(p.debt?.emiMonthly)}
            </Text>
            <Text style={styles.muted}>
              Subscriptions {formatCurrency(p.obligations?.subscriptionsMonthly)}/mo
            </Text>
            <Text style={styles.muted}>
              Bills due 7d: {(p.obligations?.billsDue7d || []).length || 'none'}
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.title}>Budgets & goals</Text>
            <Text style={styles.muted}>
              {p.budgets?.onTrack} on track · {p.budgets?.atRisk} at risk · {p.budgets?.over} over
            </Text>
            <Text style={styles.muted}>Goals avg {p.goals?.completionPctAvg}%</Text>
            {(p.goals?.active || []).map((g: any) => (
              <Text key={g.id} style={styles.muted}>
                {g.name}: {formatCurrency(g.current)} / {formatCurrency(g.target)}
              </Text>
            ))}
          </View>

          <View style={styles.card}>
            <Text style={styles.title}>Risk</Text>
            <Text style={styles.muted}>
              {(p.risk?.level || 'low').toUpperCase()} — {(p.risk?.reasons || []).join('; ')}
            </Text>
          </View>
        </>
      )}
    </Screen>
  )
}

const styles = StyleSheet.create({
  error: { color: colors.danger, marginBottom: 8 },
  metrics: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginVertical: 14 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: { fontWeight: '700', color: colors.ink, marginBottom: 8 },
  muted: { color: colors.muted, fontSize: 13, marginBottom: 4, lineHeight: 18 },
})
