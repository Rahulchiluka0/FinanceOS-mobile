import { useMemo } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { useData, useEnsureData } from '@/context/DataContext'
import { Screen } from '@/components/layout/Screen'
import { PageHead } from '@/components/ui/PageHead'
import { Badge } from '@/components/ui/Badge'
import { MetricTile } from '@/components/ui/MetricTile'
import { formatCurrency } from '@/utils/format'
import { colors, radius } from '@/theme'

export default function InsightsScreen() {
  useEnsureData(['dashboard', 'categorySpend', 'budgets', 'transactions', 'goals', 'bills'])
  const { dashboard, categorySpend, budgets, transactions, goals, bills, loading, refresh } =
    useData()
  const stats = dashboard || {
    savingRate: 0,
    monthlyExpenses: 0,
    netWorth: 0,
    healthScore: 0,
  }

  const smartInsights = useMemo(() => {
    const topCat = categorySpend[0]
    const largestTx = [...transactions]
      .filter((t) => t.type === 'expense')
      .sort((a, b) => b.amount - a.amount)[0]
    const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate()
    const cashBurn = stats.monthlyExpenses ? Math.round(stats.monthlyExpenses / daysInMonth) : 0
    const topGoal = [...goals].sort(
      (a, b) => b.current / (b.target || 1) - a.current / (a.target || 1),
    )[0]
    const unpaid = bills.filter((b) => b.status === 'unpaid').length

    return [
      {
        id: 1,
        label: 'Top spending category',
        value: topCat?.name || '—',
        detail: topCat ? `${formatCurrency(topCat.value)} this month` : 'No spend yet',
      },
      {
        id: 2,
        label: 'Largest expense',
        value: largestTx?.title || '—',
        detail: largestTx ? formatCurrency(largestTx.amount) : 'No expenses yet',
      },
      {
        id: 3,
        label: 'Saving rate',
        value: `${stats.savingRate ?? 0}%`,
        detail: (stats.savingRate ?? 0) >= 30 ? 'Above 30% target' : 'Below 30% target',
      },
      {
        id: 4,
        label: 'Health score',
        value: `${stats.healthScore ?? 0}/100`,
        detail: 'Based on saving rate',
      },
      {
        id: 5,
        label: 'Cash burn',
        value: formatCurrency(cashBurn),
        detail: 'Per day this month',
      },
      {
        id: 6,
        label: 'Net worth',
        value: formatCurrency(stats.netWorth || 0),
        detail: 'Accounts + investments − loans',
      },
      {
        id: 7,
        label: 'Unpaid bills',
        value: String(unpaid),
        detail: unpaid ? 'Action needed' : 'All clear',
      },
      {
        id: 8,
        label: 'Goal prediction',
        value: topGoal?.name || '—',
        detail: topGoal
          ? `${Math.round((topGoal.current / (topGoal.target || 1)) * 100)}% funded`
          : 'Add a goal to track',
      },
    ]
  }, [categorySpend, transactions, stats, goals, bills])

  const insights = useMemo(() => {
    const items: { id: string; type: 'positive' | 'info' | 'warning'; text: string }[] = []
    if (stats.savingRate != null) {
      items.push({
        id: 'saving',
        type: (stats.savingRate ?? 0) >= 30 ? 'positive' : 'info',
        text: `Your saving rate is ${stats.savingRate}% this month.`,
      })
    }
    const over = budgets.find((b) => b.spent > b.limit)
    if (over) {
      items.push({
        id: 'budget',
        type: 'warning',
        text: `${over.category} is over budget by ${formatCurrency(over.spent - over.limit)}.`,
      })
    }
    if (categorySpend[0]) {
      items.push({
        id: 'top',
        type: 'info',
        text: `${categorySpend[0].name} leads spending at ${formatCurrency(categorySpend[0].value)}.`,
      })
    }
    return items
  }, [stats, budgets, categorySpend])

  return (
    <Screen
      refreshing={loading}
      onRefresh={() =>
        refresh(['dashboard', 'categorySpend', 'budgets', 'transactions', 'goals', 'bills'])
      }
    >
      <PageHead
        kicker="Intelligence"
        title="Smart Insights"
        subtitle="Automated metrics and narrative signals from your data."
      />

      <View style={styles.metrics}>
        {smartInsights.map((s) => (
          <MetricTile
            key={s.id}
            label={s.label}
            value={s.value}
            hint={s.detail}
            trend={
              s.label.includes('Saving') && (stats.savingRate ?? 0) >= 30 ? 'up' : undefined
            }
          />
        ))}
      </View>

      <View style={styles.panel}>
        <View style={styles.panelHead}>
          <View>
            <Text style={styles.h2}>Insights feed</Text>
            <Text style={styles.meta}>What changed and what to watch</Text>
          </View>
          <Badge tone="info">Live</Badge>
        </View>
        {!insights.length ? (
          <Text style={styles.meta}>Insights will appear as you add data.</Text>
        ) : null}
        {insights.map((item) => (
          <View
            key={item.id}
            style={[
              styles.insight,
              item.type === 'warning' && styles.insightWarn,
              item.type === 'positive' && styles.insightPos,
            ]}
          >
            <Badge
              tone={
                item.type === 'warning' ? 'warning' : item.type === 'positive' ? 'success' : 'info'
              }
            >
              {item.type}
            </Badge>
            <Text style={styles.insightText}>{item.text}</Text>
          </View>
        ))}
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
  },
  panelHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  h2: { fontSize: 16, fontWeight: '800', color: colors.ink },
  meta: { color: colors.muted, fontSize: 13 },
  insight: {
    gap: 8,
    padding: 12,
    borderRadius: radius.md,
    backgroundColor: colors.bgElevated,
  },
  insightWarn: { backgroundColor: '#fef3c7' },
  insightPos: { backgroundColor: '#e0f2fe' },
  insightText: { color: colors.ink, fontSize: 14, fontWeight: '600' },
})
