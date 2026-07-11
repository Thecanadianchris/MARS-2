/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Service:
 * SpeechCapabilityService
 *
 * Purpose:
 * Central, honest source of truth for browser speech
 * capability (Web Speech API). Extracted from the inline check
 * that previously lived only in VoiceInput.jsx so that
 * VoiceService / VoiceDiagnosticsService / VoicePanel can report
 * real audio capability instead of hardcoded false flags.
 *
 * Note: detecting browser support is not the same as the
 * `services/voice/` command-routing architecture itself
 * performing live audio. ChatPanel uses this capability
 * directly for real microphone input and spoken output. The
 * Voice tab's wake-word/command-routing layer remains a
 * simulated, typed-transcript experience — see VoicePanel's
 * "Not Included" notice for that distinction.
 *
 * Version:
 * v0.14.3
 * Date Code:
 * 110726
 * ==========================================================
 */

function getSpeechRecognitionConstructor() {
  if (typeof window === 'undefined') {
    return null
  }

  return window.SpeechRecognition || window.webkitSpeechRecognition || null
}

class SpeechCapabilityService {
  isSpeechRecognitionSupported() {
    return Boolean(getSpeechRecognitionConstructor())
  }

  isSpeechSynthesisSupported() {
    return typeof window !== 'undefined' && 'speechSynthesis' in window
  }

  getSpeechRecognitionConstructor() {
    return getSpeechRecognitionConstructor()
  }

  getStatus() {
    const speechToText = this.isSpeechRecognitionSupported()
    const textToSpeech = this.isSpeechSynthesisSupported()

    return {
      version: 'v0.14.3',
      service: 'SpeechCapabilityService',
      speechToText,
      textToSpeech,
      audioReady: speechToText && textToSpeech,
      summary: speechToText && textToSpeech
        ? 'This browser supports real speech recognition and speech synthesis. Chat tab uses both live.'
        : 'This browser does not fully support the Web Speech API. Chat tab voice input/output may be unavailable.',
    }
  }
}

export default new SpeechCapabilityService()
