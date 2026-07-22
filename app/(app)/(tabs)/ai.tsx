import { useCallback, useEffect, useState } from 'react'
import {
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { router } from 'expo-router'
import {
  Activity,
  Brain,
  Film,
  FlaskConical,
  Lightbulb,
  RefreshCw,
  Send,
  Target,
} from 'lucide-react-native'
import { aiApi } from '@/api'
import { Screen } from '@/components/layout/Screen'
import { PageHead } from '@/components/ui/PageHead'
import { Badge } from '@/components/ui/Badge'
import { LoadingState } from '@/components/ui/LoadingState'
import { formatCurrency } from '@/utils/format'
import { colors, radius } from '@/theme'
import { lightTap } from '@/utils/haptics'

const SUGGESTIONS = ['Food last month', 'Biggest expense', 'Subscriptions total', 'Savings rate']

const TOOLS = [
  {
    href: '/(app)/ai-cfo',
    title: 'Personal CFO',
    sub: 'Twin snapshot',
    icon: Brain,
  },
  {
    href: '/(app)/ai-health',
    title: 'Health',
    sub: 'Score & factors',
    icon: Activity,
  },
  {
    href: '/(app)/ai-simulator',
    title: 'Simulator',
    sub: 'What-if cash',
    icon: FlaskConical,
  },
  {
    href: '/(app)/ai-replay',
    title: 'Replay',
    sub: 'Month story',
    icon: Film,
  },
  {
    href: '/(app)/ai-goals',
    title: 'Goals',
    sub: 'Surplus ideas',
    icon: Target,
  },
  {
    href: '/(app)/insights',
    title: 'Coach',
    sub: 'Smart insights',
    icon: Lightbulb,
  },
] as const

type Fact = { key?: string; label?: string; value?: string }
type Citation = { period?: string; filters?: string }
type Msg = {
  id: string
  role: 'user' | 'bot'
  text: string
  facts?: Fact[]
  citations?: Citation[]
}

function riskTone(level?: string): 'success' | 'warning' | 'danger' | 'neutral' {
  const l = (level || '').toLowerCase()
  if (l === 'low') return 'success'
  if (l === 'medium') return 'warning'
  if (l === 'high' || l === 'critical') return 'danger'
  return 'neutral'
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
      text: 'Ask about food, budgets, subscriptions, or savings — answers stay grounded in your ledger.',
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
    Keyboard.dismiss()
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
  const canSend = Boolean(input.trim()) && !busy
  const risk = twin?.risk?.level || summary?.riskLevel
  const tone = riskTone(risk)

  if (loading && !hub) {
    return (
      <Screen>
        <LoadingState label="Building Twin…" />
      </Screen>
    )
  }

  return (
    <Screen keyboardShouldPersistTaps="always" refreshing={refreshing} onRefresh={refresh}>
      <PageHead
        kicker="Intelligence"
        title="AI Hub"
        subtitle={
          hub?.asOf
            ? `Twin as of ${new Date(hub.asOf).toLocaleString('en-IN')}`
            : 'Your money, explained'
        }
        actions={
          <Pressable onPress={refresh} style={styles.refreshBtn} disabled={refreshing}>
            <RefreshCw size={16} color={colors.brand} />
          </Pressable>
        }
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.hero}>
        <View style={styles.heroLeft}>
          <Text style={styles.heroKicker}>Health score</Text>
          <Text style={styles.heroScore}>{summary.healthScore ?? 0}</Text>
          <Badge tone={tone}>{(risk || 'low').toString().toUpperCase()} RISK</Badge>
        </View>
        <View style={styles.heroRight}>
          <View style={styles.heroStat}>
            <Text style={styles.heroStatLabel}>Saving rate</Text>
            <Text style={styles.heroStatValue}>{summary.savingsRate ?? 0}%</Text>
          </View>
          <View style={styles.heroStat}>
            <Text style={styles.heroStatLabel}>Runway</Text>
            <Text style={styles.heroStatValue}>{summary.runwayMonths ?? 0} mo</Text>
          </View>
          <View style={styles.heroStat}>
            <Text style={styles.heroStatLabel}>Net worth</Text>
            <Text style={styles.heroStatValue} numberOfLines={1}>
              {formatCurrency(summary.netWorth ?? 0)}
            </Text>
          </View>
        </View>
      </View>

      {checklist.length > 0 ? (
        <View style={styles.warm}>
          <Text style={styles.warmTitle}>Twin warming up</Text>
          {checklist.slice(0, 3).map((c) => (
            <Text key={c} style={styles.warmItem}>
              • {c}
            </Text>
          ))}
        </View>
      ) : null}

      <Text style={styles.section}>Explore</Text>
      <View style={styles.grid}>
        {TOOLS.map((t) => {
          const Icon = t.icon
          return (
            <Pressable
              key={t.href}
              style={({ pressed }) => [styles.tool, pressed && styles.toolPressed]}
              onPress={() => {
                lightTap()
                router.push(t.href as any)
              }}
            >
              <View style={styles.toolIcon}>
                <Icon size={18} color={colors.brand} />
              </View>
              <Text style={styles.toolTitle}>{t.title}</Text>
              <Text style={styles.toolSub}>{t.sub}</Text>
            </Pressable>
          )
        })}
      </View>

      <View style={styles.chatCard}>
        <View style={styles.chatHead}>
          <Text style={styles.chatTitle}>Ask My Money</Text>
          <Text style={styles.chatSub}>Ledger-grounded answers</Text>
        </View>

        <View style={styles.messages}>
          {messages.slice(-8).map((m) => (
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
                </View>
              ) : null}
            </View>
          ))}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          keyboardShouldPersistTaps="always"
          style={styles.suggestRow}
        >
          {SUGGESTIONS.map((s) => (
            <Pressable key={s} style={styles.suggestChip} disabled={busy} onPress={() => ask(s)}>
              <Text style={styles.suggestText}>{s}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <View style={styles.composer}>
          <TextInput
            style={styles.composerInput}
            value={input}
            onChangeText={setInput}
            placeholder="Ask about food, budgets…"
            placeholderTextColor={colors.muted}
            editable={!busy}
            returnKeyType="send"
            blurOnSubmit={false}
            onSubmitEditing={() => ask(input)}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Send"
            hitSlop={10}
            disabled={!canSend}
            onPress={() => ask(input)}
            style={({ pressed }) => [
              styles.sendBtn,
              !canSend && styles.sendBtnDisabled,
              pressed && canSend && styles.sendBtnPressed,
            ]}
          >
            <Send size={18} color="#fff" />
          </Pressable>
        </View>
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  refreshBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brandSoft,
  },
  error: { color: colors.danger, marginBottom: 8, fontSize: 13 },
  hero: {
    flexDirection: 'row',
    gap: 14,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
  heroLeft: { width: 110, gap: 6 },
  heroKicker: { fontSize: 11, fontWeight: '700', color: colors.muted, textTransform: 'uppercase' },
  heroScore: { fontSize: 44, fontWeight: '800', color: colors.ink, letterSpacing: -1.2, lineHeight: 48 },
  heroRight: { flex: 1, gap: 8, justifyContent: 'center' },
  heroStat: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  heroStatLabel: { fontSize: 12, color: colors.muted, fontWeight: '600' },
  heroStatValue: { fontSize: 13, fontWeight: '800', color: colors.ink, flexShrink: 1 },
  warm: {
    backgroundColor: '#fffbeb',
    borderRadius: radius.md,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(217,119,6,0.25)',
  },
  warmTitle: { fontWeight: '700', color: '#92400e', marginBottom: 4, fontSize: 13 },
  warmItem: { color: '#92400e', fontSize: 12, lineHeight: 17 },
  section: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  tool: {
    width: '47%',
    flexGrow: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    minWidth: '45%',
  },
  toolPressed: { opacity: 0.88, borderColor: colors.brand },
  toolIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: colors.brandSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  toolTitle: { fontWeight: '700', color: colors.ink, fontSize: 14 },
  toolSub: { color: colors.muted, fontSize: 12, marginTop: 2 },
  chatCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 8,
  },
  chatHead: { marginBottom: 10 },
  chatTitle: { fontWeight: '800', color: colors.ink, fontSize: 16 },
  chatSub: { color: colors.muted, fontSize: 12, marginTop: 2 },
  messages: { gap: 8, marginBottom: 8 },
  bubble: { padding: 10, borderRadius: radius.md, maxWidth: '92%' },
  bubbleUser: { alignSelf: 'flex-end', backgroundColor: colors.brand },
  bubbleBot: { alignSelf: 'flex-start', backgroundColor: colors.bg },
  bubbleUserText: { color: '#fff', fontSize: 13, lineHeight: 18 },
  bubbleBotText: { color: colors.ink, fontSize: 13, lineHeight: 18 },
  factRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  factPill: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  factText: { fontSize: 11, color: colors.muted, fontWeight: '600' },
  suggestRow: { marginBottom: 8, maxHeight: 40 },
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
  composer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  composerInput: {
    flex: 1,
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.ink,
    backgroundColor: colors.bgElevated,
  },
  sendBtn: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.45 },
  sendBtnPressed: { opacity: 0.88 },
})
