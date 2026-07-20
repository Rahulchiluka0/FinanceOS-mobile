import { StyleSheet, Text, View } from 'react-native'
import 'expo-linear-gradient'
import { PieChart } from 'react-native-gifted-charts'
import { colors } from '@/theme'
import type { CategorySpend } from '@/types'
import { formatCurrency } from '@/utils/format'

const PALETTE = ['#1A56DB', '#0284C7', '#EA580C', '#475569', '#7C3AED', '#DC2626', '#059669']

export function CategoryPieChart({ data }: { data: CategorySpend[] }) {
  if (!data?.length) {
    return <Text style={styles.empty}>No category spend yet.</Text>
  }

  const pieData = data.slice(0, 6).map((d, i) => ({
    value: Number(d.value) || 0,
    color: PALETTE[i % PALETTE.length],
    text: d.name,
  }))

  return (
    <View style={styles.wrap}>
      <PieChart
        data={pieData}
        donut
        radius={80}
        innerRadius={48}
        centerLabelComponent={() => (
          <Text style={styles.center}>{formatCurrency(pieData.reduce((s, d) => s + d.value, 0))}</Text>
        )}
      />
      <View style={styles.legend}>
        {pieData.map((d) => (
          <View key={d.text} style={styles.legendItem}>
            <View style={[styles.dot, { backgroundColor: d.color }]} />
            <Text style={styles.legendText} numberOfLines={1}>
              {d.text} · {formatCurrency(d.value)}
            </Text>
          </View>
        ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: 12 },
  empty: { color: colors.muted, paddingVertical: 24, textAlign: 'center' },
  center: { fontSize: 12, fontWeight: '800', color: colors.ink },
  legend: { width: '100%', gap: 6 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 12, color: colors.inkSoft, flex: 1 },
})
