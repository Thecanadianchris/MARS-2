/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Service:
 * VoiceService
 *
 * Purpose:
 * Provides the public Voice Intelligence interface for v0.14.1.1
 * Voice Response Layer. This service accepts transcript text and
 * simulated UI activation only, then returns deterministic visible
 * responses for routed commands. Live microphone capture, speech-to-text
 * and text-to-speech remain later milestones.
 *
 * Version:
 * v0.14.1.1
 * Date Code:
 * 060726
 * ==========================================================
 */

import { createWaitingState } from '@/services/capabilityState'
import VoiceCommandRegistry from './VoiceCommandRegistry'
import VoiceIntentParser from './VoiceIntentParser'
import VoiceCommandRouter from './VoiceCommandRouter'
import WakeWordService from './WakeWordService'
import VoiceResponseService from './VoiceResponseService'

export const VOICE_FOUNDATION_FEATURES = Object.freeze([
  'voice-service-interface',
  'voice-command-registry',
  'voice-intent-parser',
  'voice-diagnostics-service',
  'voice-panel-ui',
])

export const VOICE_ACTIVATION_FEATURES = Object.freeze([
  'simulated-wake-word-service',
  'voice-activation-state',
  'voice-command-router',
  'command-routing-history',
  'routing-diagnostics',
  'deterministic-voice-response-layer',
])

export const VOICE_DEFERRED_FEATURES = Object.freeze([
  'microphone-capture',
  'speech-to-text',
  'text-to-speech',
  'android-audio-pipeline',
  'natural-conversation-engine',
  'live-wake-word-audio-detection',
])

class VoiceService {
  constructor() {
    this.lastIntent = null
    this.lastRoute = null
    this.lastResponse = null
    this.history = []
    this.maxHistory = 20
  }

  activate(source = 'voice-panel-button', options = {}) {
    const timestamp = options.timestamp || Date.now()
    const wakeStatus = WakeWordService.activate(source, {
      ...options,
      timestamp,
    })

    const result = {
      status: 'activated',
      intent: 'WAKE_MARS',
      command: VoiceCommandRegistry.getCommandById('wake-mars'),
      confidence: 1,
      transcript: 'wake mars',
      normalisedTranscript: 'wake mars',
      source,
      timestamp,
      wakeStatus,
      summary: 'Wake button pressed. MARS is listening for a routed command.',
    }
    const route = VoiceCommandRouter.routeIntent(result, { timestamp })

    return this.recordResult(result, route)
  }

  evaluateWakePhrase(transcript, options = {}) {
    return WakeWordService.evaluate(transcript, options)
  }

  evaluateTranscript(transcript, options = {}) {
    const timestamp = options.timestamp || Date.now()
    const wakeEvaluation = WakeWordService.evaluate(transcript, {
      ...options,
      timestamp,
      source: options.source || 'manual-transcript',
    })

    if (wakeEvaluation.activated && !options.routeWakeCommand) {
      const result = {
        status: 'activated',
        intent: 'WAKE_MARS',
        command: VoiceCommandRegistry.getCommandById('wake-mars'),
        confidence: 1,
        transcript,
        normalisedTranscript: wakeEvaluation.phrase,
        source: options.source || 'manual-transcript',
        timestamp,
        summary: 'Wake phrase detected. MARS is listening for a command.',
      }
      const route = VoiceCommandRouter.routeIntent(result, { timestamp })
      return this.recordResult(result, route)
    }

    const intentResult = VoiceIntentParser.parseTranscript(transcript, {
      ...options,
      timestamp,
      source: options.source || 'manual-transcript',
    })
    const routeResult = VoiceCommandRouter.routeIntent(intentResult, { timestamp })

    if (intentResult.intent === 'CANCEL_COMMAND') {
      WakeWordService.sleep()
    }

    return this.recordResult(intentResult, routeResult)
  }

  routeCommand(transcript, options = {}) {
    const timestamp = options.timestamp || Date.now()

    if (!WakeWordService.isListening(timestamp) && !options.allowWithoutWake) {
      const result = {
        status: 'waiting-for-wake-word',
        intent: null,
        command: null,
        confidence: 0,
        transcript,
        normalisedTranscript: '',
        source: options.source || 'manual-command-route',
        timestamp,
        summary: 'Voice command ignored because MARS has not been activated by the wake layer.',
      }
      const route = VoiceCommandRouter.routeIntent(result, { timestamp })
      return this.recordResult(result, route)
    }

    return this.evaluateTranscript(transcript, {
      ...options,
      timestamp,
      source: options.source || 'manual-command-route',
    })
  }

