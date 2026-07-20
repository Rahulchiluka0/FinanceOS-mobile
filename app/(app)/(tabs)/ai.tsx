import { useCallback, useEffect, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { router } from 'expo-router'
import { Activity, Brain, RefreshCw, Send } from 'lucide-react-native'
import { aiApi } from '@/api'
import { Screen } from '@/components/layout/Screen'
import { PageHead } from '@/components/ui/PageHead'
import { MetricTile } from '@/components/ui/MetricTile'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { LoadingState } from '@/components/ui/LoadingState'
import { formatCurrency } from '@/utils/format'
import { colors, radius } from '@/theme'
import { lightTap } from '@/utils/haptics'

const SUGGESTIONS = ['Food last month', 'Biggest expense', 'Subscriptions total', 'Savings rate']

type Fact = { key?: string; label?: string; value?: string }
type Citation = { period?: string; filters?: string }
type Msg = {
  id: string
  role: 'user' | 'bot'
  text: string
  facts?: Fact[]
  citations?: Citation[]
}

export default function AIScreen() {
  const [hub, setHub] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [threadId, setThreadId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Msg[]>([
    {
      id: 'welcome',
      role: 'bot',
      text: 'Ask about food, budgets, subscriptions, or savings — answers are grounded in your ledger.',
      facts: [],
    },
  ])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    try {
      const data = await aiApi.dashboard()
      setHub(data)
      setError('')
    } catch (err: any) {
      setError(err.message || 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const refresh = async () => {
    setRefreshing(true)
    lightTap()
    try {
      await aiApi.refreshProfile()
      await load()
    } catch (err: any) {
      setError(err.message || 'Refresh failed')
    } finally {
      setRefreshing(false)
    }
  }

  const ask = async (message: string) => {
    const text = message.trim()
    if (!text || busy) return
    setInput('')
    setMessages((m) => [...m, { id: `u-${Date.now()}`, role: 'user', text }])
    setBusy(true)
    lightTap()
    try {
      const res = await aiApi.chat(text, { threadId, client: 'mobile' })
      if (res.threadId) setThreadId(res.threadId)
      setMessages((m) => [
        ...m,
        {
          id: `b-${Date.now()}`,
          role: 'bot',
          text: res.answer || res.reply || 'No reply.',
          facts: (res.facts || []).slice(0, 6),
          citations: res.citations || [],
        },
      ])
    } catch (err: any) {
      setMessages((m) => [
        ...m,
        { id: `e-${Date.now()}`, role: 'bot', text: err.message || 'Something went wrong.' },
      ])
    } finally {
      setBusy(false)
    }
  }

  const summary = hub?.summary || {}
  const twin = hub?.twin || {}
  const checklist: string[] = twin.meta?.checklist || []

  if (loading && !hub) {
    return (
      <Screen>
        <LoadingState label="Building Twin…" />
      </Screen>
    )
  }

  return (
    <Screen>
      <PageHead
        kicker="Intelligence"
        title="AI Hub"
        subtitle={
          hub?.asOf
            ? `Based on data as of ${new Date(hub.asOf).toLocaleString('en-IN')}`
            : 'Financial Twin overview'
        }
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.actions}>
        <Button variant="secondary" onPress={refresh} disabled={refreshing}>
          <RefreshCw size={16} color={colors.brand} />
          {refreshing ? 'Refreshing…' : 'Refresh Twin'}
        </Button>
        <Pressable
          style={styles.linkChip}
          onPress={() => {
            lightTap()
            router.push('/(app)/ai-cfo')
          }}
        >
          <Brain size={16} color={colors.brand} />
          <Text style={styles.linkText}>Personal CFO</Text>
        </Pressable>
        <Pressable
          style={styles.linkChip}
          onPress={() => {
            lightTap()
            router.push('/(app)/ai-health')
          }}
        >
          <Activity size={16} color={colors.brand} />
          <Text style={styles.linkText}>Health</Text>
        </Pressable>
      </View>

      <View style={styles.metrics}>
        <MetricTile label="Health" value={`${summary.healthScore ?? 0}/100`} />
        <MetricTile label="Saving rate" value={`${summary.savingsRate ?? 0}%`} />
        <MetricTile label="Net worth" value={formatCurrency(summary.netWorth ?? 0)} />
        <MetricTile label="Runway" value={`${summary.runwayMonths ?? 0} mo`} />
      </View>

      {checklist.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Twin warming up</Text>
          {checklist.map((c) => (
            <Text key={c} style={styles.muted}>
              • {c}
            </Text>
          ))}
        </View>
      )}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>What Twin knows</Text>
        <Text style={styles.muted}>
          Balance {formatCurrency(summary.totalBalance)} · Budgets {twin.budgets?.onTrack ?? 0} on
          track / {twin.budgets?.over ?? 0} over
        </Text>
        <Text style={styles.muted}>
          Risk {(twin.risk?.level || 'low').toUpperCase()} — {(twin.risk?.reasons || []).join('; ')}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Ask My Money</Text>
        <Text style={styles.muted}>Tool-grounded answers from your real ledger</Text>
        {messages.slice(-6).map((m) => (
          <View
            key={m.id}
            style={[styles.bubble, m.role === 'user' ? styles.bubbleUser : styles.bubbleBot]}
          >
            <Text style={m.role === 'user' ? styles.bubbleUserText : styles.bubbleBotText}>
              {m.text}
            </Text>
            {m.role === 'bot' && m.facts && m.facts.length > 0 ? (
              <View style={styles.factRow}>
                {m.facts.map((f, i) => (
                  <View key={`${f.key || i}-${i}`} style={styles.factPill}>
                    <Text style={styles.factText}>
                      {[f.value, f.label].filter(Boolean).join(' · ')}
                    </Text>
                  </View>
                ))}
                {(m.citations || []).slice(0, 2).map((c, i) => (
                  <View key={`c-${i}`} style={[styles.factPill, styles.factCite]}>
                    <Text style={styles.factCiteText}>
                      {[c.period, c.filters].filter(Boolean).join(' · ')}
                    </Text>
                  </View>
                ))}
              </View>
            ) : null}
          </View>
        ))}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.suggestRow}>
          {SUGGESTIONS.map((s) => (
            <Pressable
              key={s}
              style={styles.suggestChip}
              disabled={busy}
              onPress={() => ask(s)}
            >
              <Text style={styles.suggestText}>{s}</Text>
            </Pressable>
          ))}
        </ScrollView>
        <View style={styles.composer}>
          <View style={{ flex: 1 }}>
            <Input
              value={input}
              onChangeText={setInput}
              placeholder="e.g. Food last month"
              onSubmitEditing={() => ask(input)}
            />
          </View>
          <Button onPress={() => ask(input)} disabled={busy || !input.trim()}>
            <Send size={16} color="#fff" />
            Send
          </Button>
        </View>
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  error: { color: colors.danger, marginBottom: 8, fontSize: 13 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  linkChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  linkText: { color: colors.brand, fontWeight: '600', fontSize: 13 },
  metrics: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 14 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTitle: { fontWeight: '700', color: colors.ink, marginBottom: 8 },
  muted: { color: colors.muted, fontSize: 13, marginBottom: 4, lineHeight: 18 },
  bubble: { padding: 10, borderRadius: radius.md, marginBottom: 8, maxWidth: '92%' },
  bubbleUser: { alignSelf: 'flex-end', backgroundColor: colors.brand },
  bubbleBot: { alignSelf: 'flex-start', backgroundColor: colors.bg },
  bubbleUserText: { color: '#fff', fontSize: 13 },
  bubbleBotText: { color: colors.ink, fontSize: 13 },
  factRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  factPill: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    maxWidth: '100%',
  },
  factText: { fontSize: 11, color: colors.muted, fontWeight: '600' },
  factCite: { borderStyle: 'dashed', borderColor: colors.brand },
  factCiteText: { fontSize: 11, color: colors.brand, fontWeight: '600' },
  suggestRow: { marginTop: 4, marginBottom: 4, maxHeight: 40 },
  suggestChip: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bg,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
  },
  suggestText: { fontSize: 12, fontWeight: '600', color: colors.ink },
  composer: { flexDirection: 'row', gap: 8, alignItems: 'center', marginTop: 8 },
})
