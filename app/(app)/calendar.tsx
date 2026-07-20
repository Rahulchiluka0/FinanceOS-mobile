import { useEffect, useMemo, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { calendarApi } from '@/api'
import { Screen } from '@/components/layout/Screen'
import { PageHead } from '@/components/ui/PageHead'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { LoadingState } from '@/components/ui/LoadingState'
import { formatCurrency } from '@/utils/format'
import { colors, radius } from '@/theme'

const DOW = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

type DayEvents = {
  tx: any[]
  bills: any[]
  recurring: any[]
}

function buildMonth(year: number, month: number) {
  const first = new Date(year, month, 1)
  const last = new Date(year, month + 1, 0)
  const startPad = first.getDay()
  const days: (number | null)[] = []
  for (let i = 0; i < startPad; i++) days.push(null)
  for (let d = 1; d <= last.getDate(); d++) days.push(d)
  while (days.length % 7 !== 0) days.push(null)
  return days
}

function normalizeDays(raw: Record<string, any> | null | undefined) {
  const map: Record<string, DayEvents> = {}
  Object.entries(raw || {}).forEach(([date, day]) => {
    map[date] = {
      tx: day.transactions || day.tx || [],
      bills: day.bills || [],
      recurring: day.recurring || [],
    }
  })
  return map
}

export default function CalendarScreen() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [selected, setSelected] = useState(now.getDate())
  const [eventsByDay, setEventsByDay] = useState<Record<string, DayEvents>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<'all' | 'tx' | 'bills' | 'recurring'>('all')

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await calendarApi.get(year, month + 1)
      setEventsByDay(normalizeDays(data as any))
    } catch (e: any) {
      setEventsByDay({})
      setError(e.message || 'Failed to load calendar')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, month])

  useEffect(() => {
    setFilter('all')
  }, [selected, year, month])

  const days = buildMonth(year, month)
  const dateKey = (d: number) =>
    `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
  const selectedKey = dateKey(selected)
  const dayEvents = eventsByDay[selectedKey] || { tx: [], bills: [], recurring: [] }
  const counts = {
    tx: dayEvents.tx.length,
    bills: dayEvents.bills.length,
    recurring: dayEvents.recurring.length,
  }
  const dayCount = counts.tx + counts.bills + counts.recurring
  const today =
    now.getFullYear() === year && now.getMonth() === month ? now.getDate() : null

  const showTx = filter === 'all' || filter === 'tx'
  const showBills = filter === 'all' || filter === 'bills'
  const showRec = filter === 'all' || filter === 'recurring'
  const visibleCount =
    (showTx ? counts.tx : 0) + (showBills ? counts.bills : 0) + (showRec ? counts.recurring : 0)

  const selectedLabel = useMemo(
    () =>
      new Date(year, month, selected).toLocaleDateString('en-IN', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }),
    [year, month, selected],
  )

  const prevMonth = () => {
    if (month === 0) {
      setYear((y) => y - 1)
      setMonth(11)
    } else setMonth((m) => m - 1)
    setSelected(1)
  }
  const nextMonth = () => {
    if (month === 11) {
      setYear((y) => y + 1)
      setMonth(0)
    } else setMonth((m) => m + 1)
    setSelected(1)
  }

  return (
    <Screen refreshing={loading} onRefresh={load}>
      <PageHead
        kicker="Schedule"
        title="Calendar"
        subtitle="Transactions, bills, and recurring by day."
      />
      {error ? <Text style={styles.warn}>{error}</Text> : null}

      <View style={styles.toolbar}>
        <Text style={styles.monthTitle}>
          {MONTH_NAMES[month]} {year}
        </Text>
        <View style={styles.nav}>
          <Button size="sm" variant="ghost" onPress={prevMonth}>
            Prev
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onPress={() => {
              setYear(now.getFullYear())
              setMonth(now.getMonth())
              setSelected(now.getDate())
            }}
          >
            Today
          </Button>
          <Button size="sm" variant="ghost" onPress={nextMonth}>
            Next
          </Button>
        </View>
      </View>

      {loading && !Object.keys(eventsByDay).length ? <LoadingState /> : null}

      <View style={styles.grid}>
        {DOW.map((d, i) => (
          <Text key={`${d}-${i}`} style={styles.dow}>
            {d}
          </Text>
        ))}
        {days.map((d, i) => {
          if (!d) return <View key={`pad-${i}`} style={styles.dayEmpty} />
          const key = dateKey(d)
          const ev = eventsByDay[key]
          const count = ev ? ev.tx.length + ev.bills.length + ev.recurring.length : 0
          const selectedDay = selected === d
          const isToday = today === d
          return (
            <Pressable
              key={d}
              onPress={() => setSelected(d)}
              style={[
                styles.day,
                isToday && styles.dayToday,
                selectedDay && styles.daySelected,
                count > 0 && styles.dayHasEvents,
              ]}
            >
              <Text style={[styles.dayNum, selectedDay && styles.dayNumSelected]}>{d}</Text>
              {count > 0 ? <Text style={styles.dayCount}>{count}</Text> : null}
            </Pressable>
          )
        })}
      </View>

      <View style={styles.agenda}>
        <Text style={styles.agendaTitle}>{selectedLabel}</Text>
        <Text style={styles.meta}>{dayCount ? `${dayCount} items` : 'Nothing on this day'}</Text>

        {dayCount > 0 ? (
          <View style={styles.filters}>
            {(
              [
                { id: 'all', label: 'All', n: dayCount },
                { id: 'tx', label: 'Tx', n: counts.tx },
                { id: 'bills', label: 'Bills', n: counts.bills },
                { id: 'recurring', label: 'Recurring', n: counts.recurring },
              ] as const
            ).map((f) => (
              <Pressable
                key={f.id}
                onPress={() => setFilter(f.id)}
                disabled={f.id !== 'all' && f.n === 0}
                style={[styles.chip, filter === f.id && styles.chipActive, f.n === 0 && f.id !== 'all' && { opacity: 0.4 }]}
              >
                <Text style={[styles.chipText, filter === f.id && styles.chipTextActive]}>
                  {f.label} ({f.n})
                </Text>
              </Pressable>
            ))}
          </View>
        ) : null}

        {!dayCount ? <EmptyState title="Quiet day" subtitle="Pick a day with a count badge." /> : null}
        {dayCount > 0 && visibleCount === 0 ? (
          <EmptyState title="No items in this filter" />
        ) : null}

        {showTx &&
          dayEvents.tx.map((t) => (
            <View key={`tx-${t.id}`} style={styles.item}>
              <Badge tone="info">Tx</Badge>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{t.title}</Text>
                <Text style={styles.meta}>{[t.category, t.account].filter(Boolean).join(' · ') || t.type}</Text>
              </View>
              <Text style={[styles.amt, t.type === 'income' ? styles.pos : t.type === 'expense' ? styles.neg : null]}>
                {t.type === 'income' ? '+' : t.type === 'expense' ? '−' : ''}
                {formatCurrency(t.amount)}
              </Text>
            </View>
          ))}
        {showBills &&
          dayEvents.bills.map((b) => (
            <View key={`bill-${b.id}`} style={styles.item}>
              <Badge tone="warning">Bill</Badge>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{b.title}</Text>
                <Text style={styles.meta}>{[b.category, b.status].filter(Boolean).join(' · ')}</Text>
              </View>
              <Text style={styles.amt}>{formatCurrency(b.amount)}</Text>
            </View>
          ))}
        {showRec &&
          dayEvents.recurring.map((r) => (
            <View key={`rec-${r.id}`} style={styles.item}>
              <Badge tone="neutral">Rec</Badge>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{r.title}</Text>
                <Text style={styles.meta}>{[r.frequency, r.type].filter(Boolean).join(' · ')}</Text>
              </View>
              <Text style={[styles.amt, r.type === 'income' ? styles.pos : styles.neg]}>
                {r.type === 'income' ? '+' : '−'}
                {formatCurrency(r.amount)}
              </Text>
            </View>
          ))}
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  warn: { color: colors.danger, fontWeight: '700', marginBottom: 10 },
  toolbar: { marginBottom: 12, gap: 8 },
  monthTitle: { fontSize: 20, fontWeight: '800', color: colors.ink },
  nav: { flexDirection: 'row', gap: 8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16 },
  dow: {
    width: `${100 / 7}%`,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '700',
    color: colors.muted,
    marginBottom: 6,
  },
  dayEmpty: { width: `${100 / 7}%`, aspectRatio: 1 },
  day: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
  },
  dayToday: { backgroundColor: colors.brandSoft },
  daySelected: { backgroundColor: colors.brand },
  dayHasEvents: {},
  dayNum: { fontWeight: '700', color: colors.ink },
  dayNumSelected: { color: '#fff' },
  dayCount: { fontSize: 10, color: colors.accent, fontWeight: '800' },
  agenda: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    gap: 10,
  },
  agendaTitle: { fontWeight: '800', color: colors.ink, fontSize: 16 },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.brandSoft, borderColor: colors.brand },
  chipText: { fontSize: 12, fontWeight: '600', color: colors.muted },
  chipTextActive: { color: colors.brand },
  item: {
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
