/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Module:
 * Voice Public API Barrel
 *
 * Purpose:
 * Stabilises the public Voice Intelligence API for v0.14.1.1
 * by exporting all services and shared constants from one path:
 *
 *   ../services/voice
 *   @/services/voice
 *
 * This file deliberately defines the public constants here so
 * smoke tests and consuming modules receive a stable API even if
 * individual internal service files evolve later.
 *
 * Version:
 * v0.14.1.1 RC3
 * Date Code:
 * 060726
 * ==========================================================
 */

export { default as VoiceService } from './voice/VoiceService.js'
export { default as VoiceCommandRegistry } from './voice/VoiceCommandRegistry.js'
export { default as VoiceIntentParser } from './voice/VoiceIntentParser.js'
export { default as VoiceDiagnosticsService } from './voice/VoiceDiagnosticsService.js'
export { default as WakeWordService } from './voice/WakeWordService.js'
export { default as VoiceCommandRouter } from './voice/VoiceCommandRouter.js'
export { default as VoiceResponseService } from './voice/VoiceResponseService.js'

export const WAKE_WORD_STATUS = Object.freeze({
  SLEEPING: 'sleeping',
  LISTENING: 'listening',
  EXPIRED: 'expired',
})

export const DEFAULT_WAKE_PHRASES = Object.freeze([
  'wake mars',
  'hey mars',
  'mars wake up',
  'okay mars',
])

export const VOICE_INTENT_STATUS = Object.freeze({
  MATCHED: 'matched',
  UNKNOWN: 'unknown',
  EMPTY: 'empty',
})

export const VOICE_ROUTE_STATUS = Object.freeze({
  ROUTED: 'routed',
  WAITING: 'waiting',
  UNKNOWN: 'unknown',
  BLOCKED: 'blocked',
  CANCELLED: 'cancelled',
})

export const VOICE_ROUTE_TARGETS = Object.freeze({
  VOICE: 'voice',
  DIAGNOSTICS: 'diagnostics',
  VISION: 'vision',
  SYSTEM: 'system',
  PROTECTED_USER: 'protected-user-alerting',
  HELP: 'help',
  NONE: 'none',
})

export const VOICE_RESPONSE_STATUS = Object.freeze({
  READY: 'ready',
  GENERATED: 'generated',
  WAITING: 'waiting',
  UNKNOWN: 'unknown',
  BLOCKED: 'blocked',
  CANCELLED: 'cancelled',
})

export const VOICE_COMMAND_CATEGORIES = Object.freeze({
  SYSTEM: 'system',
  DIAGNOSTICS: 'diagnostics',
  CAPABILITY: 'capability',
  SAFETY: 'safety',
})

export const VOICE_COMMAND_STATUS = Object.freeze({
  ACTIVE: 'active',
  PLANNED: 'planned',
  DEFERRED: 'deferred',
})

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

export const DEFAULT_VOICE_ROUTES = Object.freeze({
  WAKE_MARS: {
    target: VOICE_ROUTE_TARGETS.VOICE,
    action: 'activate-voice-routing',
    requiresFutureCapability: false,
  },
  VOICE_STATUS: {
    target: VOICE_ROUTE_TARGETS.VOICE,
    action: 'report-voice-status',
    requiresFutureCapability: false,
  },
  SYSTEM_STATUS: {
    target: VOICE_ROUTE_TARGETS.DIAGNOSTICS,
    action: 'open-system-diagnostics',
    requiresFutureCapability: false,
  },
  VISION_DESCRIBE_SCENE: {
    target: VOICE_ROUTE_TARGETS.VISION,
    action: 'request-scene-description',
    requiresFutureCapability: true,
  },
  HELP: {
    target: VOICE_ROUTE_TARGETS.HELP,
    action: 'show-available-commands',
    requiresFutureCapability: false,
  },
  CANCEL_COMMAND: {
    target: VOICE_ROUTE_TARGETS.NONE,
    action: 'cancel-active-command',
    requiresFutureCapability: false,
  },
  PROTECTED_USER_STATUS: {
    target: VOICE_ROUTE_TARGETS.PROTECTED_USER,
    action: 'request-protected-user-status',
    requiresFutureCapability: true,
  },
})

export const DEFAULT_VOICE_COMMANDS = Object.freeze([
  {
    id: 'wake-mars',
    phrase: 'wake mars',
    aliases: ['hey mars', 'mars wake up', 'okay mars'],
    category: VOICE_COMMAND_CATEGORIES.SYSTEM,
    status: VOICE_COMMAND_STATUS.ACTIVE,
    intent: 'WAKE_MARS',
    description: 'Activates the simulated MARS voice command routing layer.',
  },
  {
    id: 'voice-status',
    phrase: 'voice status',
    aliases: ['check voice', 'voice diagnostics', 'voice system status'],
    category: VOICE_COMMAND_CATEGORIES.DIAGNOSTICS,
    status: VOICE_COMMAND_STATUS.ACTIVE,
    intent: 'VOICE_STATUS',
    description: 'Reports the current Voice Intelligence Foundation status.',
  },
  {
    id: 'system-status',
    phrase: 'system status',
    aliases: ['mars status', 'diagnostics status', 'check system'],
    category: VOICE_COMMAND_CATEGORIES.SYSTEM,
    status: VOICE_COMMAND_STATUS.ACTIVE,
    intent: 'SYSTEM_STATUS',
    description: 'Routes to the existing diagnostics capability.',
  },
  {
    id: 'describe-scene',
    phrase: 'describe scene',
    aliases: ['what can you see', 'look around', 'vision status'],
    category: VOICE_COMMAND_CATEGORIES.CAPABILITY,
    status: VOICE_COMMAND_STATUS.PLANNED,
    intent: 'VISION_DESCRIBE_SCENE',
    description: 'Future command route into the Vision capability.',
  },
  {
    id: 'cancel-command',
    phrase: 'cancel',
    aliases: ['stop', 'never mind', 'ignore that'],
    category: VOICE_COMMAND_CATEGORIES.SYSTEM,
    status: VOICE_COMMAND_STATUS.ACTIVE,
    intent: 'CANCEL_COMMAND',
    description: 'Cancels the current voice command route.',
  },
  {
    id: 'help',
    phrase: 'help',
    aliases: ['what can i say', 'list commands', 'available commands'],
    category: VOICE_COMMAND_CATEGORIES.SYSTEM,
    status: VOICE_COMMAND_STATUS.ACTIVE,
    intent: 'HELP',
    description: 'Lists currently registered voice commands and routes.',
  },
  {
    id: 'assistive-check',
    phrase: 'check protected user',
    aliases: ['check finley', 'protected user status', 'assistive status'],
    category: VOICE_COMMAND_CATEGORIES.SAFETY,
    status: VOICE_COMMAND_STATUS.DEFERRED,
    intent: 'PROTECTED_USER_STATUS',
    description: 'Future route into protected-user alerting after v0.17.',
  },
])

export function normalisePhrase(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
}
