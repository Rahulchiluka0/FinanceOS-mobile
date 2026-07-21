import { Children, isValidElement, type ReactNode } from 'react'
import {
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { Modal } from '@/components/ui/Modal'
import { useKeyboardHeight } from '@/hooks/useKeyboardHeight'
import { colors } from '@/theme'

type Props = {
  children: ReactNode
  scroll?: boolean
  refreshing?: boolean
  onRefresh?: () => void
  style?: StyleProp<ViewStyle>
  contentStyle?: StyleProp<ViewStyle>
  /** Safe-area edges. Default skips bottom (tab bar / stack header handle it). */
  edges?: ('top' | 'right' | 'bottom' | 'left')[]
  /** Extra bottom padding inside scroll content (above tab bar / home indicator). */
  bottomPad?: number
  /** Allow taps on buttons while the keyboard is open (e.g. chat Send). */
  keyboardShouldPersistTaps?: 'always' | 'handled' | 'never'
}

function isModalElement(child: ReactNode) {
  return isValidElement(child) && child.type === Modal
}

/**
 * Keep RN Modals as siblings of ScrollView (not descendants).
 * Nesting Modal inside ScrollView is a common Android hard-crash with Fabric/New Arch.
 */
function splitOverlays(children: ReactNode) {
  const content: ReactNode[] = []
  const overlays: ReactNode[] = []
  Children.forEach(children, (child) => {
    if (isModalElement(child)) overlays.push(child)
    else content.push(child)
  })
  return { content, overlays }
}

export function Screen({
  children,
  scroll = true,
  refreshing,
  onRefresh,
  style,
  contentStyle,
  edges = ['top', 'left', 'right'],
  bottomPad,
  keyboardShouldPersistTaps = 'handled',
}: Props) {
  const insets = useSafeAreaInsets()
  const keyboardHeight = useKeyboardHeight()
  const { content, overlays } = splitOverlays(children)

  const basePad = bottomPad ?? Math.max(24, insets.bottom + 16)
  // With android softwareKeyboardLayoutMode: "pan", pad so focused fields stay above the keyboard.
  const keyboardPad = keyboardHeight > 0 ? Math.max(48, keyboardHeight - insets.bottom) : 0
  const padBottom = basePad + keyboardPad

  const contentStyles = [styles.content, { paddingBottom: padBottom }, contentStyle]

  const body = !scroll ? (
    <View style={[{ flex: 1 }, contentStyles]}>{content}</View>
  ) : (
    <ScrollView
      contentContainerStyle={contentStyles}
      keyboardShouldPersistTaps={keyboardShouldPersistTaps}
      keyboardDismissMode="on-drag"
      automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
      showsVerticalScrollIndicator={false}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={Boolean(refreshing)}
            onRefresh={onRefresh}
            tintColor={colors.brand}
            colors={[colors.brand]}
          />
        ) : undefined
      }
    >
      {content}
    </ScrollView>
  )

  return (
    <SafeAreaView edges={edges} style={[styles.safe, style]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
        {body}
      </KeyboardAvoidingView>
      {overlays}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 12, flexGrow: 1 },
})
