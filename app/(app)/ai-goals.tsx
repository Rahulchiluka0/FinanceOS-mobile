import { useCallback, useEffect, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { router } from 'expo-router'
import { Check, RefreshCw, X } from 'lucide-react-native'
import { aiApi } from '@/api'
import { Screen } from '@/components/layout/Screen'
import { PageHead } from '@/components/ui/PageHead'
import { Button } from '@/components/ui/Button'
import { LoadingState } from '@/components/ui/LoadingState'
import { formatCurrency } from '@/utils/format'
import { colors, radius } from '@/theme'
import { lightTap } from '@/utils/haptics'

export default function AiGoalsScreen() {
  const [pack, setPack] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState('')
  const [msg, setMsg] = useState('')

  const load = useCallback(async (refresh = false) => {
    try {
      const data = refresh
        ? await aiApi.refreshGoalRecommendations()
        : await aiApi.goalRecommendations()
      setPack(data)
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

  const accept = async (id: string) => {
    setBusyId(id)
    lightTap()
    try {
      const res = await aiApi.acceptGoalRecommendation(id)
      setMsg(res.alreadyAccepted ? 'Already added.' : `Created “${res.goal?.name}”.`)
      await load()
    } catch (err: any) {
      setError(err.message || 'Accept failed')
    } finally {
      setBusyId('')
    }
  }

  const dismiss = async (id: string) => {
    setBusyId(id)
    try {
      await aiApi.dismissGoalRecommendation(id)
      await load()
    } catch (err: any) {
      setError(err.message || 'Dismiss failed')
    } finally {
      setBusyId('')
    }
  }

  if (loading && !pack) {
    return (
      <Screen>
        <LoadingState label="Building ideas…" />
      </Screen>
    )
  }

  return (
    <Screen>
      <PageHead
        kicker="Intelligence"
        title="Goal Planner"
        subtitle={`Safe contribute ~${formatCurrency(pack?.safeContribute || 0)}/mo`}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {msg ? <Text style={styles.ok}>{msg}</Text> : null}
      <Button
        variant="secondary"
        onPress={() => {
          lightTap()
          load(true)
        }}
      >
        <RefreshCw size={16} color={colors.brand} /> Refresh
      </Button>
      {(pack?.recommendations || []).map((r: any) => (
        <View key={r.id} style={styles.card}>
          <Text style={styles.title}>{r.title}</Text>
          <Text style={styles.muted}>{r.rationale}</Text>
          <Text style={styles.meta}>
            {formatCurrency(r.targetAmount)} · {formatCurrency(r.monthly)}/mo · {r.etaMonths} mo
          </Text>
          <View style={styles.row}>
            <Button onPress={() => accept(r.id)} disabled={busyId === r.id}>
              <Check size={14} color="#fff" /> Add
            </Button>
            <Button variant="secondary" onPress={() => dismiss(r.id)} disabled={busyId === r.id}>
              <X size={14} color={colors.brand} /> Dismiss
            </Button>
          </View>
        </View>
      ))}
      {!loading && (pack?.recommendations || []).length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>No ideas right now</Text>
          <Text style={styles.muted}>
            Refresh after more income history, or open Savings Goals to create one yourself.
          </Text>
        </View>
      ) : null}
      <Pressable onPress={() => router.push('/(app)/goals')}>
        <Text style={styles.link}>Open Savings Goals →</Text>
      </Pressable>
    </Screen>
  )
}

const styles = StyleSheet.create({
  error: { color: colors.danger, marginBottom: 8 },
  ok: { color: colors.success || '#16a34a', marginBottom: 8 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 14,
    marginTop: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: { fontWeight: '700', color: colors.ink, marginBottom: 6 },
  muted: { color: colors.muted, fontSize: 13, lineHeight: 18, marginBottom: 6 },
  meta: { fontSize: 12, fontWeight: '600', color: colors.brand, marginBottom: 10 },
  row: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  link: { marginTop: 16, color: colors.brand, fontWeight: '600' },
  empty: {
    marginTop: 16,
    padding: 16,
    borderRadius: radius.lg,
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyTitle: { fontWeight: '700', color: colors.ink, marginBottom: 6 },
})
