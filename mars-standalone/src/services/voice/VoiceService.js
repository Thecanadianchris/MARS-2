/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Service:
 * VoiceService
 *
 * Purpose:
 * Provides the public Voice Intelligence Foundation interface
 * for v0.14.0. This service intentionally accepts transcript
 * text only. Live microphone capture, wake word detection,
 * speech-to-text and text-to-speech are later milestones.
 *
 * Version:
 * v0.14.0
 * Date Code:
 * 060726
 * ==========================================================
 */

import { createWaitingState } from '@/services/capabilityState'
import VoiceCommandRegistry from './VoiceCommandRegistry'
import VoiceIntentParser from './VoiceIntentParser'

export const VOICE_FOUNDATION_FEATURES = Object.freeze([
  'voice-service-interface',
  'voice-command-registry',
  'voice-intent-parser',
  'voice-diagnostics-service',
  'voice-panel-ui',
])

export const VOICE_DEFERRED_FEATURES = Object.freeze([
  'wake-word-detection',
  'microphone-capture',
  'speech-to-text',
  'text-to-speech',
  'android-audio-pipeline',
  'natural-conversation-engine',
])

class VoiceService {
  constructor() {
    this.lastIntent = null
    this.history = []
    this.maxHistory = 20
  }

  evaluateTranscript(transcript, options = {}) {
    const result = VoiceIntentParser.parseTranscript(transcript, options)

    this.lastIntent = result
    this.history = [result, ...this.history].slice(0, this.maxHistory)

    return {
      ...result,
      service: 'VoiceService',
      version: 'v0.14.0',
      capabilityState: createWaitingState(
        'Voice architecture is ready and waiting for future live audio wiring.',
        'voice-foundation'
      ),
      liveAudio: false,
      medicalDiagnosis: false,
    }
  }

  getLastIntent() {
    return this.lastIntent
  }

  getHistory() {
    return [...this.history]
  }

  clearHistory() {
    this.lastIntent = null
    this.history = []
  }

  getStatus() {
    const registryStatus = VoiceCommandRegistry.getStatus()
    const parserStatus = VoiceIntentParser.getStatus()

    return {
      version: 'v0.14.0',
      milestone: 'Voice Intelligence Foundation',
      status: 'ready',
      architectureReady: true,
      liveAudioEnabled: false,
      wakeWordEnabled: false,
      speechToTextEnabled: false,
      textToSpeechEnabled: false,
      naturalConversationEnabled: false,
      commandRegistry: registryStatus,
      intentParser: parserStatus,
      implementedFeatures: [...VOICE_FOUNDATION_FEATURES],
      deferredFeatures: [...VOICE_DEFERRED_FEATURES],
      lastIntent: this.lastIntent,
      historyCount: this.history.length,
      safetyBoundary: 'Voice Intelligence routes commands only and does not diagnose medical conditions.',
      capabilityState: createWaitingState(
        'Voice Foundation is architecture-ready. Live audio is intentionally deferred.',
        'voice-foundation'
      ),
    }
  }

  getPanelSnapshot() {
    const status = this.getStatus()

    return {
      panel: 'VoicePanel',
      version: status.version,
      status: status.status,
      milestone: status.milestone,
      summary: 'Voice Intelligence Foundation is ready for command registry, intent parsing and diagnostics without live audio.',
      implementedFeatures: status.implementedFeatures,
      deferredFeatures: status.deferredFeatures,
      commands: VoiceCommandRegistry.listCommands(),
      commandRegistry: status.commandRegistry,
      intentParser: status.intentParser,
      capabilityState: status.capabilityState,
      safetyBoundary: status.safetyBoundary,
    }
  }
}

export default new VoiceService()
