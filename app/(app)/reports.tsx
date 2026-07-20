import { useEffect, useMemo, useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { reportsApi } from '@/api'
import { useData, useEnsureData } from '@/context/DataContext'
import { Screen } from '@/components/layout/Screen'
import { PageHead } from '@/components/ui/PageHead'
import { Badge } from '@/components/ui/Badge'
import { MetricTile } from '@/components/ui/MetricTile'
import { CashFlowChart } from '@/components/charts/CashFlowChart'
import { CategoryPieChart } from '@/components/charts/CategoryPieChart'
import { formatCurrency } from '@/utils/format'
import { colors, radius } from '@/theme'

export default function ReportsScreen() {
  useEnsureData(['dashboard', 'cashFlow', 'categorySpend'])
  const { dashboard, cashFlow, categorySpend, loading, refresh } = useData()
  const [overview, setOverview] = useState<{
    income?: number
    expense?: number
    net?: number
    savingRate?: number
  } | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const data = await reportsApi.overview()
        if (!cancelled) setOverview(data as any)
      } catch {
        if (!cancelled) setOverview(null)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const stats = dashboard || {
    netWorth: 0,
    healthScore: 0,
    savingRate: 0,
    monthlyExpenses: 0,
    monthlyIncome: 0,
  }

  const avgSpend = useMemo(() => {
    if (!cashFlow.length) return 0
    return Math.round(cashFlow.reduce((s, r) => s + (r.expense || 0), 0) / cashFlow.length)
  }, [cashFlow])

  return (
    <Screen
      refreshing={loading}
      onRefresh={async () => {
        await refresh(['dashboard', 'cashFlow', 'categorySpend'])
        try {
          setOverview((await reportsApi.overview()) as any)
        } catch {
          /* keep previous */
        }
      }}
    >
      <PageHead
        kicker="Analytics"
        title="Reports"
        subtitle="Income vs expense, trends, and category spend."
      />

      <View style={styles.metrics}>
        <MetricTile
          label="This month income"
          value={formatCurrency(overview?.income ?? stats.monthlyIncome ?? 0)}
          hint="Reports overview"
          trend="up"
        />
        <MetricTile
          label="This month expense"
          value={formatCurrency(overview?.expense ?? stats.monthlyExpenses ?? 0)}
          hint="Reports overview"
        />
        <MetricTile
          label="Net / saving rate"
          value={`${formatCurrency(overview?.net ?? 0)} · ${overview?.savingRate ?? stats.savingRate ?? 0}%`}
          hint="Income − expenses"
          trend="up"
        />
        <MetricTile
          label="Avg monthly spend"
          value={formatCurrency(avgSpend)}
          hint={`Health ${stats.healthScore}/100 · last 6 months`}
        />
      </View>

      <View style={styles.panel}>
        <View style={styles.panelHead}>
          <View>
            <Text style={styles.h2}>Income vs expense</Text>
            <Text style={styles.meta}>Last 6 months trend</Text>
          </View>
          <Badge tone="info">Trend</Badge>
        </View>
        <CashFlowChart data={cashFlow} />
      </View>

      <View style={styles.panel}>
        <View style={styles.panelHead}>
          <View>
            <Text style={styles.h2}>Category breakdown</Text>
            <Text style={styles.meta}>This month</Text>
          </View>
          <Badge>Month</Badge>
        </View>
        <CategoryPieChart data={categorySpend} />
      </View>

      <View style={styles.panel}>
        <Text style={styles.h2}>Spending by category</Text>
        {categorySpend.map((c) => (
          <View key={c.name} style={styles.row}>
            <Text style={styles.name}>{c.name}</Text>
            <Text style={styles.amt}>{formatCurrency(c.value)}</Text>
          </View>
        ))}
        {!categorySpend.length ? <Text style={styles.meta}>No category spend yet.</Text> : null}
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  metrics: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 14 },
  panel: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    gap: 10,
    marginBottom: 14,
  },
  panelHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  h2: { fontSize: 16, fontWeight: '800', color: colors.ink },
  meta: { color: colors.muted, fontSize: 13 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  name: { color: colors.inkSoft, fontWeight: '600' },
  amt: { fontWeight: '800', color: colors.ink },
})
