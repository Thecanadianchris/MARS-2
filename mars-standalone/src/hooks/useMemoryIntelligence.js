/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Hook:
 * useMemoryIntelligence
 *
 * Purpose:
 * React hook for the v0.15 Memory Intelligence panel. Keeps
 * presentation separate from the MemoryIntelligenceService, the
 * same way useVoiceIntelligence wraps VoiceService.
 *
 * Version:
 * v0.15
 * Date Code:
 * 120726
 * ==========================================================
 */

import { useCallback, useState } from 'react'
import { MemoryIntelligenceService, WorkingMemoryService } from '@/services/memory'

export default function useMemoryIntelligence() {
  const [snapshot, setSnapshot] = useState(() => MemoryIntelligenceService.getSnapshot())
  const [working, setWorking] = useState(() => WorkingMemoryService.getSnapshot())

  const refresh = useCallback(() => {
    const next = MemoryIntelligenceService.getSnapshot()
    setSnapshot(next)
    setWorking(WorkingMemoryService.getSnapshot())
    return next
  }, [])

  const clearAll = useCallback(() => {
    MemoryIntelligenceService.clearAllPersons()
    return refresh()
  }, [refresh])

  return {
    snapshot,
    status: snapshot.status,
    persons: snapshot.persons,
    workingMemory: working,
    refresh,
    clearAll,
  }
}
