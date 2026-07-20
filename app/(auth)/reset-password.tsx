import { useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { Link, router, useLocalSearchParams } from 'expo-router'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { authApi } from '@/api'
import { BrandMark, Wordmark } from '@/components/brand/BrandMark'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Screen } from '@/components/layout/Screen'
import { resetSchema, type ResetValues } from '@/validation/auth'
import { colors } from '@/theme'
import { errorTap, successTap } from '@/utils/haptics'

export default function ResetPasswordScreen() {
  const { token } = useLocalSearchParams<{ token?: string }>()
  const [formError, setFormError] = useState('')
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetValues>({
    resolver: zodResolver(resetSchema),
    defaultValues: { password: '', confirm: '' },
  })

  const onSubmit = handleSubmit(async (values) => {
    setFormError('')
    if (!token || String(token).length < 20) {
      setFormError('Invalid or missing reset token')
      return
    }
    try {
      await authApi.resetPassword({ token: String(token), password: values.password })
      await successTap()
      router.replace('/(auth)/login')
    } catch (err: any) {
      await errorTap()
      setFormError(err.message || 'Reset failed')
    }
  })

  return (
    <Screen>
      <View style={styles.brand}>
        <BrandMark size={40} />
        <Wordmark />
      </View>
      <Text style={styles.kicker}>Security</Text>
      <Text style={styles.title}>Set new password</Text>
      <Text style={styles.muted}>Choose a strong password for your FinanceOS account.</Text>

      <View style={styles.form}>
        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, value } }) => (
            <Input
              label="New password"
              secureTextEntry
              hint="At least 8 characters"
              value={value}
              onChangeText={onChange}
              error={errors.password?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="confirm"
          render={({ field: { onChange, value } }) => (
            <Input
              label="Confirm password"
              secureTextEntry
              value={value}
              onChangeText={onChange}
              error={errors.confirm?.message || formError}
            />
          )}
        />
        <Button size="lg" loading={isSubmitting} onPress={onSubmit}>
          Update password
        </Button>
        <Link href="/(auth)/login" style={styles.link}>
          Back to sign in
        </Link>
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 },
  kicker: { color: colors.brand, fontWeight: '700', fontSize: 12, textTransform: 'uppercase' },
  title: { fontSize: 28, fontWeight: '800', color: colors.ink, marginTop: 4 },
  muted: { color: colors.muted, marginBottom: 16 },
  form: { gap: 12 },
  link: { color: colors.brand, fontWeight: '700', textAlign: 'center' },
})
