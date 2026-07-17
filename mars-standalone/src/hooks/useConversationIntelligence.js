/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Hook:
 * useConversationIntelligence
 *
 * Purpose:
 * React hook for the v0.14.2 Natural Conversation Engine
 * diagnostics UI. Keeps presentation components separate from
 * conversation service logic, mirroring useVoiceIntelligence.
 *
 * Version:
 * v0.14.2
 * Date Code:
 * 110726
 * ==========================================================
 */

import { useCallback, useState } from 'react'
import { NaturalConversationEngine } from '@/services/conversation'
import { createSimulationState } from '@/services/capabilityState'

const CAPABILITY_MESSAGE =
  'Text-based conversation simulation. Live audio, persistent memory and cross-capability execution remain future milestones.'

export default function useConversationIntelligence() {
  const [snapshot, setSnapshot] = useState(() => NaturalConversationEngine.getStatus())
  const [lastResult, setLastResult] = useState(null)

  const capabilityState = createSimulationState({
    label: 'Conversation',
    source: 'conversation-panel',
    message: CAPABILITY_MESSAGE
  })

  const refresh = useCallback(() => {
    const nextSnapshot = NaturalConversationEngine.getStatus()
    setSnapshot(nextSnapshot)
    return nextSnapshot
  }, [])

  const sendTurn = useCallback((message) => {
    const result = NaturalConversationEngine.processTurn(message)
    setLastResult(result)
    setSnapshot(NaturalConversationEngine.getStatus())
    return result
  }, [])

  const resetConversation = useCallback(() => {
    NaturalConversationEngine.reset()
    setLastResult(null)
    setSnapshot(NaturalConversationEngine.getStatus())
  }, [])

  return {
    snapshot,
    lastResult,
    capabilityState,
    refresh,
    sendTurn,
    resetConversation,
  }
}
