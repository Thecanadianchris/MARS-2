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
import {
  MemoryIntelligenceService,
  WorkingMemoryService,
  LongTermMemoryEngine,
  PersonalContextService,
  BehaviourLearningService,
} from '@/services/memory'

export default function useMemoryIntelligence() {
  // v0.15.3: backfill categories for any older 'uncategorised' facts, then read.
  const [snapshot, setSnapshot] = useState(() => {
    LongTermMemoryEngine.categoriseAll()
    return MemoryIntelligenceService.getSnapshot()
  })
  const [working, setWorking] = useState(() => WorkingMemoryService.getSnapshot())
  const [longTerm, setLongTerm] = useState(() => LongTermMemoryEngine.getStatus())
  const [personalContext, setPersonalContext] = useState(() =>
    PersonalContextService.getPreview(MemoryIntelligenceService.getActivePersonId())
  )
  const [behaviourLearning, setBehaviourLearning] = useState(() => BehaviourLearningService.getSnapshot())

  const refresh = useCallback(() => {
    LongTermMemoryEngine.categoriseAll()
    const next = MemoryIntelligenceService.getSnapshot()
    setSnapshot(next)
    setWorking(WorkingMemoryService.getSnapshot())
    setLongTerm(LongTermMemoryEngine.getStatus())
    setPersonalContext(PersonalContextService.getPreview(MemoryIntelligenceService.getActivePersonId()))
    setBehaviourLearning(BehaviourLearningService.getSnapshot())
    return next
  }, [])

  const clearAll = useCallback(() => {
    MemoryIntelligenceService.clearAllPersons()
    return refresh()
  }, [refresh])

  const confirmCandidate = useCallback((id) => {
    BehaviourLearningService.confirmCandidate(id)
    return refresh()
  }, [refresh])

  const rejectCandidate = useCallback((id) => {
    BehaviourLearningService.rejectCandidate(id)
    return refresh()
  }, [refresh])

  return {
    snapshot,
    status: snapshot.status,
    persons: snapshot.persons,
    workingMemory: working,
    longTerm,
    personalContext,
    behaviourLearning,
    refresh,
    clearAll,
    confirmCandidate,
    rejectCandidate,
  }
}
