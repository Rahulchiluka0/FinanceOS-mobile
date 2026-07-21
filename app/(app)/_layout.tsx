import { useEffect } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated'
import { Redirect, Stack } from 'expo-router'
import { useAuth } from '@/context/AuthContext'
import { BrandMark } from '@/components/brand/BrandMark'
import { colors } from '@/theme'

function BootLoader() {
  const pulse = useSharedValue(0)
  const spin = useSharedValue(0)

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 900, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 900, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    )
    spin.value = withRepeat(withTiming(1, { duration: 2400, easing: Easing.linear }), -1, false)
  }, [pulse, spin])

  const mark = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(pulse.value, [0, 1], [0.92, 1.08]) }],
    opacity: interpolate(pulse.value, [0, 1], [0.85, 1]),
  }))

  const ring = useAnimatedStyle(() => ({
    transform: [{ rotate: `${spin.value * 360}deg` }],
  }))

  return (
    <View style={boot.wrap}>
      <View style={boot.orbitWrap}>
        <Animated.View style={[boot.orbit, ring]} />
        <Animated.View style={mark}>
          <BrandMark size={52} />
        </Animated.View>
      </View>
      <Text style={boot.title}>FinanceOS</Text>
      <Text style={boot.sub}>Opening your workspace…</Text>
    </View>
  )
}

const boot = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg,
    gap: 10,
  },
  orbitWrap: {
    width: 88,
    height: 88,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  orbit: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 44,
    borderWidth: 1.5,
    borderColor: colors.brandSoft,
    borderStyle: 'dashed',
  },
  title: { fontSize: 20, fontWeight: '800', color: colors.ink, letterSpacing: -0.3 },
  sub: { fontSize: 14, color: colors.muted },
})

export default function AppLayout() {
  const { isAuthenticated, bootstrapping } = useAuth()

  if (bootstrapping) {
    return <BootLoader />
  }

  if (!isAuthenticated) return <Redirect href="/(auth)/login" />

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerTintColor: colors.brand,
        headerTitleStyle: { fontWeight: '700', color: colors.ink },
        headerStyle: { backgroundColor: colors.bg },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.bg },
        headerBackTitle: 'Back',
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="categories" options={{ title: 'Categories' }} />
      <Stack.Screen name="budgets" options={{ title: 'Budgets' }} />
      <Stack.Screen name="goals" options={{ title: 'Savings Goals' }} />
      <Stack.Screen name="recurring" options={{ title: 'Recurring' }} />
      <Stack.Screen name="bills" options={{ title: 'Bills' }} />
      <Stack.Screen name="calendar" options={{ title: 'Calendar' }} />
      <Stack.Screen name="loans" options={{ title: 'Loans & EMI' }} />
      <Stack.Screen name="investments" options={{ title: 'Investments' }} />
      <Stack.Screen name="subscriptions" options={{ title: 'Subscriptions' }} />
      <Stack.Screen name="currencies" options={{ title: 'Multi-Currency' }} />
      <Stack.Screen name="reports" options={{ title: 'Reports' }} />
      <Stack.Screen name="insights" options={{ title: 'Smart Insights' }} />
      <Stack.Screen name="ai-cfo" options={{ title: 'Personal CFO' }} />
      <Stack.Screen name="ai-health" options={{ title: 'Financial Health' }} />
      <Stack.Screen name="ai-goals" options={{ title: 'Goal Planner' }} />
      <Stack.Screen name="ai-replay" options={{ title: 'Money Replay' }} />
      <Stack.Screen name="ai-simulator" options={{ title: 'Life Simulator' }} />
      <Stack.Screen name="tags" options={{ title: 'Tags' }} />
      <Stack.Screen name="search" options={{ title: 'Search' }} />
      <Stack.Screen name="notifications" options={{ title: 'Notifications' }} />
      <Stack.Screen name="import-export" options={{ title: 'Import / Export' }} />
      <Stack.Screen name="settings" options={{ title: 'Settings' }} />
    </Stack>
  )
}
