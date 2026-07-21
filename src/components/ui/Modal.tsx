import { Component, type ErrorInfo, type ReactNode } from 'react'
import {
  Modal as RNModal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { X } from 'lucide-react-native'
import { useKeyboardHeight } from '@/hooks/useKeyboardHeight'
import { colors, radius } from '@/theme'

type Props = {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
  wide?: boolean
}

class ModalBodyErrorBoundary extends Component<
  { onClose: () => void; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[Modal] render crash', error, info.componentStack)
  }

  componentDidUpdate(prev: { children: ReactNode }) {
    if (prev.children !== this.props.children && this.state.failed) {
      this.setState({ failed: false })
    }
  }

  render() {
    if (this.state.failed) {
      return (
        <View style={styles.errorBox}>
          <Text style={styles.errorTitle}>Couldn’t open this form</Text>
          <Text style={styles.errorBody}>Something went wrong while loading the sheet.</Text>
          <Pressable
            onPress={() => {
              this.setState({ failed: false })
              this.props.onClose()
            }}
            style={styles.errorBtn}
          >
            <Text style={styles.errorBtnText}>Close</Text>
          </Pressable>
        </View>
      )
    }
    return this.props.children
  }
}

export function Modal({ open, title, onClose, children }: Props) {
  const insets = useSafeAreaInsets()
  const keyboardHeight = useKeyboardHeight()
  const keyboardOpen = keyboardHeight > 0

  if (!open) return null

  return (
    <RNModal
      visible
      animationType="slide"
      transparent
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.root}>
        <KeyboardAvoidingView
          style={styles.overlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 0}
        >
          <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Dismiss" />
          <View
            style={[
              styles.sheet,
              {
                paddingBottom: Math.max(insets.bottom, 16) + 8,
                // Lift sheet above keyboard (pan mode — window does not shrink).
                marginBottom: keyboardOpen ? keyboardHeight : 0,
                maxHeight: '92%',
              },
            ]}
          >
            <View style={styles.head}>
              <Text style={styles.title} numberOfLines={1}>
                {title}
              </Text>
              <Pressable onPress={onClose} hitSlop={12} accessibilityLabel="Close" style={styles.close}>
                <X size={22} color={colors.inkSoft} />
              </Pressable>
            </View>
            <ScrollView
              contentContainerStyle={styles.body}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              showsVerticalScrollIndicator={false}
              bounces={false}
              automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
            >
              <ModalBodyErrorBoundary onClose={onClose}>{children}</ModalBodyErrorBoundary>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </RNModal>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(11, 18, 32, 0.45)',
  },
  sheet: {
    maxHeight: '92%',
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    overflow: 'hidden',
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 12,
  },
  title: { flex: 1, fontSize: 18, fontWeight: '800', color: colors.ink },
  close: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bgElevated,
  },
  body: { padding: 20, gap: 14, paddingBottom: 8 },
  errorBox: { gap: 10, paddingVertical: 8 },
  errorTitle: { fontSize: 16, fontWeight: '800', color: colors.ink },
  errorBody: { fontSize: 14, color: colors.muted, lineHeight: 20 },
  errorBtn: {
    alignSelf: 'flex-start',
    backgroundColor: colors.brandSoft,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radius.md,
  },
  errorBtnText: { color: colors.brand, fontWeight: '700' },
})
