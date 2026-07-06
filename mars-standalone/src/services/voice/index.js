/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Module Exports:
 * Voice Intelligence
 *
 * Purpose:
 * Public interface for v0.14.0 Voice Intelligence Foundation.
 *
 * Version:
 * v0.14.0
 * Date Code:
 * 060726
 * ==========================================================
 */

export { default as VoiceService, VOICE_FOUNDATION_FEATURES, VOICE_DEFERRED_FEATURES } from './VoiceService'
export {
  default as VoiceCommandRegistry,
  DEFAULT_VOICE_COMMANDS,
  VOICE_COMMAND_CATEGORIES,
  VOICE_COMMAND_STATUS,
  normalisePhrase,
} from './VoiceCommandRegistry'
export { default as VoiceIntentParser, VOICE_INTENT_STATUS } from './VoiceIntentParser'
export { default as VoiceDiagnosticsService } from './VoiceDiagnosticsService'
