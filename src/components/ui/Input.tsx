import { useState } from 'react'
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native'
import { Eye, EyeOff } from 'lucide-react-native'
import { colors, radius } from '@/theme'

type Props = TextInputProps & {
  label?: string
  hint?: string
  error?: string
  /** Show eye toggle when using secureTextEntry (default true). */
  showPasswordToggle?: boolean
}

export function Input({
  label,
  hint,
  error,
  style,
  secureTextEntry,
  showPasswordToggle = true,
  ...props
}: Props) {
  const [visible, setVisible] = useState(false)
  const canToggle = Boolean(secureTextEntry) && showPasswordToggle
  const hidden = Boolean(secureTextEntry) && !(canToggle && visible)

  return (
    <View style={styles.wrap}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={styles.row}>
        <TextInput
          placeholderTextColor={colors.muted}
          style={[
            styles.input,
            canToggle && styles.inputWithToggle,
            error ? styles.inputError : null,
            style,
          ]}
          secureTextEntry={hidden}
          {...props}
        />
        {canToggle ? (
          <Pressable
            onPress={() => setVisible((v) => !v)}
            style={styles.toggle}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={visible ? 'Hide password' : 'Show password'}
          >
            {visible ? (
              <EyeOff size={20} color={colors.inkSoft} />
            ) : (
              <Eye size={20} color={colors.inkSoft} />
            )}
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <Text style={styles.error}>{error}</Text>
      ) : hint ? (
        <Text style={styles.hint}>{hint}</Text>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  label: { fontSize: 13, fontWeight: '600', color: colors.inkSoft },
  row: { position: 'relative', justifyContent: 'center' },
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
  inputWithToggle: { paddingRight: 48 },
  inputError: { borderColor: colors.danger },
  toggle: {
    position: 'absolute',
    right: 12,
    height: 48,
    width: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  error: { fontSize: 12, color: colors.danger },
  hint: { fontSize: 12, color: colors.muted },
})
