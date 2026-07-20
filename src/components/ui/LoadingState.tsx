import { ActivityIndicator, StyleSheet, Text, View } from 'react-native'
import { colors } from '@/theme'

export function LoadingState({ label = 'Loading…' }: { label?: string }) {
  return (
    <View style={styles.wrap}>
      <ActivityIndicator color={colors.brand} size="large" />
      <Text style={styles.label}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { paddingVertical: 40, alignItems: 'center', gap: 12 },
  label: { color: colors.muted, fontSize: 14 },
})