  recordResult(intentResult, routeResult) {
    const response = VoiceResponseService.generate(intentResult, routeResult, {
      timestamp: intentResult?.timestamp || routeResult?.timestamp || Date.now(),
      commandRegistry: VoiceCommandRegistry.getStatus(),
      intentParser: VoiceIntentParser.getStatus(),
      commandRouter: VoiceCommandRouter.getStatus(),
      wakeWordStatus: WakeWordService.getStatus(),
    })

    const result = {
      ...intentResult,
      route: routeResult,
      response,
      service: 'VoiceService',
      version: 'v0.14.1.1',
      milestone: 'Voice Response Layer',
      capabilityState: createWaitingState(
        'Voice activation, command routing and deterministic response feedback are ready. Live audio remains intentionally deferred.',
        'voice-response-layer'
      ),
      liveAudio: false,
      medicalDiagnosis: false,
    }

    this.lastIntent = result
    this.lastRoute = routeResult
    this.lastResponse = response
    this.history = [result, ...this.history].slice(0, this.maxHistory)

    return result
  }

  getLastIntent() {
    return this.lastIntent
  }

  getLastRoute() {
    return this.lastRoute
  }

  getLastResponse() {
    return this.lastResponse
  }

  getHistory() {
    return [...this.history]
  }

  clearHistory() {
    this.lastIntent = null
    this.lastRoute = null
    this.lastResponse = null
    this.history = []
    VoiceCommandRouter.clearHistory()
    VoiceResponseService.clearHistory()
  }

  resetActivation(options = {}) {
    const timestamp = options.timestamp || Date.now()
    WakeWordService.reset()

    const result = {
      status: 'sleeping',
      intent: 'SLEEP_VOICE_ROUTING',
      command: null,
      confidence: 1,
      transcript: 'sleep',
      normalisedTranscript: 'sleep',
      source: options.source || 'voice-panel-sleep-button',
      timestamp,
      summary: 'Voice activation layer returned to sleeping state.',
    }
    const route = VoiceCommandRouter.recordRoute({
      status: 'waiting',
      intent: result.intent,
      target: 'voice',
      action: 'sleep-voice-routing',
      command: null,
      timestamp,
      summary: result.summary,
    })

    return this.recordResult(result, route)
  }

  getStatus() {
    const registryStatus = VoiceCommandRegistry.getStatus()
    const parserStatus = VoiceIntentParser.getStatus()
    const routerStatus = VoiceCommandRouter.getStatus()
    const wakeWordStatus = WakeWordService.getStatus()

    return {
      version: 'v0.14.1.1',
      milestone: 'Voice Response Layer',
      status: 'ready',
      architectureReady: true,
      liveAudioEnabled: false,
      wakeWordEnabled: true,
      wakeWordSimulated: true,
      speechToTextEnabled: false,
      textToSpeechEnabled: false,
      naturalConversationEnabled: false,
      responseLayerEnabled: true,
      voiceResponseService: VoiceResponseService.getStatus(),
      commandRegistry: registryStatus,
      intentParser: parserStatus,
      commandRouter: routerStatus,
      wakeWordService: wakeWordStatus,
      implementedFeatures: [...VOICE_FOUNDATION_FEATURES, ...VOICE_ACTIVATION_FEATURES],
      deferredFeatures: [...VOICE_DEFERRED_FEATURES],
      lastIntent: this.lastIntent,
      lastRoute: this.lastRoute,
      lastResponse: this.lastResponse,
      historyCount: this.history.length,
      responseCount: VoiceResponseService.getStatus().responseCount,
      safetyBoundary: 'Voice Intelligence activates, routes commands and returns deterministic responses only. It does not diagnose medical conditions.',
      capabilityState: createWaitingState(
        'Voice command routing and deterministic response feedback are architecture-ready. Live microphone audio is intentionally deferred.',
        'voice-response-layer'
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
      summary: 'Wake Word & Command Routing is ready with simulated activation, command parsing, route diagnostics and visible deterministic responses.',
      implementedFeatures: status.implementedFeatures,
      deferredFeatures: status.deferredFeatures,
      commands: VoiceCommandRegistry.listCommands(),
      commandRegistry: status.commandRegistry,
      intentParser: status.intentParser,
      commandRouter: status.commandRouter,
      wakeWordService: status.wakeWordService,
      voiceResponseService: status.voiceResponseService,
      lastIntent: status.lastIntent,
      lastRoute: status.lastRoute,
      lastResponse: status.lastResponse,
      responseCount: status.responseCount,
      capabilityState: status.capabilityState,
      safetyBoundary: status.safetyBoundary,
    }
  }
}

export default new VoiceService()
