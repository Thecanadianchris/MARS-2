/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Service:
 * VoiceResponseService
 *
 * Purpose:
 * Generates deterministic UI-visible responses for routed voice
 * commands in v0.14.1.1. This completes the simulated voice
 * feedback loop without introducing natural conversation, STT,
 * TTS, live microphones or Android audio.
 *
 * Version:
 * v0.14.1.1
 * Date Code:
 * 060726
 * ==========================================================
 */

import VoiceCommandRegistry from './VoiceCommandRegistry'

export const VOICE_RESPONSE_STATUS = Object.freeze({
  READY: 'ready',
  GENERATED: 'generated',
  WAITING: 'waiting',
  UNKNOWN: 'unknown',
  BLOCKED: 'blocked',
  CANCELLED: 'cancelled',
})

function createResponse({
  status = VOICE_RESPONSE_STATUS.GENERATED,
  intent = null,
  route = null,
  title,
  summary,
  lines = [],
  timestamp = Date.now(),
}) {
  return {
    version: 'v0.14.1.1',
    service: 'VoiceResponseService',
    status,
    intent,
    routeTarget: route?.target || 'none',
    routeStatus: route?.status || 'waiting',
    title,
    summary,
    lines,
    timestamp,
    naturalConversation: false,
    speechOutput: false,
    liveAudio: false,
    medicalDiagnosis: false,
  }
}

class VoiceResponseService {
  constructor() {
    this.lastResponse = null
    this.history = []
    this.maxHistory = 20
  }

  generate(intentResult, routeResult, context = {}) {
    const timestamp = context.timestamp || intentResult?.timestamp || routeResult?.timestamp || Date.now()
    const intent = intentResult?.intent || null
    const route = routeResult || null

    let response

    switch (intent) {
      case 'WAKE_MARS':
        response = this.createWakeResponse(intent, route, context, timestamp)
        break
      case 'VOICE_STATUS':
        response = this.createVoiceStatusResponse(intent, route, context, timestamp)
        break
      case 'SYSTEM_STATUS':
        response = this.createSystemStatusResponse(intent, route, context, timestamp)
        break
      case 'VISION_DESCRIBE_SCENE':
        response = this.createDescribeSceneResponse(intent, route, context, timestamp)
        break
      case 'HELP':
        response = this.createHelpResponse(intent, route, context, timestamp)
        break
      case 'CANCEL_COMMAND':
      case 'SLEEP_VOICE_ROUTING':
        response = this.createCancelResponse(intent, route, context, timestamp)
        break
      case 'PROTECTED_USER_STATUS':
        response = this.createProtectedUserResponse(intent, route, context, timestamp)
        break
      case 'UNKNOWN_VOICE_INTENT':
        response = this.createUnknownResponse(intentResult, route, context, timestamp)
        break
      default:
        response = this.createWaitingResponse(intentResult, route, context, timestamp)
        break
    }

    return this.recordResponse(response)
  }

  createWakeResponse(intent, route, context, timestamp) {
    const wakeState = context.wakeWordStatus?.state || 'listening'

    return createResponse({
      status: VOICE_RESPONSE_STATUS.GENERATED,
      intent,
      route,
      title: 'MARS is listening',
      summary: 'Voice activation is active. Enter a command and route it through the command router.',
      lines: [
        `Wake layer: ${wakeState}`,
        'Activation source: simulated UI wake control',
        'Live microphone capture: deferred',
        'Next step: enter a command such as voice status, system status or help.',
      ],
      timestamp,
    })
  }

  createVoiceStatusResponse(intent, route, context, timestamp) {
    const registry = context.commandRegistry || VoiceCommandRegistry.getStatus()
    const parser = context.intentParser || {}
    const router = context.commandRouter || {}
    const wake = context.wakeWordStatus || {}

    return createResponse({
      status: VOICE_RESPONSE_STATUS.GENERATED,
      intent,
      route,
      title: 'Voice Intelligence Status',
      summary: 'Voice Intelligence is operating in simulated wake-word and command-routing mode.',
      lines: [
        'Version: v0.14.1.1',
        `Wake layer: ${wake.state || 'unknown'}`,
        `Command registry: ${registry.ready ? 'online' : 'degraded'} (${registry.commandCount || 0} commands)`,
        `Intent parser: ${parser.ready ? 'ready' : 'unknown'}`,
        `Command router: ${router.ready ? 'online' : 'unknown'} (${router.routeCount || 0} routes)`,
        'Voice responses: deterministic UI responses only',
        'Live microphone, STT, TTS and natural conversation: deferred',
      ],
      timestamp,
    })
  }

