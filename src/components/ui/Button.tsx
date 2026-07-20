import { Children, isValidElement, type ReactNode } from 'react'
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type PressableProps,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native'
import { lightTap } from '@/utils/haptics'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

type Props = Omit<PressableProps, 'children' | 'style'> & {
  children: ReactNode
  variant?: Variant
  size?: Size
  loading?: boolean
  block?: boolean
  style?: StyleProp<ViewStyle>
  haptic?: boolean
}

/** Softer form/modal CTAs — page headers should use ActionChip instead. */
const fills: Record<Variant, ViewStyle> = {
  primary: { backgroundColor: '#1A56DB' },
  secondary: { backgroundColor: '#EEF3FC', borderWidth: 1, borderColor: '#D5E2F8' },
  ghost: { backgroundColor: 'transparent', borderWidth: 1, borderColor: 'rgba(15,23,42,0.12)' },
  danger: { backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA' },
}

const labelColor: Record<Variant, string> = {
  primary: '#FFFFFF',
  secondary: '#1A56DB',
  ghost: '#0B1220',
  danger: '#DC2626',
}

const paddings: Record<Size, ViewStyle> = {
  sm: { paddingHorizontal: 12, paddingVertical: 8, minHeight: 34 },
  md: { paddingHorizontal: 14, paddingVertical: 10, minHeight: 40 },
  lg: { paddingHorizontal: 16, paddingVertical: 12, minHeight: 44 },
}

const fontSizes: Record<Size, number> = { sm: 13, md: 14, lg: 15 }

function isTextish(node: ReactNode) {
  return typeof node === 'string' || typeof node === 'number'
}

function shouldStretch(style: StyleProp<ViewStyle> | undefined, block?: boolean) {
  if (block) return true
  const flat = StyleSheet.flatten(style) || {}
  return (
    flat.alignSelf === 'stretch' ||
    flat.width === '100%' ||
    flat.flex === 1 ||
    (typeof flat.flexGrow === 'number' && flat.flexGrow > 0)
  )
}

function renderLabel(children: ReactNode, color: string, fontSize: number) {
  const labelStyle: TextStyle = { color, fontSize, fontWeight: '700', textAlign: 'center' }

  if (isTextish(children)) {
    return (
      <Text style={labelStyle} numberOfLines={1}>
        {children}
      </Text>
    )
  }

  const items = Children.toArray(children)
  if (!items.length) return null
  if (items.every(isTextish)) {
    return (
      <Text style={labelStyle} numberOfLines={1}>
        {items.join('')}
      </Text>
    )
  }

  return (
    <View style={styles.inner}>
      {items.map((child, index) => {
        if (isTextish(child)) {
          return (
            <Text key={`t-${index}`} style={labelStyle} numberOfLines={1}>
              {child}
            </Text>
          )
        }
        if (isValidElement(child)) {
          return <View key={child.key ?? `e-${index}`}>{child}</View>
        }
        return null
      })}
    </View>
  )
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading,
  disabled,
  block,
  style,
  haptic = true,
  onPress,
  ...props
}: Props) {
  const color = labelColor[variant]
  const stretch = shouldStretch(style, block)

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || loading}
      onPress={(e) => {
        if (haptic) lightTap()
        onPress?.(e)
      }}
      style={({ pressed }) => [
        stretch ? styles.pressableBlock : styles.pressable,
        (disabled || loading) && styles.disabled,
        pressed && !disabled && styles.pressed,
        style,
      ]}
      {...props}
    >
      <View
        pointerEvents="none"
        style={[styles.chip, fills[variant], paddings[size], stretch && styles.chipBlock]}
      >
        {loading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator color={color} size="small" />
            {renderLabel(children, color, fontSizes[size])}
          </View>
        ) : (
          renderLabel(children, color, fontSizes[size])
        )}
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  pressable: { alignSelf: 'flex-start', flexGrow: 0, flexShrink: 0, borderRadius: 999 },
  pressableBlock: { borderRadius: 14 },
  chip: {
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  chipBlock: { alignSelf: 'stretch', width: '100%', borderRadius: 14 },
  inner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  loadingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  disabled: { opacity: 0.55 },
  pressed: { opacity: 0.88 },
})
