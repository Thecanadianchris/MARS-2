/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Smoke Test:
 * VoicePanelSmokeTest
 *
 * Purpose:
 * Verifies the v0.14.0 Voice Panel state model without browser
 * rendering dependencies.
 *
 * Version:
 * v0.14.0
 * Date Code:
 * 060726
 * ==========================================================
 */

import { describe, expect, test } from 'vitest'
import { VoiceService } from '../services/voice'

describe('Voice Panel Smoke Test', () => {
  test('creates a voice panel snapshot with commands and deferred features', () => {
    const snapshot = VoiceService.getPanelSnapshot()

    expect(snapshot.panel).toBe('VoicePanel')
    expect(snapshot.version).toBe('v0.14.0')
    expect(snapshot.commands.length).toBeGreaterThanOrEqual(5)
    expect(snapshot.implementedFeatures).toContain('voice-service-interface')
    expect(snapshot.deferredFeatures).toContain('wake-word-detection')
    expect(snapshot.deferredFeatures).toContain('android-audio-pipeline')
  })

  test('updates panel state after parsing a transcript', () => {
    const result = VoiceService.evaluateTranscript('system status')
    const snapshot = VoiceService.getPanelSnapshot()

    expect(result.intent).toBe('SYSTEM_STATUS')
    expect(snapshot.commandRegistry.ready).toBe(true)
    expect(snapshot.intentParser.ready).toBe(true)
    expect(snapshot.capabilityState.state).toBe('waiting')
  })
})
