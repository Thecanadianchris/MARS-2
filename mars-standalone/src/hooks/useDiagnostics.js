/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Hook:
 * useDiagnostics
 *
 * Purpose:
 * React hook for reading and refreshing the MARS Diagnostics
 * Framework from UI panels without embedding diagnostics logic
 * inside presentation components.
 *
 * Version:
 * v0.13.4
 *
 * Date Code:
 * 040726
 * ==========================================================
 */

import { useCallback, useEffect, useState } from 'react'
import { DiagnosticsManager } from '@/services/diagnostics'

export default function useDiagnostics({ autoRefresh = true, intervalMs = 3000 } = {}) {
  const [snapshot, setSnapshot] = useState(() => DiagnosticsManager.getSnapshot())
  const [lastRefresh, setLastRefresh] = useState(Date.now())

  const refresh = useCallback(() => {
    const nextSnapshot = DiagnosticsManager.runDiagnostics()
    setSnapshot({ ...nextSnapshot })
    setLastRefresh(Date.now())
    return nextSnapshot
  }, [])

  useEffect(() => {
    if (!autoRefresh) {
      return undefined
    }

    const interval = window.setInterval(() => {
      refresh()
    }, intervalMs)

    return () => {
      window.clearInterval(interval)
    }
  }, [autoRefresh, intervalMs, refresh])

  return {
    snapshot,
    lastRefresh,
    refresh,
  }
}
