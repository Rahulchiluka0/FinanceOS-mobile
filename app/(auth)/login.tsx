import { useState } from 'react'
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from 'react-native'
import { Link, router } from 'expo-router'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAuth } from '@/context/AuthContext'
import { BrandMark, Wordmark } from '@/components/brand/BrandMark'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { loginSchema, type LoginValues } from '@/validation/auth'
import { colors, radius } from '@/theme'
import { errorTap, successTap } from '@/utils/haptics'

export default function LoginScreen() {
  const { login } = useAuth()
  const [formError, setFormError] = useState('')
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: 'aarav@example.com', password: 'demo1234' },
  })

  const onSubmit = handleSubmit(async (values) => {
    setFormError('')
    try {
      await login(values.email.trim(), values.password)
      await successTap()
      router.replace('/(app)/(tabs)/dashboard')
    } catch (err: any) {
      await errorTap()
      setFormError(err.message || 'Login failed')
    }
  })

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.hero, { backgroundColor: colors.authGradientStart }]}>
        <View style={styles.brandRow}>
          <BrandMark size={48} />
          <View>
            <Wordmark light />
            <Text style={styles.tag}>Personal finance, clarified</Text>
          </View>
        </View>
        <Text style={styles.kicker}>FinanceOS</Text>
        <Text style={styles.heroTitle}>
          See every rupee.{'\n'}
          <Text style={styles.heroAccent}>Steer every goal.</Text>
        </Text>
        <Text style={styles.heroBody}>
          Accounts, budgets, and cash flow in one orbital workspace — built to feel as sharp as your
          money decisions.
        </Text>
      </View>

      <View style={styles.panel}>
        <Text style={styles.formKicker}>Sign in</Text>
        <Text style={styles.formTitle}>Welcome back</Text>
        <Text style={styles.muted}>Continue to your FinanceOS dashboard.</Text>

        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Email"
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              value={value}
              onBlur={onBlur}
              onChangeText={onChange}
              error={errors.email?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Password"
              secureTextEntry
              autoComplete="password"
              value={value}
              onBlur={onBlur}
              onChangeText={onChange}
              error={errors.password?.message || formError}
            />
          )}
        />

        <View style={styles.row}>
          <Link href="/(auth)/forgot-password" asChild>
            <Pressable>
              <Text style={styles.link}>Forgot password?</Text>
            </Pressable>
          </Link>
        </View>

        <Button size="lg" loading={isSubmitting} onPress={onSubmit}>
          Enter FinanceOS
        </Button>

        <Text style={styles.footer}>
          New here?{' '}
          <Link href="/(auth)/register" style={styles.link}>
            Create an account
          </Link>
        </Text>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  hero: {
    paddingHorizontal: 24,
    paddingTop: 56,
    paddingBottom: 28,
    gap: 10,
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  tag: { color: 'rgba(240,246,255,0.7)', fontSize: 12, marginTop: 2 },
  kicker: {
    color: '#93C5FD',
    fontWeight: '700',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  heroTitle: { color: '#F0F6FF', fontSize: 30, fontWeight: '800', letterSpacing: -0.6, lineHeight: 36 },
  heroAccent: { color: '#93C5FD' },
  heroBody: { color: 'rgba(240,246,255,0.78)', fontSize: 14, lineHeight: 21 },
  panel: {
    flex: 1,
    marginTop: -12,
    backgroundColor: colors.bg,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: 24,
    gap: 12,
  },
  formKicker: {
    color: colors.brand,
    fontWeight: '700',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  formTitle: { fontSize: 24, fontWeight: '800', color: colors.ink },
  muted: { color: colors.muted, fontSize: 14, marginBottom: 4 },
  row: { alignItems: 'flex-end' },
  link: { color: colors.brand, fontWeight: '700' },
  footer: { textAlign: 'center', color: colors.muted, marginTop: 8 },
})
