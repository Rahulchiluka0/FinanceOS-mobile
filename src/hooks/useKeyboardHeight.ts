import { useEffect, useState } from 'react'
import { Keyboard, Platform } from 'react-native'

/** Live keyboard height — use to pad/scroll content above the keyboard. */
export function useKeyboardHeight() {
  const [height, setHeight] = useState(0)

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow'
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide'

    const onShow = Keyboard.addListener(showEvent, (e) => {
      setHeight(e.endCoordinates?.height ?? 0)
    })
    const onHide = Keyboard.addListener(hideEvent, () => setHeight(0))

    return () => {
      onShow.remove()
      onHide.remove()
    }
  }, [])

  return height
}
