import type { LucideIcon } from 'lucide-react-native'
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native'
import { lightTap } from '@/utils/haptics'

type Tone = 'brand' | 'soft' | 'muted' | 'danger'

type Props = {
  label: string
  onPress?: () => void
  icon?: LucideIcon
  tone?: Tone
  disabled?: boolean
  loading?: boolean
}

const tones: Record<
  Tone,
  { bg: string; fg: string; border: string; icon: string }
> = {
  brand: {
    bg: '#1A56DB',
    fg: '#FFFFFF',
    border: '#1A56DB',
    icon: '#FFFFFF',
  },
  soft: {
    bg: '#EEF3FC',
    fg: '#1A56DB',
    border: '#D5E2F8',
    icon: '#1A56DB',
  },
  muted: {
    bg: 'transparent',
    fg: '#334155',
    border: 'rgba(15, 23, 42, 0.12)',
    icon: '#64748B',
  },
  danger: {
    bg: '#FEF2F2',
    fg: '#DC2626',
    border: '#FECACA',
    icon: '#DC2626',
  },
}

/** Compact capsule control for page headers & inline tools — not a full CTA brick. */
export function ActionChip({
  label,
  onPress,
  icon: Icon,
  tone = 'soft',
  disabled,
  loading,
}: Props) {
  const t = tones[tone]

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled || loading}
      onPress={() => {
        lightTap()
        onPress?.()
      }}
      style={({ pressed }) => [
        styles.hit,
        (disabled || loading) && styles.disabled,
        pressed && !disabled && styles.pressed,
      ]}
    >
      <View style={[styles.chip, { backgroundColor: t.bg, borderColor: t.border }]}>
        {loading ? (
          <ActivityIndicator size="small" color={t.fg} />
        ) : Icon ? (
          <Icon size={14} color={t.icon} strokeWidth={2.4} />
        ) : null}
        <Text style={[styles.label, { color: t.fg }]} numberOfLines={1}>
          {loading ? 'Working…' : label}
        </Text>
      </View>
    </Pressable>
  )
}

/** Round icon affordance — primary “add” without a wide button. */
export function ActionOrb({
  onPress,
  icon: Icon,
  label,
  disabled,
  loading,
}: {
  onPress?: () => void
  icon: LucideIcon
  label: string
  disabled?: boolean
  loading?: boolean
}) {
  const blocked = disabled || loading
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!blocked, busy: !!loading }}
      disabled={blocked}
      onPress={() => {
        if (blocked) return
        lightTap()
        onPress?.()
      }}
      style={({ pressed }) => [
        styles.orbHit,
        blocked && styles.disabled,
        pressed && !blocked && styles.pressed,
      ]}
    >
      <View style={styles.orb}>
        {loading ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <Icon size={18} color="#FFFFFF" strokeWidth={2.5} />
        )}
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  hit: { alignSelf: 'flex-start' },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 7,
    minHeight: 32,
    borderRadius: 999,
    borderWidth: 1,
  },
  label: {
    fontSize: 12.5,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  orbHit: { alignSelf: 'flex-start' },
  orb: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1A56DB',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1A56DB',
    shadowOpacity: 0.28,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  disabled: { opacity: 0.4 },
  pressed: { opacity: 0.85, transform: [{ scale: 0.97 }] },
})
