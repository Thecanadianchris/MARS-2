/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Module Exports:
 * Voice Intelligence
 *
 * Purpose:
 * Public interface for v0.14.1.1 Voice Response Layer.
 *
 * Version:
 * v0.14.1.1
 * Date Code:
 * 060726
 * ==========================================================
 */

export {
  default as VoiceService,
  VOICE_FOUNDATION_FEATURES,
  VOICE_ACTIVATION_FEATURES,
  VOICE_DEFERRED_FEATURES,
} from './VoiceService'
export {
  default as VoiceCommandRegistry,
  DEFAULT_VOICE_COMMANDS,
  VOICE_COMMAND_CATEGORIES,
  VOICE_COMMAND_STATUS,
  normalisePhrase,
} from './VoiceCommandRegistry'
export { default as VoiceIntentParser, VOICE_INTENT_STATUS } from './VoiceIntentParser'
export { default as VoiceDiagnosticsService } from './VoiceDiagnosticsService'
export { default as WakeWordService, WAKE_WORD_STATUS, DEFAULT_WAKE_PHRASES } from './WakeWordService'
export {
  default as VoiceCommandRouter,
  VOICE_ROUTE_STATUS,
  VOICE_ROUTE_TARGETS,
  DEFAULT_VOICE_ROUTES,
} from './VoiceCommandRouter'

export { default as VoiceResponseService, VOICE_RESPONSE_STATUS } from './VoiceResponseService'
