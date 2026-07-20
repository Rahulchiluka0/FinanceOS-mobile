import { Children, type ReactNode } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { colors, radius } from '@/theme'

type Tone = 'neutral' | 'success' | 'danger' | 'warning' | 'info'

const tones: Record<Tone, { bg: string; fg: string }> = {
  neutral: { bg: colors.bgElevated, fg: colors.inkSoft },
  success: { bg: '#e0f2fe', fg: colors.success },
  danger: { bg: colors.dangerSoft, fg: colors.danger },
  warning: { bg: '#fef3c7', fg: colors.warning },
  info: { bg: colors.brandSoft, fg: colors.brand },
}

function toLabel(children: ReactNode) {
  return Children.toArray(children)
    .map((child) => {
      if (typeof child === 'string' || typeof child === 'number') return String(child)
      return ''
    })
    .join('')
}

export function Badge({ children, tone = 'neutral' }: { children: ReactNode; tone?: Tone }) {
  const t = tones[tone]
  return (
    <View style={[styles.badge, { backgroundColor: t.bg }]}>
      <Text style={[styles.text, { color: t.fg }]}>{toLabel(children)}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  text: { fontSize: 12, fontWeight: '700' },
})
