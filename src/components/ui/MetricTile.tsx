import { StyleSheet, Text, View } from 'react-native'
import { colors, radius } from '@/theme'

type Props = {
  label: string
  value: string
  hint?: string
  trend?: 'up' | 'down' | 'flat'
  index?: number
}

export function MetricTile({ label, value, hint, trend }: Props) {
  return (
    <View style={styles.tile}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
      {hint ? (
        <Text style={[styles.hint, trend === 'up' && { color: colors.success }]}>{hint}</Text>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 4,
  },
  label: { fontSize: 12, color: colors.muted, fontWeight: '600' },
  value: { fontSize: 18, fontWeight: '800', color: colors.ink, letterSpacing: -0.3 },
  hint: { fontSize: 11, color: colors.muted },
})
