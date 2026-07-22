import { useEffect, useMemo, useState } from 'react'
import {
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
} from 'react-native'
import 'expo-linear-gradient'
import { BarChart } from 'react-native-gifted-charts'
import { colors } from '@/theme'

export type SeriesPoint = {
  value: number
  label?: string
  caption?: string
}

type Props = {
  points: SeriesPoint[]
  height?: number
  color?: string
  emptyLabel?: string
  formatValue?: (v: number) => string
  compactLabels?: boolean
  hint?: string
}

function compactAxis(n: number) {
  const abs = Math.abs(n)
  if (abs >= 10000000) return `${(n / 10000000).toFixed(1)}Cr`
  if (abs >= 100000) return `${(n / 100000).toFixed(1)}L`
  if (abs >= 1000) return `${Math.round(n / 1000)}k`
  return String(Math.round(n))
}

/** Single-series bar chart — tap a bar to inspect (no drag hijacking of the screen). */
export function SeriesBarChart({
  points,
  height = 120,
  color = colors.brand,
  emptyLabel = 'Not enough data yet.',
  formatValue,
  compactLabels = true,
  hint = 'Tap a bar to inspect a point',
}: Props) {
  const [containerW, setContainerW] = useState(0)
  const n = points?.length || 0
  const [selected, setSelected] = useState(() => Math.max(0, n - 1))

  // Only reset selection when the series length / endpoints change — not on every parent render.
  const seriesKey = `${n}:${points?.[0]?.value ?? ''}:${points?.[n - 1]?.value ?? ''}`
  useEffect(() => {
    setSelected(Math.max(0, n - 1))
  }, [seriesKey, n])

  const onLayout = (e: LayoutChangeEvent) => {
    const w = Math.floor(e.nativeEvent.layout.width)
    if (w > 0 && w !== containerW) setContainerW(w)
  }

  const yAxisLabelWidth = 36
  const chartWidth = Math.max(160, containerW - yAxisLabelWidth - 8)
  const safeSelected = n ? Math.min(selected, n - 1) : 0
  const active = n ? points[safeSelected] : null

  const barWidth = useMemo(() => {
    if (!n || chartWidth <= 0) return 8
    return Math.max(4, Math.min(16, Math.floor((chartWidth - 16) / Math.max(n * 1.35, 1))))
  }, [chartWidth, n])

  const spacing = Math.max(2, Math.min(8, Math.floor(barWidth * 0.35)))

  // Stable bar data — selection highlight applied without rebuilding press handlers every time.
  const data = useMemo(() => {
    if (!n) return []
    return points.map((p, i) => {
      const showLabel =
        !compactLabels || n <= 8 || i === 0 || i === n - 1 || i === Math.floor((n - 1) / 2)
      const isActive = i === safeSelected
      return {
        value: Math.max(0, Number(p.value) || 0),
        label: showLabel ? p.label || '' : '',
        frontColor: isActive ? color : `${color}99`,
        spacing,
      }
    })
  }, [points, n, compactLabels, safeSelected, color, spacing])

  if (!n) {
    return <Text style={styles.empty}>{emptyLabel}</Text>
  }

  const live =
    active?.caption ||
    (active
      ? [active.label, formatValue ? formatValue(active.value) : String(active.value)]
          .filter(Boolean)
          .join(' · ')
      : hint)

  return (
    <View style={styles.wrap} onLayout={onLayout}>
      <Text style={styles.live} numberOfLines={2} accessibilityLiveRegion="polite">
        {live || hint}
      </Text>
      {containerW > 0 ? (
        <View style={styles.touchPad} collapsable={false}>
          <BarChart
            data={data}
            width={chartWidth}
            barWidth={barWidth}
            height={height}
            noOfSections={4}
            yAxisThickness={0}
            xAxisThickness={0}
            yAxisLabelWidth={yAxisLabelWidth}
            yAxisTextStyle={{ color: colors.muted, fontSize: 9 }}
            xAxisLabelTextStyle={{ color: colors.muted, fontSize: 9 }}
            formatYLabel={(v) => compactAxis(Number(v))}
            isAnimated={false}
            roundedTop
            roundedBottom
            hideRules={false}
            rulesColor={colors.border}
            rulesThickness={1}
            disableScroll
            initialSpacing={6}
            endSpacing={6}
            onPress={(_item: unknown, index: number) => {
              if (typeof index === 'number') setSelected(index)
            }}
          />
        </View>
      ) : (
        <View style={{ height }} />
      )}
      <Text style={styles.hint}>{hint}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    gap: 6,
    width: '100%',
    maxWidth: '100%',
    overflow: 'hidden',
  },
  empty: { color: colors.muted, paddingVertical: 20, textAlign: 'center', fontSize: 13 },
  live: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.brand,
    minHeight: 18,
  },
  touchPad: {
    width: '100%',
    maxWidth: '100%',
    overflow: 'hidden',
    height: undefined,
  },
  hint: { fontSize: 11, color: colors.muted },
})
