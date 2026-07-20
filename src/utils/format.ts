export const formatCurrency = (amount: number | string | null | undefined, currency = 'INR') =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(Number(amount) || 0)

export const formatDate = (value?: string | null, format = 'DD/MM/YYYY') => {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return String(value)
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = d.getFullYear()
  if (format === 'MM/DD/YYYY') return `${mm}/${dd}/${yyyy}`
  if (format === 'YYYY-MM-DD') return `${yyyy}-${mm}-${dd}`
  return `${dd}/${mm}/${yyyy}`
}

export const initials = (name?: string | null, max = 2) =>
  (name || '')
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .slice(0, max)
    .toUpperCase() || '?'
