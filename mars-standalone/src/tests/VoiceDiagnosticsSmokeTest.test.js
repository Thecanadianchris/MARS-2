/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Smoke Test:
 * VoiceDiagnosticsSmokeTest
 *
 * Purpose:
 * Verifies that v0.14.0 Voice Intelligence Foundation reports
 * safely into the central diagnostics framework.
 *
 * Version:
 * v0.14.0
 * Date Code:
 * 060726
 * ==========================================================
 */

import { describe, expect, test } from 'vitest'
import { DiagnosticsManager, DIAGNOSTIC_STATUS } from '../services/diagnostics'
import { VoiceDiagnosticsService } from '../services/voice'

describe('Voice Diagnostics Smoke Test', () => {
  test('reports voice foundation service health', () => {
    const diagnostics = VoiceDiagnosticsService.evaluate()

    expect(diagnostics.version).toBe('v0.14.0')
    expect(diagnostics.status).toBe('ready')
    expect(diagnostics.capabilities.voiceService).toBe(true)
    expect(diagnostics.capabilities.commandRegistry).toBe(true)
    expect(diagnostics.capabilities.intentParser).toBe(true)
    expect(diagnostics.capabilities.liveAudio).toBe(false)
  })

  test('adds voice to central diagnostics snapshot', () => {
    const snapshot = DiagnosticsManager.runDiagnostics()
    const voiceItem = snapshot.items.find((item) => item.id === 'voice-intelligence-foundation')

    expect(snapshot.version).toBe('v0.13.6')
    expect(voiceItem).toBeDefined()
    expect(voiceItem.group).toBe('Voice')
    expect(voiceItem.status).toBe(DIAGNOSTIC_STATUS.READY)
    expect(voiceItem.checks.find((check) => check.id === 'live-audio-deferred').passed).toBe(true)
  })
})
