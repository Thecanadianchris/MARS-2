/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Service:
 * VoiceDiagnosticsService
 *
 * Purpose:
 * Reports Voice Intelligence Foundation health to the central
 * diagnostics framework without requiring microphone hardware.
 *
 * Version:
 * v0.14.0
 * Date Code:
 * 060726
 * ==========================================================
 */

import VoiceService from './VoiceService'

class VoiceDiagnosticsService {
  evaluate() {
    const status = VoiceService.getStatus()

    return {
      version: 'v0.14.0',
      module: 'Voice Intelligence Foundation',
      status: status.architectureReady ? 'ready' : 'degraded',
      summary: status.architectureReady
        ? 'Voice Foundation is architecture-ready. Live audio remains intentionally deferred.'
        : 'Voice Foundation architecture is not ready.',
      capabilities: {
        voiceService: true,
        commandRegistry: Boolean(status.commandRegistry?.ready),
        intentParser: Boolean(status.intentParser?.ready),
        diagnostics: true,
        liveAudio: false,
        wakeWord: false,
        speechToText: false,
        textToSpeech: false,
      },
      commandRegistry: status.commandRegistry,
      intentParser: status.intentParser,
      deferredFeatures: status.deferredFeatures,
      lastIntent: status.lastIntent,
      historyCount: status.historyCount,
      capabilityState: status.capabilityState,
      safetyBoundary: status.safetyBoundary,
    }
  }
}

export default new VoiceDiagnosticsService()
