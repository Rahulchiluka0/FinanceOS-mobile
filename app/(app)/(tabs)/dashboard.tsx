import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Link, router } from 'expo-router'
import { ArrowUpRight, Bell, Plus } from 'lucide-react-native'
import { useAuth } from '@/context/AuthContext'
import { useData, useEnsureData } from '@/context/DataContext'
import { Screen } from '@/components/layout/Screen'
import { Badge } from '@/components/ui/Badge'
import { MetricTile } from '@/components/ui/MetricTile'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { LoadingState } from '@/components/ui/LoadingState'
import { CashFlowChart } from '@/components/charts/CashFlowChart'
import { CategoryPieChart } from '@/components/charts/CategoryPieChart'
import { formatCurrency } from '@/utils/format'
import { colors, radius } from '@/theme'

function buildInsights({ dashboard, budgets, categorySpend }: any) {
  const items: { id: string; type: string; text: string }[] = []
  if (dashboard?.savingRate != null) {
    items.push({
      id: 'saving',
      type: dashboard.savingRate >= 30 ? 'positive' : 'info',
      text: `Your saving rate is ${dashboard.savingRate}%. ${
        dashboard.savingRate >= 30 ? 'Keep this up toward your goals.' : 'Aim for 30%+ when income allows.'
      }`,
    })
  }
  const over = budgets?.find((b: any) => b.spent > b.limit)
  if (over) {
    items.push({
      id: 'budget',
      type: 'warning',
      text: `${over.category} budget exceeded by ${formatCurrency(over.spent - over.limit)}.`,
    })
  }
  if (categorySpend?.[0]) {
    items.push({
      id: 'top-cat',
      type: 'info',
      text: `Top spending: ${categorySpend[0].name} (${formatCurrency(categorySpend[0].value)}).`,
    })
  }
  return items.slice(0, 3)
}