  createSystemStatusResponse(intent, route, context, timestamp) {
    return createResponse({
      status: VOICE_RESPONSE_STATUS.GENERATED,
      intent,
      route,
      title: 'MARS System Status',
      summary: 'The routed system status command reports the current capability-level health summary.',
      lines: [
        'Vision: online',
        'Identity: online',
        'Behaviour: online',
        'Decision: online',
        'Notifications: online',
        'Diagnostics: online',
        'Voice: online',
        'Robot control: future milestone',
      ],
      timestamp,
    })
  }

  createDescribeSceneResponse(intent, route, context, timestamp) {
    return createResponse({
      status: VOICE_RESPONSE_STATUS.BLOCKED,
      intent,
      route,
      title: 'Vision Route Prepared',
      summary: 'The command was recognised and routed toward Vision, but live scene execution remains deferred for this voice milestone.',
      lines: [
        'Route target: vision',
        'Requested action: describe scene',
        'Current behaviour: placeholder response only',
        'Future behaviour: connect routed command to the Vision capability interface.',
      ],
      timestamp,
    })
  }

  createHelpResponse(intent, route, context, timestamp) {
    const commands = VoiceCommandRegistry.listCommands()
      .filter((command) => command.status !== 'deferred')
      .map((command) => `${command.phrase} — ${command.description}`)

    return createResponse({
      status: VOICE_RESPONSE_STATUS.GENERATED,
      intent,
      route,
      title: 'Available Voice Commands',
      summary: 'These commands are registered for the simulated v0.14.1.1 voice routing layer.',
      lines: commands,
      timestamp,
    })
  }

  createCancelResponse(intent, route, context, timestamp) {
    return createResponse({
      status: VOICE_RESPONSE_STATUS.CANCELLED,
      intent,
      route,
      title: 'Voice Command Cancelled',
      summary: 'The active voice command route has been cancelled and the activation layer is returning to a waiting state.',
      lines: [
        'Current route: cancelled',
        'Wake state: sleeping or waiting',
        'No command will be executed.',
      ],
      timestamp,
    })
  }

  createProtectedUserResponse(intent, route, context, timestamp) {
    return createResponse({
      status: VOICE_RESPONSE_STATUS.BLOCKED,
      intent,
      route,
      title: 'Protected User Route Deferred',
      summary: 'The command was recognised, but protected-user alerting is scheduled for v0.17 and is not active in this milestone.',
      lines: [
        'Route target: protected-user-alerting',
        'Current behaviour: deferred safety route only',
        'Medical diagnosis: not performed',
        'Future milestone: v0.17 Protected User Alerting',
      ],
      timestamp,
    })
  }

  createUnknownResponse(intentResult, route, context, timestamp) {
    const transcript = intentResult?.transcript || 'unknown command'

    return createResponse({
      status: VOICE_RESPONSE_STATUS.UNKNOWN,
      intent: intentResult?.intent || 'UNKNOWN_VOICE_INTENT',
      route,
      title: 'Command Not Recognised',
      summary: `MARS could not match "${transcript}" to a registered voice command.`,
      lines: [
        'Try: voice status',
        'Try: system status',
        'Try: describe scene',
        'Try: help',
      ],
      timestamp,
    })
  }

  createWaitingResponse(intentResult, route, context, timestamp) {
    return createResponse({
      status: VOICE_RESPONSE_STATUS.WAITING,
      intent: intentResult?.intent || null,
      route,
      title: 'Waiting for Voice Command',
      summary: intentResult?.summary || 'No voice response has been generated yet.',
      lines: [
        'Wake MARS first, then route a registered command.',
        'Use help to list available commands.',
      ],
      timestamp,
    })
  }

  recordResponse(response) {
    this.lastResponse = response
    this.history = [response, ...this.history].slice(0, this.maxHistory)
    return response
  }

  getLastResponse() {
    return this.lastResponse
  }

  getHistory() {
    return [...this.history]
  }

  clearHistory() {
    this.lastResponse = null
    this.history = []
  }

  getStatus() {
    return {
      version: 'v0.14.1.1',
      service: 'VoiceResponseService',
      ready: true,
      deterministicResponses: true,
      naturalConversation: false,
      speechOutput: false,
      liveAudio: false,
      responseCount: this.history.length,
      lastResponse: this.lastResponse,
    }
  }
}

export default new VoiceResponseService()
