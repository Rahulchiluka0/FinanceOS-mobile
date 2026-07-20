import { useState } from 'react'
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from 'react-native'
import { Link, router } from 'expo-router'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAuth } from '@/context/AuthContext'
import { BrandMark, Wordmark } from '@/components/brand/BrandMark'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Screen } from '@/components/layout/Screen'
import { registerSchema, type RegisterValues } from '@/validation/auth'
import { colors } from '@/theme'
import { errorTap, successTap } from '@/utils/haptics'

export default function RegisterScreen() {
  const { register } = useAuth()
  const [formError, setFormError] = useState('')
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', password: '', confirm: '' },
  })

  const onSubmit = handleSubmit(async (values) => {
    setFormError('')
    try {
      await register({
        name: values.name.trim(),
        email: values.email.trim(),
        password: values.password,
      })
      await successTap()
      router.replace('/(app)/(tabs)/dashboard')
    } catch (err: any) {
      await errorTap()
      setFormError(err.message || 'Registration failed')
    }
  })

  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.brand}>
          <BrandMark size={40} />
          <Wordmark />
        </View>
        <Text style={styles.kicker}>Create account</Text>
        <Text style={styles.title}>Join FinanceOS</Text>
        <Text style={styles.muted}>Start clarifying your money in minutes.</Text>

        <View style={styles.form}>
          <Controller
            control={control}
            name="name"
            render={({ field: { onChange, value } }) => (
              <Input label="Full name" value={value} onChangeText={onChange} error={errors.name?.message} />
            )}
          />
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Email"
                autoCapitalize="none"
                keyboardType="email-address"
                value={value}
                onChangeText={onChange}
                error={errors.email?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Password"
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
            Create account
          </Button>
          <Text style={styles.footer}>
            Already have an account?{' '}
            <Link href="/(auth)/login" style={styles.link}>
              Sign in
            </Link>
          </Text>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  )
}

const styles = StyleSheet.create({
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 },
  kicker: { color: colors.brand, fontWeight: '700', fontSize: 12, textTransform: 'uppercase' },
  title: { fontSize: 28, fontWeight: '800', color: colors.ink, marginTop: 4 },
  muted: { color: colors.muted, marginBottom: 16 },
  form: { gap: 12 },
  footer: { textAlign: 'center', color: colors.muted },
  link: { color: colors.brand, fontWeight: '700' },
})
