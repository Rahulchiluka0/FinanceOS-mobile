import { useCallback, useEffect, useState } from 'react'
import { StyleSheet, Text, TextInput, View } from 'react-native'
import { RefreshCw } from 'lucide-react-native'
import { aiApi } from '@/api'
import { Screen } from '@/components/layout/Screen'
import { PageHead } from '@/components/ui/PageHead'
import { Button } from '@/components/ui/Button'
import { LoadingState } from '@/components/ui/LoadingState'
import { formatCurrency } from '@/utils/format'
import { colors, radius } from '@/theme'
import { lightTap } from '@/utils/haptics'

function currentPeriod() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export default function AiReplayScreen() {
  const [period, setPeriod] = useState(currentPeriod())
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async (p: string, force = false) => {
    setLoading(true)
    try {
      const res = await aiApi.replay({ period: p, ...(force ? { force: '1' } : {}) })
      setData(res)
      setError('')
    } catch (err: any) {
      setError(err.message || 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load(period)
  }, [load, period])

  if (loading && !data) {
    return (
      <Screen>
        <LoadingState label="Writing replay…" />
      </Screen>
    )
  }

  const stats = data?.stats || {}

  return (
    <Screen>
      <PageHead kicker="Intelligence" title="Money Replay" subtitle={data?.period || period} />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <TextInput
        style={styles.input}
        value={period}
        onChangeText={setPeriod}
        placeholder="YYYY-MM"
        placeholderTextColor={colors.muted}
      />
      <Button
        variant="secondary"
        onPress={() => {
          lightTap()
          load(period, true)
        }}
      >
        <RefreshCw size={16} color={colors.brand} /> Rebuild
      </Button>
      <View style={styles.metrics}>
        <Text style={styles.metric}>In {formatCurrency(stats.income)}</Text>
        <Text style={styles.metric}>Out {formatCurrency(stats.expense)}</Text>
        <Text style={styles.metric}>Net {formatCurrency(stats.net)}</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Story</Text>
        <Text style={styles.body}>{data?.summary}</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Timeline</Text>
        {(data?.timeline || []).map((ev: any, i: number) => (
          <View key={`${ev.type}-${i}`} style={styles.event}>
            <Text style={styles.eventLabel}>{ev.label || ev.title}</Text>
            <Text style={styles.muted}>{ev.date}</Text>
          </View>
        ))}
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  error: { color: colors.danger, marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: 12,
    marginBottom: 10,
    color: colors.ink,
    backgroundColor: colors.surface,
  },
  metrics: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginVertical: 12 },
  metric: { fontWeight: '700', color: colors.ink, fontSize: 13 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTitle: { fontWeight: '700', marginBottom: 8, color: colors.ink },
  body: { color: colors.ink, lineHeight: 20, fontSize: 14 },
  event: { marginBottom: 10 },
  eventLabel: { fontWeight: '600', color: colors.ink, fontSize: 13 },
  muted: { color: colors.muted, fontSize: 12, marginTop: 2 },
})
