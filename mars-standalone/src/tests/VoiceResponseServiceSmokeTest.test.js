/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Smoke Test:
 * VoiceResponseServiceSmokeTest
 *
 * Purpose:
 * Verifies the v0.14.1.1 deterministic voice response layer
 * without natural conversation, live audio, STT or TTS.
 *
 * Version:
 * v0.14.1.1
 * Date Code:
 * 060726
 * ==========================================================
 */

import { beforeEach, describe, expect, test } from 'vitest'
import { VoiceResponseService, VoiceService, VOICE_RESPONSE_STATUS } from '../services/voice'

beforeEach(() => {
  VoiceService.clearHistory()
  VoiceService.resetActivation()
})

describe('Voice Response Service Smoke Test', () => {
  test('generates a visible response for voice status', () => {
    VoiceService.activate('response-test')
    const result = VoiceService.routeCommand('voice status')

    expect(result.response).toBeDefined()
    expect(result.response.version).toBe('v0.14.1.1')
    expect(result.response.status).toBe(VOICE_RESPONSE_STATUS.GENERATED)
    expect(result.response.title).toBe('Voice Intelligence Status')
    expect(result.response.lines.join(' ')).toContain('Command registry')
    expect(result.response.naturalConversation).toBe(false)
    expect(result.response.liveAudio).toBe(false)
  })

  test('generates a system status response without executing robot hardware', () => {
    VoiceService.activate('response-test')
    const result = VoiceService.routeCommand('system status')

    expect(result.intent).toBe('SYSTEM_STATUS')
    expect(result.route.target).toBe('diagnostics')
    expect(result.response.title).toBe('MARS System Status')
    expect(result.response.lines).toContain('Voice: online')
    expect(result.response.lines).toContain('Robot control: future milestone')
  })

  test('handles unknown commands with a safe visible response', () => {
    VoiceService.activate('response-test')
    const result = VoiceService.routeCommand('make coffee')

    expect(result.intent).toBe('UNKNOWN_VOICE_INTENT')
    expect(result.response.status).toBe(VOICE_RESPONSE_STATUS.UNKNOWN)
    expect(result.response.title).toBe('Command Not Recognised')
    expect(result.response.lines.join(' ')).toContain('help')
  })

  test('keeps response layer non-medical', () => {
    VoiceService.activate('response-test')
    const result = VoiceService.routeCommand('check protected user')
    const responseText = `${result.response.title} ${result.response.summary} ${result.response.lines.join(' ')}`.toLowerCase()

    expect(result.response.medicalDiagnosis).toBe(false)
    expect(responseText).not.toContain('seizure detected')
    expect(responseText).not.toContain('diagnosed')
  })
})
