import { useEffect, useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated'
import { BrandMark } from '@/components/brand/BrandMark'
import { colors, radius } from '@/theme'

const MESSAGES = [
  'Pulling your accounts…',
  'Charting this month’s cash flow…',
  'Checking budgets & goals…',
  'Almost ready…',
]

function Pulse({
  delay = 0,
  style,
  height = 16,
  width = '100%' as number | `${number}%`,
}: {
  delay?: number
  style?: object
  height?: number
  width?: number | `${number}%`
}) {
  const t = useSharedValue(0)

  useEffect(() => {
    t.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 900, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 900, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        false,
      ),
    )
  }, [delay, t])

  const anim = useAnimatedStyle(() => ({
    opacity: interpolate(t.value, [0, 1], [0.38, 0.85]),
  }))

  return (
    <Animated.View
      style={[
        styles.bone,
        { height, width: width as any },
        style,
        anim,
      ]}
    />
  )
}

function OrbitRing() {
  const spin = useSharedValue(0)

  useEffect(() => {
    spin.value = withRepeat(
      withTiming(1, { duration: 2800, easing: Easing.linear }),
      -1,
      false,
    )
  }, [spin])

  const ring = useAnimatedStyle(() => ({
    transform: [{ rotate: `${spin.value * 360}deg` }],
  }))

  const pulse = useSharedValue(0)
  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1100, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 1100, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    )
  }, [pulse])

  const mark = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(pulse.value, [0, 1], [0.94, 1.06]) }],
  }))

  return (
    <View style={styles.orbitWrap}>
      <Animated.View style={[styles.orbit, ring]}>
        <View style={styles.orbitDot} />
      </Animated.View>
      <Animated.View style={mark}>
        <BrandMark size={56} />
      </Animated.View>
    </View>
  )
}

/** Branded skeleton shown while the first dashboard payload loads (e.g. after login). */
export function DashboardLoading() {
  const [msgIndex, setMsgIndex] = useState(0)
  const fade = useSharedValue(1)

  useEffect(() => {
    const id = setInterval(() => {
      fade.value = withSequence(
        withTiming(0, { duration: 180 }),
        withTiming(1, { duration: 280 }),
      )
      setMsgIndex((i) => (i + 1) % MESSAGES.length)
    }, 1600)
    return () => clearInterval(id)
  }, [fade])

  const msgStyle = useAnimatedStyle(() => ({ opacity: fade.value }))

  return (
    <View style={styles.root} accessibilityLabel="Loading dashboard">
      <OrbitRing />
      <Text style={styles.title}>Preparing your snapshot</Text>
      <Animated.Text style={[styles.subtitle, msgStyle]}>{MESSAGES[msgIndex]}</Animated.Text>

      <View style={styles.heroCard}>
        <Pulse delay={0} height={12} width="34%" />
        <Pulse delay={80} height={22} width="58%" style={{ marginTop: 10 }} />
        <Pulse delay={140} height={36} width="72%" style={{ marginTop: 14 }} />
        <Pulse delay={200} height={12} width="48%" style={{ marginTop: 12 }} />
      </View>

      <View style={styles.tiles}>
        {[0, 1, 2, 3].map((i) => (
          <View key={i} style={styles.tile}>
            <Pulse delay={i * 70} height={10} width="55%" />
            <Pulse delay={i * 70 + 60} height={20} width="70%" style={{ marginTop: 10 }} />
          </View>
        ))}
      </View>

      <View style={styles.chartCard}>
        <Pulse delay={120} height={12} width="40%" />
        <Pulse delay={180} height={110} width="100%" style={{ marginTop: 14, borderRadius: 16 }} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingTop: 28,
    paddingBottom: 24,
    alignItems: 'center',
  },
  orbitWrap: {
    width: 96,
    height: 96,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  orbit: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 48,
    borderWidth: 1.5,
    borderColor: colors.brandSoft,
    borderStyle: 'dashed',
  },
  orbitDot: {
    position: 'absolute',
    top: -5,
    left: '50%',
    marginLeft: -5,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.brand,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.ink,
    letterSpacing: -0.3,
  },
  subtitle: {
    marginTop: 6,
    marginBottom: 22,
    fontSize: 14,
    color: colors.muted,
    minHeight: 20,
  },
  heroCard: {
    alignSelf: 'stretch',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
    marginBottom: 12,
  },
  tiles: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 12,
  },
  tile: {
    width: '47.5%',
    flexGrow: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
  },
  chartCard: {
    alignSelf: 'stretch',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
  },
  bone: {
    backgroundColor: colors.brandSoft,
    borderRadius: 8,
  },
})
