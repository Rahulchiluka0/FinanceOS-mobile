import { useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { Link } from 'expo-router'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { authApi } from '@/api'
import { BrandMark, Wordmark } from '@/components/brand/BrandMark'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Screen } from '@/components/layout/Screen'
import { forgotSchema, type ForgotValues } from '@/validation/auth'
import { colors } from '@/theme'

export default function ForgotPasswordScreen() {
  const [done, setDone] = useState(false)
  const [resetUrl, setResetUrl] = useState<string | null>(null)
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotValues>({
    resolver: zodResolver(forgotSchema),
    defaultValues: { email: '' },
  })

  const onSubmit = handleSubmit(async (values) => {
    try {
      const data = await authApi.forgotPassword(values.email.trim())
      setResetUrl(data?.resetUrl || null)
    } catch {
      /* anti-enumeration: always show success */
    } finally {
      setDone(true)
    }
  })

  return (
    <Screen>
      <View style={styles.brand}>
        <BrandMark size={40} />
        <Wordmark />
      </View>
      <Text style={styles.kicker}>Recovery</Text>
      <Text style={styles.title}>Forgot password</Text>
      <Text style={styles.muted}>
        Enter your email and we&apos;ll send a reset link if an account exists.
      </Text>

      {done ? (
        <View style={styles.success}>
          <Text style={styles.successTitle}>Check your inbox</Text>
          <Text style={styles.muted}>
            If that email is registered, a reset link has been prepared.
          </Text>
          {resetUrl ? (
            <Text style={styles.demo}>
              Demo reset URL:{'\n'}
              {resetUrl}
            </Text>
          ) : null}
          <Link href="/(auth)/login" style={styles.link}>
            Back to sign in
          </Link>
        </View>
      ) : (
        <View style={styles.form}>
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Email"
                placeholder="you@example.com"
                autoCapitalize="none"
                keyboardType="email-address"
                value={value}
                onChangeText={onChange}
                error={errors.email?.message}
              />
            )}
          />
          <Button size="lg" loading={isSubmitting} onPress={onSubmit}>
            Send reset link
          </Button>
          <Link href="/(auth)/login" style={styles.link}>
            Back to sign in
          </Link>
        </View>
      )}
    </Screen>
  )
}

const styles = StyleSheet.create({
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 },
  kicker: { color: colors.brand, fontWeight: '700', fontSize: 12, textTransform: 'uppercase' },
  title: { fontSize: 28, fontWeight: '800', color: colors.ink, marginTop: 4 },
  muted: { color: colors.muted, marginBottom: 16, lineHeight: 20 },
  form: { gap: 12 },
  success: { gap: 10 },
  successTitle: { fontSize: 18, fontWeight: '800', color: colors.ink },
  demo: { fontSize: 12, color: colors.inkSoft, backgroundColor: colors.brandSoft, padding: 12, borderRadius: 12 },
  link: { color: colors.brand, fontWeight: '700', marginTop: 8 },
})
