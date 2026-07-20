import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native'
import { colors, radius } from '@/theme'

type Props = TextInputProps & {
  label?: string
  hint?: string
  error?: string
}

export function Input({ label, hint, error, style, ...props }: Props) {
  return (
    <View style={styles.wrap}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        placeholderTextColor={colors.muted}
        style={[styles.input, error ? styles.inputError : null, style]}
        {...props}
      />
      {error ? <Text style={styles.error}>{error}</Text> : hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  label: { fontSize: 13, fontWeight: '600', color: colors.inkSoft },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.ink,
    minHeight: 48,
  },
  inputError: { borderColor: colors.danger },
  error: { fontSize: 12, color: colors.danger },
  hint: { fontSize: 12, color: colors.muted },
})
