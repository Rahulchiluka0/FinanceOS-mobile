import { useEffect, useMemo, useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { fxApi } from '@/api'
import { Screen } from '@/components/layout/Screen'
import { PageHead } from '@/components/ui/PageHead'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { SelectField } from '@/components/ui/SelectField'
import { Badge } from '@/components/ui/Badge'
import { LoadingState } from '@/components/ui/LoadingState'
import { colors, radius } from '@/theme'

type Rate = { code: string; name: string; rate: number }

export default function CurrenciesScreen() {
  const [rates, setRates] = useState<Rate[]>([])
  const [amount, setAmount] = useState('1000')
  const [from, setFrom] = useState('INR')
  const [to, setTo] = useState('USD')
  const [converted, setConverted] = useState<{ result?: number; rate?: number } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const data = await fxApi.rates()
        if (!cancelled) setRates(Array.isArray(data) ? data : [])
      } catch (e: any) {
        if (!cancelled) setError(e.message || 'Failed to load rates')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!rates.length) return
    let cancelled = false
    const timer = setTimeout(async () => {
      try {
        const data = await fxApi.convert({
          amount: Number(amount) || 0,
          from,
          to,
        })
        if (!cancelled) {
          setConverted(data as any)
          setError('')
        }
      } catch (e: any) {
        if (!cancelled) setError(e.message || 'Conversion failed')
      }
    }, 200)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [amount, from, to, rates])

  const localPreview = useMemo(() => {
    const fromRate = rates.find((r) => r.code === from)?.rate ?? 1
    const toRate = rates.find((r) => r.code === to)?.rate ?? 1
    const inInr = Number(amount) / fromRate
    return inInr * toRate
  }, [amount, from, to, rates])

  const result = converted?.result ?? localPreview
  const unitRate = converted?.rate ?? (result / (Number(amount) || 1))

  const options = rates.map((r) => ({ label: `${r.code} — ${r.name}`, value: r.code }))

  return (
    <Screen
      refreshing={loading}
      onRefresh={async () => {
        setLoading(true)
        try {
          const data = await fxApi.rates()
          setRates(Array.isArray(data) ? data : [])
          setError('')
        } catch (e: any) {
          setError(e.message || 'Failed to load rates')
        } finally {
          setLoading(false)
        }
      }}
    >
      <PageHead kicker="FX" title="Multi-Currency" subtitle="Exchange rates relative to INR." />
      {error ? <Text style={styles.warn}>{error}</Text> : null}
      {loading && !rates.length ? <LoadingState /> : null}

      <View style={styles.panel}>
        <Text style={styles.h2}>Converter</Text>
        <Input label="Amount" keyboardType="decimal-pad" value={amount} onChangeText={setAmount} />
        <SelectField
          label="From"
          value={from}
          options={options.length ? options : [{ label: from, value: from }]}
          onChange={setFrom}
        />
        <Button
          size="sm"
          variant="secondary"
          onPress={() => {
            setFrom(to)
            setTo(from)
          }}
        >
          Swap
        </Button>
        <SelectField
          label="To"
          value={to}
          options={options.length ? options : [{ label: to, value: to }]}
          onChange={setTo}
        />
        <View style={styles.result}>
          <Text style={styles.resultText}>
            {Number(amount || 0).toLocaleString()} {from} = {Number(result).toFixed(4)} {to}
          </Text>
          <Text style={styles.meta}>
            1 {from} ≈ {Number(unitRate).toFixed(6)} {to}
          </Text>
        </View>
      </View>

      <View style={styles.panel}>
        <Text style={styles.h2}>Exchange rates</Text>
        {rates.map((r) => (
          <View key={r.code} style={styles.rateRow}>
            <Badge tone="info">{r.code}</Badge>
            <Text style={styles.rateName}>{r.name}</Text>
            <Text style={styles.rateVal}>{r.rate}</Text>
          </View>
        ))}
        {!rates.length && !loading ? (
          <Text style={styles.meta}>No rates available.</Text>
        ) : null}
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  warn: { color: colors.danger, fontWeight: '700', marginBottom: 10 },
  panel: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    gap: 10,
    marginBottom: 14,
  },
  h2: { fontSize: 16, fontWeight: '800', color: colors.ink },
  result: {
    backgroundColor: colors.brandSoft,
    borderRadius: radius.md,
    padding: 12,
    gap: 4,
  },
  resultText: { fontWeight: '800', color: colors.ink },
  meta: { color: colors.muted, fontSize: 13 },
  rateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  rateName: { flex: 1, color: colors.inkSoft, fontSize: 13 },
  rateVal: { fontWeight: '700', color: colors.ink, fontVariant: ['tabular-nums'] },
})
