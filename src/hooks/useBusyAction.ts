import { useCallback, useRef, useState } from 'react'

/**
 * Shared busy flags for async button presses.
 * - `run()` for single primary actions (save / submit)
 * - `runId(id)` for per-row actions (delete / archive / pay)
 */
export function useBusyAction() {
  const [busy, setBusy] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)
  const locked = useRef(false)

  const run = useCallback(async <T,>(fn: () => Promise<T>): Promise<T | undefined> => {
    if (locked.current) return undefined
    locked.current = true
    setBusy(true)
    try {
      return await fn()
    } finally {
      locked.current = false
      setBusy(false)
    }
  }, [])

  const runId = useCallback(async <T,>(id: string, fn: () => Promise<T>): Promise<T | undefined> => {
    if (locked.current) return undefined
    locked.current = true
    setBusyId(id)
    try {
      return await fn()
    } finally {
      locked.current = false
      setBusyId(null)
    }
  }, [])

  return { busy, busyId, run, runId, isBusy: (id: string) => busyId === id }
}