export default function DashboardScreen() {
  const { user } = useAuth()
  useEnsureData(['dashboard', 'cashFlow', 'categorySpend', 'notifications'])
  const { dashboard, cashFlow, categorySpend, loading, refresh, unreadCount } = useData()

  const stats = dashboard || {
    totalBalance: 0,
    monthlyIncome: 0,
    monthlyExpenses: 0,
    netSavings: 0,
    netWorth: 0,
    healthScore: 0,
    savingRate: 0,
  }

  const firstName = user?.name?.split(' ')[0] || 'there'
  const recent = (dashboard?.recentTransactions || []).slice(0, 5)
  const budgets = dashboard?.budgets || []
  const goals = dashboard?.goals || []
  const upcomingBills = (dashboard?.upcomingBills || []).slice(0, 3)
  const insights = buildInsights({ dashboard: stats, budgets, categorySpend })

  if (loading && !dashboard) {
    return (
      <Screen>
        <LoadingState label="Loading dashboard…" />
      </Screen>
    )
  }

  return (
    <Screen
      refreshing={loading}
      onRefresh={() => refresh(['dashboard', 'cashFlow', 'categorySpend', 'notifications'])}
    >
      <View style={styles.topBar}>
        <Text style={styles.word}>FinanceOS</Text>
        <Pressable onPress={() => router.push('/(app)/notifications')} style={styles.bell}>
          <Bell size={22} color={colors.ink} />
          {unreadCount > 0 ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
            </View>
          ) : null}
        </Pressable>
      </View>

      <View style={styles.hero}>
        <Text style={styles.kicker}>Live snapshot</Text>
        <Text style={styles.greeting}>
          Good to see you, <Text style={styles.em}>{firstName}</Text>
        </Text>
        <Text style={styles.balanceLabel}>Total balance across accounts</Text>
        <Text style={styles.balance}>{formatCurrency(stats.totalBalance)}</Text>
        <Text style={styles.meta}>
          Net savings <Text style={styles.metaStrong}>{formatCurrency(stats.netSavings)}</Text>
          {' · '}health {stats.healthScore}/100
        </Text>
        <View style={styles.heroActions}>
          <Pressable
            style={styles.heroLink}
            onPress={() => router.push('/(app)/(tabs)/transactions')}
          >
            <Plus size={15} color="#93C5FD" strokeWidth={2.5} />
            <Text style={styles.heroLinkText}>New transaction</Text>
          </Pressable>
          <Pressable style={styles.heroLink} onPress={() => router.push('/(app)/reports')}>
            <Text style={styles.heroLinkText}>Reports</Text>
            <ArrowUpRight size={15} color="#93C5FD" strokeWidth={2.5} />
          </Pressable>
        </View>
      </View>

      <View style={styles.metrics}>
        <MetricTile label="Income" value={formatCurrency(stats.monthlyIncome)} hint="This month" trend="up" />
        <MetricTile label="Expenses" value={formatCurrency(stats.monthlyExpenses)} hint="This month" />
        <MetricTile label="Net worth" value={formatCurrency(stats.netWorth)} hint="Assets − loans" trend="up" />
        <MetricTile
          label="Saving rate"
          value={`${stats.savingRate ?? 0}%`}
          hint="Income − expenses"
          trend={stats.savingRate >= 30 ? 'up' : undefined}
        />
      </View>

      <View style={styles.panel}>
        <View style={styles.sectionHead}>
          <View>
            <Text style={styles.h2}>Cash flow</Text>
            <Text style={styles.sub}>Income vs spend · last 6 months</Text>
          </View>
          <Badge tone="info">Trend</Badge>
        </View>
        <CashFlowChart data={cashFlow} />
      </View>

      <View style={styles.panel}>
        <View style={styles.sectionHead}>
          <View>
            <Text style={styles.h2}>Spend by category</Text>
            <Text style={styles.sub}>This period</Text>
          </View>
        </View>
        <CategoryPieChart data={categorySpend} />
      </View>

      {insights.length > 0 ? (
        <View style={styles.panel}>
          <Text style={styles.h2}>Insights</Text>
          {insights.map((i) => (
            <Text key={i.id} style={styles.insight}>
              {i.text}
            </Text>
          ))}
        </View>
      ) : null}

      {budgets.length > 0 ? (
        <View style={styles.panel}>
          <View style={styles.sectionHead}>
            <Text style={styles.h2}>Budgets</Text>
            <Link href="/(app)/budgets" style={styles.link}>
              See all
            </Link>
          </View>
          {budgets.slice(0, 3).map((b: any) => (
            <View key={b.id} style={styles.rowBlock}>
              <View style={styles.rowBetween}>
                <Text style={styles.rowTitle}>{b.category}</Text>
                <Text style={styles.rowMeta}>
                  {formatCurrency(b.spent)} / {formatCurrency(b.limit)}
                </Text>
              </View>
              <ProgressBar value={b.spent} max={b.limit} warnOnOver />
            </View>
          ))}
        </View>
      ) : null}

      {goals.length > 0 ? (
        <View style={styles.panel}>
          <View style={styles.sectionHead}>
            <Text style={styles.h2}>Goals</Text>
            <Link href="/(app)/goals" style={styles.link}>
              See all
            </Link>
          </View>
          {goals.slice(0, 3).map((g: any) => (
            <View key={g.id} style={styles.rowBlock}>
              <View style={styles.rowBetween}>
                <Text style={styles.rowTitle}>{g.name}</Text>
                <Text style={styles.rowMeta}>
                  {formatCurrency(g.current)} / {formatCurrency(g.target)}
                </Text>
              </View>
              <ProgressBar value={g.current} max={g.target} tone="success" warnOnOver={false} />
            </View>
          ))}
        </View>
      ) : null}

      {upcomingBills.length > 0 ? (
        <View style={styles.panel}>
          <Text style={styles.h2}>Upcoming bills</Text>
          {upcomingBills.map((b: any) => (
            <View key={b.id} style={styles.listRow}>
              <Text style={styles.rowTitle}>{b.title}</Text>
              <Text style={styles.rowMeta}>{formatCurrency(b.amount)}</Text>
            </View>
          ))}
        </View>
      ) : null}

      <View style={styles.panel}>
        <View style={styles.sectionHead}>
          <Text style={styles.h2}>Recent transactions</Text>
          <Link href="/(app)/(tabs)/transactions" style={styles.link}>
            View all
          </Link>
        </View>
        {recent.length === 0 ? (
          <Text style={styles.sub}>No recent transactions.</Text>
        ) : (
          recent.map((t: any) => (
            <View key={t.id} style={styles.listRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>{t.title}</Text>
                <Text style={styles.sub}>{t.category || t.type}</Text>
              </View>
              <Text
                style={[
                  styles.amount,
                  { color: t.type === 'income' ? colors.success : t.type === 'expense' ? colors.danger : colors.ink },
                ]}
              >
                {t.type === 'expense' ? '−' : t.type === 'income' ? '+' : ''}
                {formatCurrency(t.amount)}
              </Text>
            </View>
          ))
        )}
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  word: { fontSize: 18, fontWeight: '800', color: colors.ink },
  bell: { padding: 6 },
  badge: {
    position: 'absolute',
    right: 0,
    top: 0,
    backgroundColor: colors.danger,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: { color: '#fff', fontSize: 9, fontWeight: '800' },
  hero: {
    backgroundColor: colors.ink,
    borderRadius: radius.lg,
    padding: 20,
    gap: 6,
    marginBottom: 14,
  },
  kicker: { color: '#93C5FD', fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  greeting: { color: '#F0F6FF', fontSize: 24, fontWeight: '800' },
  em: { color: '#93C5FD', fontStyle: 'italic' },
  balanceLabel: { color: 'rgba(240,246,255,0.65)', fontSize: 12, marginTop: 8 },
  balance: { color: '#fff', fontSize: 34, fontWeight: '800', letterSpacing: -0.8 },
  meta: { color: 'rgba(240,246,255,0.7)', fontSize: 13 },
  metaStrong: { color: '#fff', fontWeight: '700' },
  heroActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 14,
  },
  heroLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: 'rgba(147, 197, 253, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(147, 197, 253, 0.28)',
  },
  heroLinkText: {
    color: '#DBEAFE',
    fontWeight: '700',
    fontSize: 13,
  },
  metrics: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 14 },
  panel: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 12,
    gap: 10,
  },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  h2: { fontSize: 17, fontWeight: '800', color: colors.ink },
  sub: { fontSize: 12, color: colors.muted },
  link: { color: colors.brand, fontWeight: '700', fontSize: 13 },
  insight: { fontSize: 13, color: colors.inkSoft, lineHeight: 19 },
  rowBlock: { gap: 6 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  rowTitle: { fontSize: 14, fontWeight: '700', color: colors.ink },
  rowMeta: { fontSize: 12, color: colors.muted },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  amount: { fontWeight: '800', fontSize: 14 },
})
