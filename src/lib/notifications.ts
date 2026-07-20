import { Platform } from 'react-native'
import Constants from 'expo-constants'

/** Expo Go removed remote push support (SDK 53+); skip native module there. */
function isExpoGo() {
  return Constants.appOwnership === 'expo'
}

async function getNotifications() {
  if (isExpoGo() || Platform.OS === 'web') return null
  try {
    return await import('expo-notifications')
  } catch {
    return null
  }
}

/** Register for local/remote push (no-op in Expo Go). */
export async function registerForPushNotificationsAsync() {
  if (isExpoGo() || Platform.OS === 'web') return null

  const Notifications = await getNotifications()
  if (!Notifications) return null

  const Device = await import('expo-device')
  if (!Device.isDevice) return null

  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: false,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    })

    const { status: existing } = await Notifications.getPermissionsAsync()
    let finalStatus = existing
    if (existing !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync()
      finalStatus = status
    }
    if (finalStatus !== 'granted') return null

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'FinanceOS',
        importance: Notifications.AndroidImportance.DEFAULT,
      })
    }

    const token = await Notifications.getExpoPushTokenAsync()
    return token.data
  } catch {
    return null
  }
}

export async function scheduleLocalReminder(title: string, body: string, seconds = 2) {
  if (isExpoGo() || Platform.OS === 'web') return

  const Notifications = await getNotifications()
  if (!Notifications) return

  try {
    await Notifications.scheduleNotificationAsync({
      content: { title, body },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds,
      },
    })
  } catch {
    /* ignore in unsupported environments */
  }
}
