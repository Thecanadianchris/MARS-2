/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Service:
 * SpeechOutputService
 *
 * Purpose:
 * v0.16.7. Small reusable text-to-speech helper wrapping the
 * browser's Web Speech API (window.speechSynthesis), extracted so
 * more than just ChatPanel's inline speak() function can have MARS
 * actually say something out loud. Same voice settings as
 * ChatPanel's speak() (en-GB, rate 0.95, pitch 0.9) so it's
 * recognisably the same "voice" everywhere it's used.
 *
 * First consumer: useFaceEnrollment.js, so the guided pose sequence
 * can narrate each instruction ("Slowly turn your head slightly to
 * the left") instead of relying on a fixed short timer that a live
 * test (16 July 2026, Christian) showed felt "way too quick" and
 * didn't actually pause for the person to get into position. Using
 * real speech duration for pacing is a more honest wait than a guessed
 * constant — a short instruction takes less time to say and hear than
 * a long one, same as it would for a person giving the instruction.
 *
 * speak() never throws and never hangs forever: if speech synthesis
 * isn't supported, or the browser never fires the utterance's `end`
 * event (headless environments, no installed voices, etc.), it
 * resolves via a generous length-based fallback timeout rather than
 * blocking whatever awaited it indefinitely.
 *
 * Version:
 * v0.16.7
 *
 * Date Code:
 * 160726
 * ==========================================================
 */

import SpeechCapabilityService from './SpeechCapabilityService'

const MIN_FALLBACK_MS = 1500
const MAX_FALLBACK_MS = 8000
const MS_PER_CHARACTER = 90

class SpeechOutputService {
  /**
   * Speaks text aloud and resolves once speaking has actually
   * finished (or been given up on). Always resolves, never rejects.
   */
  speak(text, options = {}) {
    return new Promise((resolve) => {
      if (!text || typeof window === 'undefined' || !SpeechCapabilityService.isSpeechSynthesisSupported()) {
        resolve({ status: 'unsupported' })
        return
      }

      let settled = false
      const settle = (status) => {
        if (settled) return
        settled = true
        resolve({ status })
      }

      try {
        const utterance = new SpeechSynthesisUtterance(text)
        utterance.lang = options.lang || 'en-GB'
        utterance.rate = options.rate ?? 0.95
        utterance.pitch = options.pitch ?? 0.9

        utterance.onend = () => settle('spoken')
        utterance.onerror = () => settle('error')

        window.speechSynthesis.cancel()
        window.speechSynthesis.speak(utterance)

        const fallbackMs = Math.max(
          MIN_FALLBACK_MS,
          Math.min(MAX_FALLBACK_MS, text.length * MS_PER_CHARACTER)
        )
        setTimeout(() => settle('timeout'), fallbackMs)
      } catch {
        settle('error')
      }
    })
  }

  cancel() {
    if (typeof window === 'undefined' || !SpeechCapabilityService.isSpeechSynthesisSupported()) {
      return
    }

    try {
      window.speechSynthesis.cancel()
    } catch {
      // Nothing useful to do if cancel itself fails.
    }
  }

  getStatus() {
    return {
      status: 'success',
      provider: 'SPEECH_OUTPUT_SERVICE',
      version: 'v0.16.7',
      supported: SpeechCapabilityService.isSpeechSynthesisSupported(),
    }
  }
}

export default new SpeechOutputService()
