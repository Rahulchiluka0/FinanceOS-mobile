import { Pressable, StyleSheet, Text, View } from 'react-native'
import { colors, radius } from '@/theme'

const PALETTE = ['#1A56DB', '#0284C7', '#EA580C', '#059669', '#DC2626', '#7C3AED', '#475569', '#0B1220']

type Props = {
  label?: string
  value: string
  onChange: (color: string) => void
}

export function ColorField({ label = 'Color', value, onChange }: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.row}>
        {PALETTE.map((c) => (
          <Pressable
            key={c}
            onPress={() => onChange(c)}
            style={[
              styles.swatch,
              { backgroundColor: c },
              value === c && styles.swatchActive,
            ]}
          />
        ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  label: { fontSize: 13, fontWeight: '600', color: colors.inkSoft },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  swatch: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  swatchActive: { borderColor: colors.ink, transform: [{ scale: 1.08 }] },
})
