import { useEffect, useMemo, useState } from 'react'
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { router } from 'expo-router'
import { Sparkles, Target } from 'lucide-react-native'
import { aiApi } from '@/api'
import { Screen } from '@/components/layout/Screen'
import { PageHead } from '@/components/ui/PageHead'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { LoadingState } from '@/components/ui/LoadingState'
import { SeriesBarChart } from '@/components/charts/SeriesBarChart'
import { formatCurrency } from '@/utils/format'
import { apiErrorMessage, apiFieldErrors } from '@/utils/apiError'
import { colors, radius } from '@/theme'
import { lightTap } from '@/utils/haptics'

const TEMPLATE_HELP: Record<string, { question: string; how: string }> = {
  buy_car: {
    question: 'Can I afford a car?',
    how: 'Down payment + EMI + running costs vs your cash path.',
  },
  buy_house: {
    question: 'Can I afford a house?',
    how: 'Mortgage EMI with optional rent you stop paying.',
  },
  salary_change: {
    question: 'What if my salary changes?',
    how: 'Swap income and see leftover cash each month.',
  },
  new_loan: {
    question: 'What if I take a new loan?',
    how: 'Add EMI and project the hit to liquid cash.',
  },
  vacation: {
    question: 'What if I spend on a trip?',
    how: 'One-time spend, then normal surplus continues.',
  },
  increase_sip: {
    question: 'What if I invest more?',
    how: 'Extra SIP from free cashflow each month.',
  },
  emergency_push: {
    question: 'What if I save harder?',
    how: 'Park a fixed amount toward your buffer.',
  },
}

function validateSimForm({
  params,
  fields,
  horizon,
}: {
  params: Record<string, string>
  fields?: Array<{ key: string }>
  horizon: string
}) {
  const fieldErrors: Record<string, string> = {}
  const h = Number(horizon)
  if (horizon === '' || !Number.isFinite(h)) {
    fieldErrors.horizonMonths = 'Enter how many months to project'
  } else if (h < 6 || h > 60 || Math.round(h) !== h) {
    fieldErrors.horizonMonths = 'Must be a whole number between 6 and 60'
  }
  for (const f of fields || []) {
    const raw = params[f.key]
    const v = Number(raw)
    if (raw === '' || raw == null || !Number.isFinite(v)) {
      fieldErrors[f.key] = 'Enter a valid number'
    } else if (v < 0) {
      fieldErrors[f.key] = 'Must be zero or greater'
    }
  }
  return fieldErrors
}

function verdict(result: any) {
  const net = result?.comparison?.scenarioMonthlyNet
  const oneTime = result?.comparison?.oneTimeOutflow || 0
  const end = result?.comparison?.scenarioEndLiquid
  const baseEnd = result?.comparison?.baselineEndLiquid
  if (typeof net !== 'number') return { tone: 'neutral' as const, title: 'See the projection' }
  if (net < 0) return { tone: 'danger' as const, title: 'Tight — cashflow goes negative' }
  if (oneTime > 0 && end < baseEnd * 0.5) {
    return { tone: 'warning' as const, title: 'Possible, but it drains your cushion' }
  }
  return { tone: 'success' as const, title: 'Looks workable on paper' }
}

function surplusGoalParams(result: any) {
  const net = Number(result?.comparison?.scenarioMonthlyNet)
  if (!(net > 0)) return null
  const months = Math.min(60, Math.max(6, Number(result.horizonMonths) || 12))
  const target = Math.round(net * months)
  const d = new Date()
  d.setFullYear(d.getFullYear(), d.getMonth() + months, d.getDate())
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return {
    prefill: '1',
    name: 'Save my monthly surplus',
    target: String(target),
    deadline: `${yyyy}-${mm}-${dd}`,
  }
}

