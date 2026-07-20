import { useCallback, useEffect, useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { router } from 'expo-router'
import { aiApi } from '@/api'
import { Screen } from '@/components/layout/Screen'
import { PageHead } from '@/components/ui/PageHead'
import { MetricTile } from '@/components/ui/MetricTile'
import { Button } from '@/components/ui/Button'
import { LoadingState } from '@/components/ui/LoadingState'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { colors, radius } from '@/theme'

const FACTOR_LABELS: Record<string, string> = {
  savingsRate: 'Savings rate',
  emergencyFund: 'Emergency fund',
  debtBurden: 'Debt burden',
  investmentRatio: 'Investment ratio',
  budgetDiscipline: 'Budget discipline',
  cashflowStability: 'Cashflow stability',
  goalProgress: 'Goal progress',
  incomeStability: 'Income stability',
}

export default function AiHealthScreen() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    try {
      const res = await aiApi.healthScore()
      setData(res)
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

  if (loading && !data) {
    return (
      <Screen>
        <LoadingState label="Scoring…" />
      </Screen>
    )
  }

  const entries = Object.entries(data?.factors || {}) as [string, any][]

  return (
    <Screen>
      <PageHead
        kicker="Intelligence"
        title="Financial Health"
        subtitle={`Risk: ${(data?.risk?.level || '—').toUpperCase()}`}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.metrics}>
        <MetricTile label="Overall" value={`${data?.overall ?? 0}/100`} />
        <MetricTile label="History" value={String((data?.history || []).length)} />
      </View>

      <Button variant="secondary" onPress={() => router.push('/(app)/ai-cfo')}>
        Personal CFO
      </Button>

      {entries.map(([key, f]) => (
        <View key={key} style={styles.card}>
          <Text style={styles.title}>{FACTOR_LABELS[key] || key}</Text>
          <Text style={styles.meta}>
            Weight {Math.round((f.weight || 0) * 100)}% · Score {f.score}/100
          </Text>
          <ProgressBar value={f.score} max={100} warnOnOver={false} />
          <Text style={styles.why}>{f.why}</Text>
          {f.cta?.label ? <Text style={styles.cta}>{f.cta.label}</Text> : null}
        </View>
      ))}
    </Screen>
  )
}

const styles = StyleSheet.create({
  error: { color: colors.danger, marginBottom: 8 },
  metrics: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 14,
    marginTop: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: { fontWeight: '700', color: colors.ink },
  meta: { color: colors.muted, fontSize: 12, marginVertical: 6 },
  why: { color: colors.ink, fontSize: 13, marginTop: 8, lineHeight: 18 },
  cta: { color: colors.brand, fontSize: 13, marginTop: 6, fontWeight: '600' },
})
