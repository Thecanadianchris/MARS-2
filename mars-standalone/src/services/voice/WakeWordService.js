/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Service:
 * WakeWordService
 *
 * Purpose:
 * Provides the v0.14.1 simulated voice activation layer for
 * Wake Word & Command Routing. This service does not access a
 * microphone. It validates wake phrases supplied by UI buttons,
 * typed transcripts or future audio adapters.
 *
 * Version:
 * v0.14.1
 * Date Code:
 * 060726
 * ==========================================================
 */

import { normalisePhrase } from './VoiceCommandRegistry'

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

class WakeWordService {
  constructor() {
    this.reset()
  }

  reset() {
    this.state = WAKE_WORD_STATUS.SLEEPING
    this.lastWakeEvent = null
    this.activationExpiresAt = null
    this.activationWindowMs = 30000
  }

  getWakePhrases() {
    return [...DEFAULT_WAKE_PHRASES]
  }

  isWakePhrase(input) {
    const phrase = normalisePhrase(input)

    if (!phrase) {
      return false
    }

    return DEFAULT_WAKE_PHRASES.map(normalisePhrase).some((candidate) => {
      return phrase === candidate || phrase.includes(candidate)
    })
  }

  activate(source = 'manual', options = {}) {
    const timestamp = options.timestamp || Date.now()

    this.state = WAKE_WORD_STATUS.LISTENING
    this.activationExpiresAt = timestamp + (options.activationWindowMs || this.activationWindowMs)
    this.lastWakeEvent = {
      status: 'activated',
      source,
      phrase: options.phrase || 'wake mars',
      timestamp,
      simulated: true,
      liveAudio: false,
      summary: 'MARS voice activation is listening for a routed command.',
    }

    return this.getStatus(timestamp)
  }

  evaluate(input, options = {}) {
    const timestamp = options.timestamp || Date.now()
    const phrase = normalisePhrase(input)
    const matched = this.isWakePhrase(phrase)

    if (!matched) {
      return {
        status: 'not-wake-word',
        activated: false,
        phrase,
        timestamp,
        summary: 'Input did not match a registered MARS wake phrase.',
      }
    }

    const status = this.activate(options.source || 'manual-transcript', {
      ...options,
      phrase,
      timestamp,
    })

    return {
      status: 'wake-word-detected',
      activated: true,
      phrase,
      timestamp,
      wakeStatus: status,
      summary: 'Wake phrase detected. MARS is ready to route the next command.',
    }
  }

  expireIfNeeded(timestamp = Date.now()) {
    if (this.state === WAKE_WORD_STATUS.LISTENING && this.activationExpiresAt && timestamp > this.activationExpiresAt) {
      this.state = WAKE_WORD_STATUS.EXPIRED
    }
  }

  sleep() {
    this.state = WAKE_WORD_STATUS.SLEEPING
    this.activationExpiresAt = null
  }

  isListening(timestamp = Date.now()) {
    this.expireIfNeeded(timestamp)
    return this.state === WAKE_WORD_STATUS.LISTENING
  }

  getStatus(timestamp = Date.now()) {
    this.expireIfNeeded(timestamp)

    return {
      version: 'v0.14.1',
      service: 'WakeWordService',
      ready: true,
      state: this.state,
      listening: this.state === WAKE_WORD_STATUS.LISTENING,
      simulated: true,
      liveAudio: false,
      wakePhrases: this.getWakePhrases(),
      lastWakeEvent: this.lastWakeEvent,
      activationExpiresAt: this.activationExpiresAt,
      activationWindowMs: this.activationWindowMs,
    }
  }
}

export default new WakeWordService()
