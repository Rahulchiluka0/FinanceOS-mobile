import { useEffect, useState } from 'react'
import { Alert, Pressable, StyleSheet, Switch, Text, View } from 'react-native'
import { router } from 'expo-router'
import { useAuth } from '@/context/AuthContext'
import { useBiometrics } from '@/hooks/useBiometrics'
import { Screen } from '@/components/layout/Screen'
import { PageHead } from '@/components/ui/PageHead'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { SelectField } from '@/components/ui/SelectField'
import { colors, radius } from '@/theme'
import { successTap } from '@/utils/haptics'
import { initials } from '@/utils/format'

export default function SettingsScreen() {
  const { user, updateProfile, changePassword, logout } = useAuth()
  const { available, enabled, setBiometricEnabled } = useBiometrics()
  const [name, setName] = useState(user?.name || '')
  const [password, setPassword] = useState({ current: '', next: '', confirm: '' })
  const [prefs, setPrefs] = useState({
    currency: user?.currency || 'INR',
    timezone: user?.timezone || 'Asia/Kolkata',
    dateFormat: user?.dateFormat || 'DD/MM/YYYY',
    theme: user?.theme || 'light',
  })
  const [busy, setBusy] = useState<'profile' | 'password' | 'prefs' | null>(null)

  useEffect(() => {
    if (!user) return
    setName(user.name || '')
    setPrefs({
      currency: user.currency || 'INR',
      timezone: user.timezone || 'Asia/Kolkata',
      dateFormat: user.dateFormat || 'DD/MM/YYYY',
      theme: user.theme || 'light',
    })
  }, [user])

  const saveProfile = async () => {
    if (!name.trim()) return Alert.alert('Name is required')
    setBusy('profile')
    try {
      await updateProfile({ name: name.trim() })
      await successTap()
      Alert.alert('Saved', 'Profile updated')
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to save profile')
    } finally {
      setBusy(null)
    }
  }

  const savePassword = async () => {
    if (!password.current || !password.next) return Alert.alert('Fill all password fields')
    if (password.next !== password.confirm) return Alert.alert('Passwords do not match')
    setBusy('password')
    try {
      await changePassword({
        currentPassword: password.current,
        newPassword: password.next,
      })
      setPassword({ current: '', next: '', confirm: '' })
      await successTap()
      Alert.alert('Saved', 'Password updated')
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to update password')
    } finally {
      setBusy(null)
    }
  }

  const savePrefs = async () => {
    setBusy('prefs')
    try {
      await updateProfile(prefs)
      await successTap()
      Alert.alert('Saved', 'Preferences updated')
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to save preferences')
    } finally {
      setBusy(null)
    }
  }

  return (
    <Screen>
      <PageHead kicker="Account" title="Settings" subtitle="Profile, preferences, and security." />

      <View style={styles.panel}>
        <Text style={styles.h2}>Profile</Text>
        <View style={styles.avatarRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials(name || user?.name)}</Text>
          </View>
          <Text style={styles.meta}>{user?.email}</Text>
        </View>
        <Input label="Display name" value={name} onChangeText={setName} />
        <Button loading={busy === 'profile'} disabled={busy !== null && busy !== 'profile'} onPress={saveProfile}>
          Save profile
        </Button>
      </View>

      <View style={styles.panel}>
        <Text style={styles.h2}>Change password</Text>
        <Input
          label="Current password"
          secureTextEntry
          value={password.current}
          onChangeText={(current) => setPassword((p) => ({ ...p, current }))}
        />
        <Input
          label="New password"
          secureTextEntry
          value={password.next}
          onChangeText={(next) => setPassword((p) => ({ ...p, next }))}
        />
        <Input
          label="Confirm password"
          secureTextEntry
          value={password.confirm}
          onChangeText={(confirm) => setPassword((p) => ({ ...p, confirm }))}
        />
        <Button loading={busy === 'password'} disabled={busy !== null && busy !== 'password'} onPress={savePassword}>
          Update password
        </Button>
      </View>

      <View style={styles.panel}>
        <Text style={styles.h2}>Preferences</Text>
        <SelectField
          label="Currency"
          value={prefs.currency}
          options={[
            { label: 'INR — Indian Rupee', value: 'INR' },
            { label: 'USD — US Dollar', value: 'USD' },
            { label: 'EUR — Euro', value: 'EUR' },
            { label: 'GBP — British Pound', value: 'GBP' },
          ]}
          onChange={(currency) => setPrefs((p) => ({ ...p, currency }))}
        />
        <SelectField
          label="Timezone"
          value={prefs.timezone}
          options={[
            { label: 'Asia/Kolkata', value: 'Asia/Kolkata' },
            { label: 'UTC', value: 'UTC' },
            { label: 'America/New_York', value: 'America/New_York' },
            { label: 'Europe/London', value: 'Europe/London' },
          ]}
          onChange={(timezone) => setPrefs((p) => ({ ...p, timezone }))}
        />
        <SelectField
          label="Date format"
          value={prefs.dateFormat}
          options={[
            { label: 'DD/MM/YYYY', value: 'DD/MM/YYYY' },
            { label: 'MM/DD/YYYY', value: 'MM/DD/YYYY' },
            { label: 'YYYY-MM-DD', value: 'YYYY-MM-DD' },
          ]}
          onChange={(dateFormat) => setPrefs((p) => ({ ...p, dateFormat }))}
        />
        <SelectField
          label="Theme"
          value={prefs.theme}
          options={[
            { label: 'Light', value: 'light' },
            { label: 'System', value: 'system' },
          ]}
          onChange={(theme) => setPrefs((p) => ({ ...p, theme }))}
        />
        <Button loading={busy === 'prefs'} disabled={busy !== null && busy !== 'prefs'} onPress={savePrefs}>
          Save preferences
        </Button>
      </View>

      <View style={styles.panel}>
        <Text style={styles.h2}>Security</Text>
        <View style={styles.switchRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>Biometric unlock</Text>
            <Text style={styles.meta}>
              {available ? 'Use Face ID / fingerprint to unlock' : 'Not available on this device'}
            </Text>
          </View>
          <Switch
            value={enabled}
            disabled={!available}
            onValueChange={async (next) => {
              await setBiometricEnabled(next)
              await successTap()
            }}
            trackColor={{ true: colors.brand, false: colors.borderStrong }}
          />
        </View>
      </View>

      <Pressable
        style={styles.logout}
        onPress={() => {
          logout()
          router.replace('/(auth)/login')
        }}
      >
        <Text style={styles.logoutText}>Log out</Text>
      </Pressable>
    </Screen>
  )
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    gap: 10,
    marginBottom: 14,
  },
  h2: { fontSize: 16, fontWeight: '800', color: colors.ink },
  avatarRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.brandSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: colors.brand, fontWeight: '800' },
  meta: { color: colors.muted, fontSize: 13 },
  name: { fontWeight: '700', color: colors.ink },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  logout: {
    alignItems: 'center',
    paddingVertical: 16,
    marginBottom: 24,
  },
  logoutText: { color: colors.danger, fontWeight: '700', fontSize: 15 },
})
