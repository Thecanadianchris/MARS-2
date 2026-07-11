/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Service:
 * VoiceDiagnosticsService
 *
 * Purpose:
 * Reports Voice Intelligence health to the central diagnostics
 * framework for v0.14.1.1 Voice Response Layer without
 * requiring microphone hardware.
 *
 * Version:
 * v0.14.1.1
 * Date Code:
 * 060726
 * ==========================================================
 */

import VoiceService from './VoiceService'

class VoiceDiagnosticsService {
  evaluate() {
    const status = VoiceService.getStatus()

    return {
      version: 'v0.14.1.1',
      module: 'Voice Response Layer',
      status: status.architectureReady ? 'ready' : 'degraded',
      summary: status.architectureReady
        ? 'Voice activation, wake layer simulation, command routing and deterministic responses are architecture-ready. Live audio remains intentionally deferred.'
        : 'Voice response layer architecture is not ready.',
      capabilities: {
        voiceService: true,
        commandRegistry: Boolean(status.commandRegistry?.ready),
        intentParser: Boolean(status.intentParser?.ready),
        commandRouter: Boolean(status.commandRouter?.ready),
        wakeWordService: Boolean(status.wakeWordService?.ready),
        voiceResponseService: Boolean(status.voiceResponseService?.ready),
        diagnostics: true,
        liveAudio: false,
        wakeWord: true,
        wakeWordSimulated: true,
        speechToText: false,
        textToSpeech: false,
      },
      // Real Web Speech API browser capability (separate from the
      // simulated command-routing flags above). Chat tab uses this
      // directly and live.
      browserSpeechCapability: status.browserSpeechCapability,
      commandRegistry: status.commandRegistry,
      intentParser: status.intentParser,
      commandRouter: status.commandRouter,
      wakeWordService: status.wakeWordService,
      voiceResponseService: status.voiceResponseService,
      deferredFeatures: status.deferredFeatures,
      lastIntent: status.lastIntent,
      lastRoute: status.lastRoute,
      lastResponse: status.lastResponse,
      responseCount: status.responseCount,
      historyCount: status.historyCount,
      capabilityState: status.capabilityState,
      safetyBoundary: status.safetyBoundary,
    }
  }
}

export default new VoiceDiagnosticsService()
