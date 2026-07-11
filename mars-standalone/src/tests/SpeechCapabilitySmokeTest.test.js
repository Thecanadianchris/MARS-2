/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Smoke Test:
 * SpeechCapabilitySmokeTest
 *
 * Purpose:
 * Verifies SpeechCapabilityService reports a well-formed
 * capability status. The vitest/jsdom test environment does not
 * implement the Web Speech API, so both flags are expected to be
 * false here — this test checks the shape/contract, not that the
 * APIs exist (that's verified by manual browser UI checks).
 *
 * Version:
 * v0.14.3
 * Date Code:
 * 110726
 * ==========================================================
 */

import { describe, expect, test } from 'vitest'
import SpeechCapabilityService from '../services/voice/SpeechCapabilityService'
import { VoiceService, VoiceDiagnosticsService } from '../services/voice'

describe('Speech Capability Smoke Test', () => {
  test('reports a well-formed capability status', () => {
    const status = SpeechCapabilityService.getStatus()

    expect(status.version).toBe('v0.14.3')
    expect(typeof status.speechToText).toBe('boolean')
    expect(typeof status.textToSpeech).toBe('boolean')
    expect(status.audioReady).toBe(status.speechToText && status.textToSpeech)
    expect(typeof status.summary).toBe('string')
  })

  test('is surfaced on VoiceService.getStatus() without changing the existing simulated-layer flags', () => {
    const status = VoiceService.getStatus()

    expect(status.browserSpeechCapability).toBeTruthy()
    expect(typeof status.browserSpeechCapability.speechToText).toBe('boolean')
    // Existing v0.14.1.1 contract must remain unchanged by this addition.
    expect(status.speechToTextEnabled).toBe(false)
    expect(status.textToSpeechEnabled).toBe(false)
    expect(status.liveAudioEnabled).toBe(false)
  })

  test('is surfaced on VoiceDiagnosticsService.evaluate()', () => {
    const diagnostics = VoiceDiagnosticsService.evaluate()

    expect(diagnostics.browserSpeechCapability).toBeTruthy()
    expect(typeof diagnostics.browserSpeechCapability.speechToText).toBe('boolean')
  })
})
