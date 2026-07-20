import { StyleSheet, Text, View } from 'react-native'
import { colors } from '@/theme'

type Props = {
  kicker?: string
  title: string
  highlight?: string
  subtitle?: string
  /** Compact chips / orbs — keep these small (ActionChip / ActionOrb). */
  actions?: React.ReactNode
}

export function PageHead({ kicker, title, highlight, subtitle, actions }: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.top}>
        <View style={styles.copy}>
          {kicker ? <Text style={styles.kicker}>{kicker}</Text> : null}
          <Text style={styles.title} numberOfLines={2}>
            {title}
            {highlight ? <Text style={styles.highlight}> {highlight}</Text> : null}
          </Text>
        </View>
        {actions ? <View style={styles.actionsTop}>{actions}</View> : null}
      </View>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 18, gap: 8 },
  top: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  copy: { flex: 1, gap: 4, minWidth: 0 },
  kicker: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.brand,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.ink,
    letterSpacing: -0.5,
    lineHeight: 30,
  },
  highlight: { color: colors.brand },
  subtitle: { fontSize: 14, color: colors.muted, lineHeight: 20 },
  actionsTop: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingTop: 2,
  },
})
