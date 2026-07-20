import { useEffect, useState, type ReactNode } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { searchApi } from '@/api'
import { useDebounce } from '@/hooks/useDebounce'
import { Screen } from '@/components/layout/Screen'
import { PageHead } from '@/components/ui/PageHead'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { LoadingState } from '@/components/ui/LoadingState'
import { formatCurrency, formatDate } from '@/utils/format'
import { colors, radius } from '@/theme'

const emptyResults = { transactions: [] as any[], accounts: [] as any[], bills: [] as any[], goals: [] as any[] }

export default function SearchScreen() {
  const [q, setQ] = useState('')
  const debounced = useDebounce(q, 250)
  const [results, setResults] = useState(emptyResults)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!debounced.trim()) {
      setResults(emptyResults)
      setError('')
      setLoading(false)
      return
    }
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError('')
      try {
        const data = (await searchApi.query(debounced.trim())) as any
        if (!cancelled) {
          setResults({
            transactions: data?.transactions || [],
            accounts: data?.accounts || [],
            bills: data?.bills || [],
            goals: data?.goals || [],
          })
        }
      } catch (e: any) {
        if (!cancelled) {
          setResults(emptyResults)
          setError(e.message || 'Search failed')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [debounced])

  const total =
    results.transactions.length +
    results.accounts.length +
    results.bills.length +
    results.goals.length

  return (
    <Screen>
      <PageHead
        kicker="Find anything"
        title="Search"
        subtitle={
          !debounced.trim()
            ? 'Search transactions, accounts, bills, and goals.'
            : loading
              ? `Searching for "${debounced}"…`
              : `${total} result${total !== 1 ? 's' : ''} for "${debounced}"`
        }
      />

      <Input
        label="Query"
        placeholder="Search…"
        value={q}
        onChangeText={setQ}
        autoCapitalize="none"
        autoCorrect={false}
      />

      {error ? <Text style={styles.warn}>{error}</Text> : null}
      {loading ? <LoadingState /> : null}

      {!debounced.trim() ? (
        <EmptyState title="Enter a query" subtitle="Try a transaction title, account, or goal name." />
      ) : null}
      {debounced.trim() && !loading && total === 0 && !error ? (
        <EmptyState title={`No matches for "${debounced}"`} />
      ) : null}

      {results.transactions.length ? (
        <Section title="Transactions" count={results.transactions.length}>
          {results.transactions.map((t) => (
            <View key={t.id} style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{t.title}</Text>
                <Text style={styles.meta}>
                  {t.category} · {formatDate(t.date)}
                </Text>
              </View>
              <Text style={[styles.amt, t.type === 'income' ? styles.pos : styles.neg]}>
                {formatCurrency(t.amount)}
              </Text>
            </View>
          ))}
        </Section>
      ) : null}

      {results.accounts.length ? (
        <Section title="Accounts" count={results.accounts.length}>
          {results.accounts.map((a) => (
            <View key={a.id} style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{a.name}</Text>
                <Badge tone="neutral">{String(a.type)}</Badge>
              </View>
              <Text style={styles.amt}>{formatCurrency(a.balance)}</Text>
            </View>
          ))}
        </Section>
      ) : null}

      {results.bills.length ? (
        <Section title="Bills" count={results.bills.length}>
          {results.bills.map((b) => (
            <View key={b.id} style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{b.title}</Text>
                <Badge tone={b.status === 'paid' ? 'success' : 'warning'}>{b.status}</Badge>
              </View>
              <Text style={styles.amt}>{formatCurrency(b.amount)}</Text>
            </View>
          ))}
        </Section>
      ) : null}

      {results.goals.length ? (
        <Section title="Goals" count={results.goals.length}>
          {results.goals.map((g) => (
            <View key={g.id} style={styles.row}>
              <Text style={[styles.name, { flex: 1 }]}>{g.name}</Text>
              <Text style={styles.amt}>
                {formatCurrency(g.current)} / {formatCurrency(g.target)}
              </Text>
            </View>
          ))}
        </Section>
      ) : null}
    </Screen>
  )
}

function Section({
  title,
  count,
  children,
}: {
  title: string
  count: number
  children: ReactNode
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHead}>
        <Text style={styles.h2}>{title}</Text>
        <Badge>{count}</Badge>
      </View>
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  warn: { color: colors.danger, fontWeight: '700', marginVertical: 10 },
  section: {
    marginTop: 14,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    gap: 8,
  },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  h2: { fontSize: 16, fontWeight: '800', color: colors.ink },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  name: { fontWeight: '700', color: colors.ink },
  meta: { color: colors.muted, fontSize: 12 },
  amt: { fontWeight: '800', color: colors.ink },
  pos: { color: colors.success },
  neg: { color: colors.danger },
})
