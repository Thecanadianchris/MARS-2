/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Smoke Test:
 * VoiceFoundationSmokeTest
 *
 * Purpose:
 * Verifies the v0.14.1.1 Voice Intelligence architecture without
 * live microphone or speech provider dependencies.
 *
 * Version:
 * v0.14.1.1
 * Date Code:
 * 060726
 * ==========================================================
 */

import { describe, expect, test, beforeEach } from 'vitest'
import {
  VoiceCommandRegistry,
  VoiceIntentParser,
  VoiceService,
  VOICE_DEFERRED_FEATURES,
  VOICE_FOUNDATION_FEATURES,
  VOICE_ACTIVATION_FEATURES,
  VOICE_INTENT_STATUS,
} from '../services/voice'

beforeEach(() => {
  VoiceService.clearHistory()
  VoiceService.resetActivation()
})

describe('Voice Intelligence Foundation Smoke Test', () => {
  test('provides a voice architecture status without live audio', () => {
    const status = VoiceService.getStatus()

    expect(status.version).toBe('v0.14.1.1')
    expect(status.architectureReady).toBe(true)
    expect(status.liveAudioEnabled).toBe(false)
    expect(status.wakeWordEnabled).toBe(true)
    expect(status.wakeWordSimulated).toBe(true)
    expect(status.speechToTextEnabled).toBe(false)
    expect(status.textToSpeechEnabled).toBe(false)
    expect(status.implementedFeatures).toEqual(expect.arrayContaining(VOICE_FOUNDATION_FEATURES))
    expect(status.implementedFeatures).toEqual(expect.arrayContaining(VOICE_ACTIVATION_FEATURES))
    expect(status.deferredFeatures).toEqual(expect.arrayContaining(VOICE_DEFERRED_FEATURES))
  })

  test('registers active and future voice commands', () => {
    const registryStatus = VoiceCommandRegistry.getStatus()
    const commands = VoiceCommandRegistry.listCommands()

    expect(registryStatus.ready).toBe(true)
    expect(registryStatus.commandCount).toBeGreaterThanOrEqual(7)
    expect(registryStatus.activeCount).toBeGreaterThanOrEqual(5)
    expect(commands.map((command) => command.id)).toContain('wake-mars')
    expect(commands.map((command) => command.id)).toContain('voice-status')
    expect(commands.map((command) => command.id)).toContain('assistive-check')
  })

  test('parses a manual transcript into a registered intent', () => {
    const result = VoiceIntentParser.parseTranscript('MARS, voice status please')

    expect(result.status).toBe(VOICE_INTENT_STATUS.MATCHED)
    expect(result.intent).toBe('VOICE_STATUS')
    expect(result.command.id).toBe('voice-status')
    expect(result.confidence).toBeGreaterThan(0.5)
  })

  test('handles unknown and empty transcripts safely', () => {
    const unknown = VoiceIntentParser.parseTranscript('make a cup of tea')
    const empty = VoiceIntentParser.parseTranscript('')

    expect(unknown.status).toBe(VOICE_INTENT_STATUS.UNKNOWN)
    expect(empty.status).toBe(VOICE_INTENT_STATUS.EMPTY)
    expect(unknown.intent).toBe('UNKNOWN_VOICE_INTENT')
    expect(empty.intent).toBeNull()
  })

  test('keeps voice routing non-medical and architecture-only', () => {
    VoiceService.activate('test')
    const result = VoiceService.routeCommand('check protected user')
    const routingText = `${result.summary} ${result.command?.description || ''} ${result.route?.summary || ''}`.toLowerCase()

    expect(result.medicalDiagnosis).toBe(false)
    expect(result.liveAudio).toBe(false)
    expect(routingText).not.toContain('seizure detected')
    expect(routingText).not.toContain('diagnosed')
  })
})
