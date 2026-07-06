/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Smoke Test:
 * VoicePanelSmokeTest
 *
 * Purpose:
 * Verifies the v0.14.1.1 Voice Panel state model without browser
 * rendering dependencies.
 *
 * Version:
 * v0.14.1.1
 * Date Code:
 * 060726
 * ==========================================================
 */

import { describe, expect, test, beforeEach } from 'vitest'
import { VoiceService } from '../services/voice'

beforeEach(() => {
  VoiceService.clearHistory()
  VoiceService.resetActivation()
})

describe('Voice Panel Smoke Test', () => {
  test('creates a voice panel snapshot with commands and routing services', () => {
    const snapshot = VoiceService.getPanelSnapshot()

    expect(snapshot.panel).toBe('VoicePanel')
    expect(snapshot.version).toBe('v0.14.1.1')
    expect(snapshot.commands.length).toBeGreaterThanOrEqual(7)
    expect(snapshot.implementedFeatures).toContain('voice-service-interface')
    expect(snapshot.implementedFeatures).toContain('voice-command-router')
    expect(snapshot.deferredFeatures).toContain('android-audio-pipeline')
    expect(snapshot.commandRouter.ready).toBe(true)
    expect(snapshot.wakeWordService.ready).toBe(true)
  })

  test('updates panel state after routing a command', () => {
    VoiceService.activate('test-panel')
    const result = VoiceService.routeCommand('system status')
    const snapshot = VoiceService.getPanelSnapshot()

    expect(result.intent).toBe('SYSTEM_STATUS')
    expect(result.route.target).toBe('diagnostics')
    expect(snapshot.commandRegistry.ready).toBe(true)
    expect(snapshot.intentParser.ready).toBe(true)
    expect(snapshot.commandRouter.lastRoute.intent).toBe('SYSTEM_STATUS')
    expect(snapshot.lastResponse.title).toBe('MARS System Status')
    expect(snapshot.responseCount).toBeGreaterThan(0)
    expect(snapshot.capabilityState.state).toBe('waiting')
  })

  test('records visible UI state after wake and sleep controls are used', () => {
    const wakeResult = VoiceService.activate('test-panel-button')
    let snapshot = VoiceService.getPanelSnapshot()

    expect(wakeResult.status).toBe('activated')
    expect(wakeResult.intent).toBe('WAKE_MARS')
    expect(snapshot.wakeWordService.state).toBe('listening')
    expect(snapshot.lastIntent.status).toBe('activated')
    expect(snapshot.lastRoute.target).toBe('voice')
    expect(snapshot.lastResponse.title).toBe('MARS is listening')

    const sleepResult = VoiceService.resetActivation({ source: 'test-panel-sleep-button' })
    snapshot = VoiceService.getPanelSnapshot()

    expect(sleepResult.status).toBe('sleeping')
    expect(snapshot.wakeWordService.state).toBe('sleeping')
    expect(snapshot.lastIntent.intent).toBe('SLEEP_VOICE_ROUTING')
    expect(snapshot.lastResponse.title).toBe('Voice Command Cancelled')
  })

})
