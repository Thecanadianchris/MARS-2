/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Hook:
 * useVoiceIntelligence
 *
 * Purpose:
 * React hook for the v0.14.1.1 Voice Response Layer UI.
 * Keeps presentation components separate from voice service logic.
 *
 * Version:
 * v0.14.1.1
 * Date Code:
 * 060726
 * ==========================================================
 */

import { useCallback, useState } from 'react'
import { VoiceService } from '@/services/voice'

export default function useVoiceIntelligence() {
  const [snapshot, setSnapshot] = useState(() => VoiceService.getPanelSnapshot())
  const [lastResult, setLastResult] = useState(() => VoiceService.getLastIntent())
  const [lastResponse, setLastResponse] = useState(() => VoiceService.getLastResponse())

  const updateFromService = useCallback((result = VoiceService.getLastIntent()) => {
    const nextSnapshot = VoiceService.getPanelSnapshot()
    setSnapshot(nextSnapshot)
    setLastResult(result)
    setLastResponse(VoiceService.getLastResponse())
    return nextSnapshot
  }, [])

  const refresh = useCallback(() => updateFromService(), [updateFromService])

  const activateVoice = useCallback(() => {
    const result = VoiceService.activate('voice-panel-button')
    updateFromService(result)
    return result
  }, [updateFromService])

  const parseTranscript = useCallback((transcript) => {
    const result = VoiceService.evaluateTranscript(transcript, {
      source: 'voice-panel-manual-transcript',
    })
    updateFromService(result)
    return result
  }, [updateFromService])

  const routeCommand = useCallback((transcript) => {
    const result = VoiceService.routeCommand(transcript, {
      source: 'voice-panel-command-route',
    })
    updateFromService(result)
    return result
  }, [updateFromService])

  const clearHistory = useCallback(() => {
    VoiceService.clearHistory()
    setLastResult(null)
    setLastResponse(null)
    setSnapshot(VoiceService.getPanelSnapshot())
  }, [])

  const resetActivation = useCallback(() => {
    const result = VoiceService.resetActivation({ source: 'voice-panel-sleep-button' })
    updateFromService(result)
    return result
  }, [updateFromService])

  return {
    snapshot,
    lastResult,
    lastResponse,
    refresh,
    activateVoice,
    parseTranscript,
    routeCommand,
    clearHistory,
    resetActivation,
  }
}
