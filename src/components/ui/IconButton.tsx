import type { LucideIcon } from 'lucide-react-native'
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native'
import { lightTap } from '@/utils/haptics'

type Tone = 'brand' | 'muted' | 'danger' | 'success' | 'warning'

type Props = {
  icon: LucideIcon
  label: string
  onPress?: () => void
  tone?: Tone
  disabled?: boolean
  loading?: boolean
  size?: 'sm' | 'md'
}

const tones: Record<Tone, { bg: string; fg: string; border: string }> = {
  brand: { bg: '#EEF3FC', fg: '#1A56DB', border: '#D5E2F8' },
  muted: { bg: '#F1F5F9', fg: '#475569', border: '#E2E8F0' },
  danger: { bg: '#FEF2F2', fg: '#DC2626', border: '#FECACA' },
  success: { bg: '#ECFDF5', fg: '#059669', border: '#A7F3D0' },
  warning: { bg: '#FFFBEB', fg: '#D97706', border: '#FDE68A' },
}

const sizes = {
  sm: { box: 34, icon: 16 },
  md: { box: 38, icon: 18 },
}

/** Compact square icon control for row actions (edit / archive / delete). */
export function IconButton({
  icon: Icon,
  label,
  onPress,
  tone = 'muted',
  disabled,
  loading,
  size = 'sm',
}: Props) {
  const t = tones[tone]
  const s = sizes[size]
  const blocked = disabled || loading

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!blocked, busy: !!loading }}
      disabled={blocked}
      hitSlop={6}
      onPress={() => {
        if (blocked) return
        lightTap()
        onPress?.()
      }}
      style={({ pressed }) => [
        blocked && styles.disabled,
        pressed && !blocked && styles.pressed,
      ]}
    >
      <View
        style={[
          styles.box,
          {
            width: s.box,
            height: s.box,
            backgroundColor: t.bg,
            borderColor: t.border,
          },
        ]}
      >
        {loading ? (
          <ActivityIndicator size="small" color={t.fg} />
        ) : (
          <Icon size={s.icon} color={t.fg} strokeWidth={2.2} />
        )}
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  box: {
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: { opacity: 0.4 },
  pressed: { opacity: 0.8, transform: [{ scale: 0.96 }] },
})
