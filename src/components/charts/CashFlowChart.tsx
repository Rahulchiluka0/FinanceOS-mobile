import { StyleSheet, Text, View } from 'react-native'
import 'expo-linear-gradient'
import { BarChart } from 'react-native-gifted-charts'
import { colors } from '@/theme'
import type { CashFlowPoint } from '@/types'
import { formatCurrency } from '@/utils/format'

export function CashFlowChart({ data }: { data: CashFlowPoint[] }) {
  if (!data?.length) {
    return <Text style={styles.empty}>No cash flow data yet.</Text>
  }

  const barData = data.flatMap((d) => [
    {
      value: Number(d.income) || 0,
      label: d.month?.slice(0, 3) || '',
      frontColor: colors.brand,
      spacing: 2,
    },
    {
      value: Number(d.expense) || 0,
      frontColor: colors.accent,
      spacing: 14,
    },
  ])

  return (
    <View style={styles.wrap}>
      <BarChart
        data={barData}
        barWidth={10}
        height={180}
        noOfSections={4}
        yAxisThickness={0}
        xAxisThickness={0}
        yAxisTextStyle={{ color: colors.muted, fontSize: 10 }}
        xAxisLabelTextStyle={{ color: colors.muted, fontSize: 10 }}
        formatYLabel={(v) => `${Math.round(Number(v) / 1000)}k`}
      />
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: colors.brand }]} />
          <Text style={styles.legendText}>Income</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: colors.accent }]} />
          <Text style={styles.legendText}>Expense</Text>
        </View>
      </View>
      {data[data.length - 1] ? (
        <Text style={styles.caption}>
          Latest: {formatCurrency(data[data.length - 1].income)} in /{' '}
          {formatCurrency(data[data.length - 1].expense)} out
        </Text>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  empty: { color: colors.muted, paddingVertical: 24, textAlign: 'center' },
  legend: { flexDirection: 'row', gap: 16 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 12, color: colors.muted },
  caption: { fontSize: 12, color: colors.muted },
})