export default function AiSimulatorScreen() {
  const [templates, setTemplates] = useState<any[]>([])
  const [templateId, setTemplateId] = useState('buy_car')
  const [params, setParams] = useState<Record<string, string>>({})
  const [horizon, setHorizon] = useState('36')
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [booting, setBooting] = useState(true)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const active = useMemo(
    () => templates.find((t) => t.id === templateId) || null,
    [templates, templateId],
  )
  const help = TEMPLATE_HELP[templateId] || {
    question: active?.label || 'What if…?',
    how: active?.description || '',
  }

  useEffect(() => {
    aiApi
      .simTemplates()
      .then((list) => {
        const arr = Array.isArray(list) ? list : []
        setTemplates(arr)
        if (arr[0]) {
          setTemplateId(arr[0].id)
          const defaults: Record<string, string> = {}
          for (const f of arr[0].fields || []) defaults[f.key] = String(f.default ?? '')
          setParams(defaults)
        }
      })
      .catch((err) => setError(apiErrorMessage(err, 'Failed to load')))
      .finally(() => setBooting(false))
  }, [])

  const selectTemplate = (id: string) => {
    lightTap()
    setTemplateId(id)
    setResult(null)
    setLoading(false)
    setFieldErrors({})
    setError('')
    const t = templates.find((x) => x.id === id)
    const defaults: Record<string, string> = {}
    for (const f of t?.fields || []) defaults[f.key] = String(f.default ?? '')
    setParams(defaults)
  }

  const run = async () => {
    const localErrors = validateSimForm({
      params,
      fields: active?.fields,
      horizon,
    })
    if (Object.keys(localErrors).length) {
      setFieldErrors(localErrors)
      return
    }

    setLoading(true)
    setError('')
    setFieldErrors({})
    setResult(null)
    lightTap()
    try {
      const numeric: Record<string, number> = {}
      for (const [k, v] of Object.entries(params)) numeric[k] = Number(v)
      const res = await aiApi.runSimulation({
        template: templateId,
        params: numeric,
        horizonMonths: Number(horizon),
        save: true,
      })
      setResult(res)
    } catch (err: any) {
      const fe = apiFieldErrors(err)
      setFieldErrors(fe)
      setError(Object.keys(fe).length ? '' : apiErrorMessage(err, 'Simulation failed'))
    } finally {
      setLoading(false)
    }
  }

  const call = verdict(result)
  const cmp = result?.comparison || {}
  const seriesPoints = useMemo(() => {
    const series = result?.series?.scenario || []
    return series.map((p: any) => ({
      value: Number(p.liquid) || 0,
      label: String(p.month),
      caption: `Month ${p.month}: ${formatCurrency(p.liquid)}`,
    }))
  }, [result])

  if (booting) {
    return (
      <Screen>
        <LoadingState label="Loading templates…" />
      </Screen>
    )
  }

  return (
    <Screen keyboardShouldPersistTaps="handled">
      <PageHead
        kicker="Intelligence"
        title="Life Simulator"
        subtitle="Ask a money “what if?” — projection only"
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.warn}>
        <Text style={styles.warnText}>
          Safe sandbox — never creates loans, transactions, or goals by itself.
        </Text>
      </View>

      <Text style={styles.step}>1 · Pick a question</Text>
      <View style={styles.chips}>
        {templates.map((t) => {
          const meta = TEMPLATE_HELP[t.id]
          const activeChip = templateId === t.id
          return (
            <Pressable
              key={t.id}
              style={[styles.chip, activeChip && styles.chipActive]}
              onPress={() => selectTemplate(t.id)}
            >
              <Text style={[styles.chipText, activeChip && styles.chipTextActive]}>
                {meta?.question || t.label}
              </Text>
            </Pressable>
          )
        })}
      </View>

      <Text style={styles.step}>2 · {help.question}</Text>
      <Text style={styles.stepHow}>{help.how}</Text>

      {(active?.fields || []).map((f: any) => (
        <View key={f.key} style={styles.field}>
          <Text style={styles.label}>{f.label}</Text>
          <TextInput
            style={[styles.input, fieldErrors[f.key] ? styles.inputError : null]}
            keyboardType="numeric"
            value={params[f.key] ?? ''}
            onChangeText={(v) => {
              setParams((p) => ({ ...p, [f.key]: v }))
              setFieldErrors((fe) => {
                if (!fe[f.key]) return fe
                const next = { ...fe }
                delete next[f.key]
                return next
              })
            }}
            placeholder="e.g. 80000"
            placeholderTextColor={colors.muted}
          />
          {fieldErrors[f.key] ? <Text style={styles.fieldError}>{fieldErrors[f.key]}</Text> : null}
        </View>
      ))}
      <View style={styles.field}>
        <Text style={styles.label}>How many months to project?</Text>
        <TextInput
          style={[styles.input, fieldErrors.horizonMonths ? styles.inputError : null]}
          keyboardType="numeric"
          value={horizon}
          onChangeText={(v) => {
            setHorizon(v)
            setFieldErrors((fe) => {
              if (!fe.horizonMonths) return fe
              const next = { ...fe }
              delete next.horizonMonths
              return next
            })
          }}
          placeholder="e.g. 36"
          placeholderTextColor={colors.muted}
        />
        {fieldErrors.horizonMonths ? (
          <Text style={styles.fieldError}>{fieldErrors.horizonMonths}</Text>
        ) : (
          <Text style={styles.hint}>Between 6 and 60 months</Text>
        )}
      </View>

      <Button onPress={run} disabled={loading}>
        <Sparkles size={16} color="#fff" />
        {loading ? 'Projecting…' : result ? 'Run again' : 'See what happens'}
      </Button>

      {result ? (
        <View style={styles.result}>
          <Text style={styles.step}>3 · What changes?</Text>
          <View style={styles.resultHead}>
            <Badge
              tone={
                call.tone === 'success'
                  ? 'success'
                  : call.tone === 'danger'
                    ? 'danger'
                    : call.tone === 'warning'
                      ? 'warning'
                      : 'neutral'
              }
            >
              {call.title}
            </Badge>
          </View>
          <Text style={styles.body}>{result.recommendation}</Text>

          <View style={styles.compare}>
            <View style={styles.compareCard}>
              <Text style={styles.compareLabel}>If you do nothing</Text>
              <Text style={styles.compareValue}>{formatCurrency(cmp.baselineMonthlyNet)}/mo</Text>
              <Text style={styles.compareMeta}>Monthly leftover</Text>
              <Text style={styles.compareEnd}>{formatCurrency(cmp.baselineEndLiquid)}</Text>
              <Text style={styles.compareMeta}>After {result.horizonMonths} mo</Text>
            </View>
            <View style={[styles.compareCard, styles.compareScenario]}>
              <Text style={styles.compareLabel}>With this plan</Text>
              <Text style={styles.compareValue}>{formatCurrency(cmp.scenarioMonthlyNet)}/mo</Text>
              <Text style={styles.compareMeta}>Monthly leftover</Text>
              <Text style={styles.compareEnd}>{formatCurrency(cmp.scenarioEndLiquid)}</Text>
              <Text style={styles.compareMeta}>After {result.horizonMonths} mo</Text>
            </View>
          </View>

          <View style={styles.pills}>
            {cmp.oneTimeOutflow > 0 ? (
              <Text style={styles.pill}>Upfront · {formatCurrency(cmp.oneTimeOutflow)}</Text>
            ) : null}
            <Text style={styles.pill}>
              Health {result.health?.baseline} → {result.health?.scenario}
            </Text>
            {cmp.goalDelayMonths > 0 ? (
              <Text style={styles.pill}>Goals may slip ~{cmp.goalDelayMonths} mo</Text>
            ) : null}
          </View>

          <View style={styles.chartCard}>
            <Text style={styles.cardTitle}>Cash over time (this plan)</Text>
            <Text style={styles.cardSub}>Projected liquid balance by month</Text>
            <SeriesBarChart
              key={`${result.template}-${result.horizonMonths}-${result.asOf || ''}-${seriesPoints.length}`}
              points={seriesPoints}
              height={110}
              formatValue={(v) => formatCurrency(v)}
              emptyLabel="No series returned for this run."
              hint="Tap a bar to inspect a month"
            />
            <View style={styles.axis}>
              <Text style={styles.axisText}>Now</Text>
              <Text style={styles.axisText}>{result.horizonMonths} mo</Text>
            </View>
          </View>

          <Button onPress={run} disabled={loading} variant="secondary">
            <Sparkles size={16} color={colors.brand} />
            {loading ? 'Projecting…' : 'Update projection'}
          </Button>

          {surplusGoalParams(result) ? (
            <Button
              variant="secondary"
              onPress={() => {
                lightTap()
                const q = surplusGoalParams(result)!
                router.push({
                  pathname: '/(app)/goals',
                  params: q,
                })
              }}
            >
              <Target size={16} color={colors.brand} /> Turn surplus into a goal
            </Button>
          ) : (
            <Button variant="secondary" onPress={() => router.push('/(app)/ai-goals')}>
              <Target size={16} color={colors.brand} /> Open Goal Planner
            </Button>
          )}
        </View>
      ) : null}
    </Screen>
  )
}

