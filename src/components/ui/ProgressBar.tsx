import { StyleSheet, Text, View } from 'react-native'
import { colors, radius } from '@/theme'

type Props = {
  value: number
  max: number
  tone?: 'brand' | 'success' | 'warning' | 'danger'
  warnOnOver?: boolean
  overLabel?: string
}

export function ProgressBar({ value, max, tone = 'brand', warnOnOver = true, overLabel }: Props) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0
  const over = warnOnOver && value > max
  const fill = over
    ? colors.danger
    : tone === 'success'
      ? colors.success
      : tone === 'warning'
        ? colors.warning
        : tone === 'danger'
          ? colors.danger
          : colors.brand

  return (
    <View style={styles.wrap}>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${pct}%`, backgroundColor: fill }]} />
      </View>
      {over && overLabel ? <Text style={styles.over}>{overLabel}</Text> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { gap: 4 },
  track: {
    height: 8,
    borderRadius: radius.full,
    backgroundColor: colors.brandSoft,
    overflow: 'hidden',
  },
  fill: { height: '100%', borderRadius: radius.full },
  over: { fontSize: 12, color: colors.danger, fontWeight: '600' },
})
