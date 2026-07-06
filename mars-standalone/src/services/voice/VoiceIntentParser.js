/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Service:
 * VoiceIntentParser
 *
 * Purpose:
 * Parses text transcripts into voice intent candidates for
 * v0.14.0 without performing speech-to-text or live microphone
 * capture.
 *
 * Version:
 * v0.14.0
 * Date Code:
 * 060726
 * ==========================================================
 */

import VoiceCommandRegistry, { normalisePhrase } from './VoiceCommandRegistry'

export const VOICE_INTENT_STATUS = Object.freeze({
  MATCHED: 'matched',
  UNKNOWN: 'unknown',
  EMPTY: 'empty',
})

class VoiceIntentParser {
  parseTranscript(transcript, options = {}) {
    const normalisedTranscript = normalisePhrase(transcript)
    const timestamp = options.timestamp || Date.now()

    if (!normalisedTranscript) {
      return {
        status: VOICE_INTENT_STATUS.EMPTY,
        intent: null,
        command: null,
        confidence: 0,
        transcript: '',
        normalisedTranscript,
        source: options.source || 'manual-transcript',
        timestamp,
        summary: 'No voice transcript was supplied.',
      }
    }

    const command = VoiceCommandRegistry.findByPhrase(normalisedTranscript)

    if (!command) {
      return {
        status: VOICE_INTENT_STATUS.UNKNOWN,
        intent: 'UNKNOWN_VOICE_INTENT',
        command: null,
        confidence: 0.2,
        transcript,
        normalisedTranscript,
        source: options.source || 'manual-transcript',
        timestamp,
        summary: 'Transcript received but no registered command matched.',
      }
    }

    return {
      status: VOICE_INTENT_STATUS.MATCHED,
      intent: command.intent,
      command,
      confidence: command.status === 'active' ? 0.9 : 0.65,
      transcript,
      normalisedTranscript,
      source: options.source || 'manual-transcript',
      timestamp,
      summary: `Matched voice command: ${command.phrase}.`,
    }
  }

  getStatus() {
    return {
      version: 'v0.14.0',
      ready: true,
      parser: 'VoiceIntentParser',
      accepts: 'text transcript',
      liveAudio: false,
      speechToText: false,
    }
  }
}

export default new VoiceIntentParser()
