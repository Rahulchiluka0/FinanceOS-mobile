import { useCallback, useEffect, useState } from 'react'
import * as LocalAuthentication from 'expo-local-authentication'
import * as SecureStore from 'expo-secure-store'
import { Platform } from 'react-native'

const BIO_KEY = 'financeos_biometric_enabled'

export function useBiometrics() {
  const [available, setAvailable] = useState(false)
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    ;(async () => {
      if (Platform.OS === 'web') return
      const hasHardware = await LocalAuthentication.hasHardwareAsync()
      const enrolled = await LocalAuthentication.isEnrolledAsync()
      setAvailable(hasHardware && enrolled)
      const flag = await SecureStore.getItemAsync(BIO_KEY)
      setEnabled(flag === '1')
    })()
  }, [])

  const setBiometricEnabled = useCallback(async (next: boolean) => {
    if (Platform.OS === 'web') return
    await SecureStore.setItemAsync(BIO_KEY, next ? '1' : '0')
    setEnabled(next)
  }, [])

  const authenticate = useCallback(async (reason = 'Unlock FinanceOS') => {
    if (Platform.OS === 'web') return true
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: reason,
      cancelLabel: 'Cancel',
      disableDeviceFallback: false,
    })
    return result.success
  }, [])

  return { available, enabled, setBiometricEnabled, authenticate }
}