const styles = StyleSheet.create({
  error: { color: colors.danger, marginBottom: 8 },
  warn: {
    backgroundColor: 'rgba(217,119,6,0.12)',
    padding: 12,
    borderRadius: radius.md,
    marginBottom: 14,
  },
  warnText: { color: '#92400e', fontSize: 13, lineHeight: 18 },
  step: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.ink,
    marginBottom: 8,
    marginTop: 4,
  },
  stepHow: { color: colors.muted, fontSize: 13, marginBottom: 12, lineHeight: 18 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: colors.surface,
    maxWidth: '100%',
  },
  chipActive: { borderColor: colors.brand, backgroundColor: colors.brandSoft },
  chipText: { fontSize: 12, fontWeight: '600', color: colors.ink },
  chipTextActive: { color: colors.brand },
  field: { marginBottom: 10 },
  label: { fontSize: 12, color: colors.muted, marginBottom: 4, fontWeight: '600' },
  hint: { fontSize: 11, color: colors.muted, marginTop: 4 },
  fieldError: { fontSize: 12, color: colors.danger, marginTop: 4 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: 12,
    color: colors.ink,
    backgroundColor: colors.surface,
    fontSize: 16,
  },
  inputError: { borderColor: colors.danger },
  result: { marginTop: 18, gap: 10 },
  resultHead: { marginBottom: 4 },
  body: { color: colors.ink, lineHeight: 20, fontSize: 14 },
  compare: { flexDirection: 'row', gap: 10 },
  compareCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  compareScenario: { borderColor: colors.brand, backgroundColor: colors.brandSoft },
  compareLabel: { fontSize: 11, fontWeight: '700', color: colors.muted, marginBottom: 6 },
  compareValue: { fontSize: 16, fontWeight: '800', color: colors.ink },
  compareEnd: { fontSize: 15, fontWeight: '800', color: colors.ink, marginTop: 8 },
  compareMeta: { fontSize: 11, color: colors.muted, marginTop: 2 },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  pill: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.inkSoft,
    backgroundColor: colors.bgElevated,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  chartCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  cardTitle: { fontWeight: '700', color: colors.ink },
  cardSub: { color: colors.muted, fontSize: 12, marginTop: 2, marginBottom: 10 },
  axis: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  axisText: { fontSize: 11, color: colors.muted, fontWeight: '600' },
})
