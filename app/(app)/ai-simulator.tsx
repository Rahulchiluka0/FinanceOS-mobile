import { useEffect, useMemo, useState } from 'react'
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { Sparkles } from 'lucide-react-native'
import { aiApi } from '@/api'
import { Screen } from '@/components/layout/Screen'
import { PageHead } from '@/components/ui/PageHead'
import { Button } from '@/components/ui/Button'
import { LoadingState } from '@/components/ui/LoadingState'
import { formatCurrency } from '@/utils/format'
import { apiErrorMessage, apiFieldErrors } from '@/utils/apiError'
import { colors, radius } from '@/theme'
import { lightTap } from '@/utils/haptics'

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
  } else if (!Number.isInteger(h) || h < 6 || h > 60) {
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

  if (booting) {
    return (
      <Screen>
        <LoadingState label="Loading templates…" />
      </Screen>
    )
  }

  return (
    <Screen>
      <PageHead
        kicker="Intelligence"
        title="Life Simulator"
        subtitle="What-if only — never writes the ledger"
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Text style={styles.warn}>Simulation only — nothing is saved to accounts or loans.</Text>
      <View style={styles.chips}>
        {templates.map((t) => (
          <Pressable
            key={t.id}
            style={[styles.chip, templateId === t.id && styles.chipActive]}
            onPress={() => selectTemplate(t.id)}
          >
            <Text style={[styles.chipText, templateId === t.id && styles.chipTextActive]}>
              {t.label}
            </Text>
          </Pressable>
        ))}
      </View>
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
        <Text style={styles.label}>Horizon (months)</Text>
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
        {loading ? 'Running…' : 'Run simulation'}
      </Button>
      {result ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Result</Text>
          <Text style={styles.body}>{result.recommendation}</Text>
          <Text style={styles.meta}>
            Net {formatCurrency(result.comparison?.scenarioMonthlyNet)}/mo · End liquid{' '}
            {formatCurrency(result.comparison?.scenarioEndLiquid)}
          </Text>
          <Text style={styles.meta}>
            Health {result.health?.baseline} → {result.health?.scenario}
          </Text>
        </View>
      ) : null}
    </Screen>
  )
}

const styles = StyleSheet.create({
  error: { color: colors.danger, marginBottom: 8 },
  warn: {
    color: '#92400e',
    backgroundColor: 'rgba(217,119,6,0.12)',
    padding: 10,
    borderRadius: radius.md,
    marginBottom: 12,
    fontSize: 13,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.surface,
  },
  chipActive: { borderColor: colors.brand, backgroundColor: colors.brandSoft || '#e8effc' },
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
  },
  inputError: { borderColor: colors.danger },
  card: {
    marginTop: 14,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTitle: { fontWeight: '700', marginBottom: 8, color: colors.ink },
  body: { color: colors.ink, lineHeight: 20, fontSize: 14, marginBottom: 8 },
  meta: { color: colors.muted, fontSize: 12, marginBottom: 4 },
})
