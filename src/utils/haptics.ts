import * as Haptics from 'expo-haptics'
import { Platform } from 'react-native'

export async function lightTap() {
  if (Platform.OS === 'web') return
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
  } catch {
    /* ignore */
  }
}

export async function successTap() {
  if (Platform.OS === 'web') return
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
  } catch {
    /* ignore */
  }
}

export async function errorTap() {
  if (Platform.OS === 'web') return
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
  } catch {
    /* ignore */
  }
}
