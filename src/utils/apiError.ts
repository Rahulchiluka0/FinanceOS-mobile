/** Human-readable message from ApiError (includes Zod details when present). */
export function apiErrorMessage(err: unknown, fallback = 'Request failed'): string {
  if (!err || typeof err !== 'object') return fallback
  const e = err as { message?: string; details?: Array<{ path?: string; message?: string }> }
  const details = e.details
  if (Array.isArray(details) && details.length > 0) {
    return details
      .map((d) => {
        const path = d?.path ? String(d.path) : ''
        const msg = d?.message || 'Invalid'
        return path ? `${labelForPath(path)}: ${friendlyZodMessage(msg)}` : friendlyZodMessage(msg)
      })
      .join(' · ')
  }
  return e.message || fallback
}

/** Map ApiError.details → { [path]: message } for field-level UI. */
export function apiFieldErrors(err: unknown): Record<string, string> {
  const out: Record<string, string> = {}
  if (!err || typeof err !== 'object') return out
  const details = (err as { details?: Array<{ path?: string; message?: string }> }).details
  if (!Array.isArray(details)) return out
  for (const d of details) {
    if (!d?.path) continue
    out[d.path] = friendlyZodMessage(d.message || 'Invalid')
  }
  return out
}

function labelForPath(path: string): string {
  const labels: Record<string, string> = {
    horizonMonths: 'Projection months',
    template: 'Scenario',
    message: 'Message',
  }
  return labels[path] || path
}

function friendlyZodMessage(msg: string): string {
  const m = String(msg || '')
  const min = m.match(/>=?\s*(\d+)/)
  const max = m.match(/<=?\s*(\d+)/)
  if (/too small/i.test(m) && min) return `Must be at least ${min[1]}`
  if (/too big/i.test(m) && max) return `Must be at most ${max[1]}`
  if (/expected number/i.test(m)) return 'Enter a valid number'
  return m
}
