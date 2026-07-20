import { useEffect, useRef, useState } from 'react'
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { aiApi } from '@/api'
import { useData, useEnsureData } from '@/context/DataContext'
import { Screen } from '@/components/layout/Screen'
import { PageHead } from '@/components/ui/PageHead'
import { MetricTile } from '@/components/ui/MetricTile'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { LoadingState } from '@/components/ui/LoadingState'
import { colors, radius } from '@/theme'

type Msg = { id: string; role: 'user' | 'bot'; text: string }

export default function AIScreen() {
  useEnsureData(['dashboard'])
  const insets = useSafeAreaInsets()
  const { dashboard } = useData()
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [loadingTips, setLoadingTips] = useState(true)
  const [messages, setMessages] = useState<Msg[]>([
    {
      id: 'welcome',
      role: 'bot',
      text: 'Ask about budgets, savings, or spending — I’ll share practical FinanceOS tips.',
    },
  ])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const listRef = useRef<FlatList>(null)

  useEffect(() => {
    aiApi
      .suggestions()
      .then((data: any) => setSuggestions(Array.isArray(data) ? data : data?.items || []))
      .catch(() => setSuggestions([]))
      .finally(() => setLoadingTips(false))
  }, [])

  const send = async () => {
    const message = input.trim()
    if (!message || busy) return
    setInput('')
    const userMsg: Msg = { id: `u-${Date.now()}`, role: 'user', text: message }
    setMessages((m) => [...m, userMsg])
    setBusy(true)
    try {
      const res = await aiApi.chat(message)
      setMessages((m) => [
        ...m,
        { id: `b-${Date.now()}`, role: 'bot', text: res.reply || 'No reply.' },
      ])
    } catch (err: any) {
      setMessages((m) => [
        ...m,
        { id: `e-${Date.now()}`, role: 'bot', text: err.message || 'Something went wrong.' },
      ])
    } finally {
      setBusy(false)
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100)
    }
  }

  return (
    <Screen scroll={false} contentStyle={{ padding: 0, flex: 1 }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={80}
      >
        <View style={{ padding: 16, paddingBottom: 0 }}>
          <PageHead
            kicker="Assistant"
            title="AI Coach"
            subtitle="Rule-based tips powered by your FinanceOS data."
          />
          <View style={styles.metrics}>
            <MetricTile
              label="Health"
              value={`${dashboard?.healthScore ?? 0}/100`}
              hint="Score"
            />
            <MetricTile
              label="Saving rate"
              value={`${dashboard?.savingRate ?? 0}%`}
              hint="This month"
            />
          </View>
        </View>

        <View style={styles.panel}>
          <Text style={styles.h2}>Suggestions</Text>
          {loadingTips ? <LoadingState label="Loading tips…" /> : null}
          {suggestions.slice(0, 4).map((s, i) => (
            <Text key={s.id || i} style={styles.tip}>
              • {s.title || s.text || s.message || String(s)}
            </Text>
          ))}
        </View>

        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          contentContainerStyle={styles.chat}
          renderItem={({ item }) => (
            <View style={[styles.bubble, item.role === 'user' ? styles.user : styles.bot]}>
              <Text style={[styles.bubbleText, item.role === 'user' && { color: '#fff' }]}>
                {item.text}
              </Text>
            </View>
          )}
        />

        <View style={[styles.composer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <View style={{ flex: 1 }}>
            <Input
              placeholder="Ask about budgets, savings…"
              value={input}
              onChangeText={setInput}
              onSubmitEditing={send}
              returnKeyType="send"
            />
          </View>
          <Button onPress={send} loading={busy} style={styles.sendBtn}>
            Send
          </Button>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  )
}

const styles = StyleSheet.create({
  metrics: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  panel: {
    marginHorizontal: 16,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    gap: 6,
    marginBottom: 8,
  },
  h2: { fontSize: 15, fontWeight: '800', color: colors.ink },
  tip: { fontSize: 13, color: colors.inkSoft, lineHeight: 18 },
  chat: { padding: 16, gap: 8, paddingBottom: 8 },
  bubble: {
    maxWidth: '85%',
    padding: 12,
    borderRadius: radius.md,
  },
  user: { alignSelf: 'flex-end', backgroundColor: colors.brand },
  bot: { alignSelf: 'flex-start', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  bubbleText: { fontSize: 14, color: colors.ink, lineHeight: 20 },
  composer: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.bg,
    alignItems: 'flex-end',
  },
  sendBtn: { minWidth: 72, marginBottom: 2, alignSelf: 'auto' },
})
