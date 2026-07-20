import { Redirect, Stack } from 'expo-router'
import { ActivityIndicator, View } from 'react-native'
import { useAuth } from '@/context/AuthContext'
import { colors } from '@/theme'

export default function AppLayout() {
  const { isAuthenticated, bootstrapping } = useAuth()

  if (bootstrapping) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator color={colors.brand} size="large" />
      </View>
    )
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
      <Stack.Screen name="tags" options={{ title: 'Tags' }} />
      <Stack.Screen name="search" options={{ title: 'Search' }} />
      <Stack.Screen name="notifications" options={{ title: 'Notifications' }} />
      <Stack.Screen name="import-export" options={{ title: 'Import / Export' }} />
      <Stack.Screen name="settings" options={{ title: 'Settings' }} />
    </Stack>
  )
}
