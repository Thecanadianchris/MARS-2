/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Hook:
 * useVoiceIntelligence
 *
 * Purpose:
 * React hook for the v0.14.0 Voice Intelligence Foundation UI.
 * Keeps presentation components separate from voice service logic.
 *
 * Version:
 * v0.14.0
 * Date Code:
 * 060726
 * ==========================================================
 */

import { useCallback, useState } from 'react'
import { VoiceService } from '@/services/voice'

export default function useVoiceIntelligence() {
  const [snapshot, setSnapshot] = useState(() => VoiceService.getPanelSnapshot())
  const [lastResult, setLastResult] = useState(() => VoiceService.getLastIntent())

  const refresh = useCallback(() => {
    const nextSnapshot = VoiceService.getPanelSnapshot()
    setSnapshot(nextSnapshot)
    setLastResult(VoiceService.getLastIntent())
    return nextSnapshot
  }, [])

  const parseTranscript = useCallback((transcript) => {
    const result = VoiceService.evaluateTranscript(transcript, {
      source: 'voice-panel-manual-transcript',
    })
    setLastResult(result)
    setSnapshot(VoiceService.getPanelSnapshot())
    return result
  }, [])

  const clearHistory = useCallback(() => {
    VoiceService.clearHistory()
    setLastResult(null)
    setSnapshot(VoiceService.getPanelSnapshot())
  }, [])

  return {
    snapshot,
    lastResult,
    refresh,
    parseTranscript,
    clearHistory,
  }
}
