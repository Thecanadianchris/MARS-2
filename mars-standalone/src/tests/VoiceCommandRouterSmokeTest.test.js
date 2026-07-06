/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Smoke Test:
 * VoiceCommandRouterSmokeTest
 *
 * Purpose:
 * Verifies the v0.14.1 command router preserves loose coupling
 * by routing intents without executing target capability logic.
 *
 * Version:
 * v0.14.1
 * Date Code:
 * 060726
 * ==========================================================
 */

import { beforeEach, describe, expect, test } from 'vitest'
import { VoiceCommandRouter, VoiceIntentParser, VOICE_ROUTE_STATUS, VOICE_ROUTE_TARGETS } from '../services/voice'

beforeEach(() => {
  VoiceCommandRouter.clearHistory()
})

describe('Voice Command Router Smoke Test', () => {
  test('routes system status to diagnostics', () => {
    const intent = VoiceIntentParser.parseTranscript('system status')
    const route = VoiceCommandRouter.routeIntent(intent)

    expect(route.status).toBe(VOICE_ROUTE_STATUS.ROUTED)
    expect(route.intent).toBe('SYSTEM_STATUS')
    expect(route.target).toBe(VOICE_ROUTE_TARGETS.DIAGNOSTICS)
    expect(route.action).toBe('open-system-diagnostics')
  })

  test('blocks deferred protected-user routes without making medical claims', () => {
    const intent = VoiceIntentParser.parseTranscript('check protected user')
    const route = VoiceCommandRouter.routeIntent(intent)

    expect(route.status).toBe(VOICE_ROUTE_STATUS.BLOCKED)
    expect(route.target).toBe(VOICE_ROUTE_TARGETS.PROTECTED_USER)
    expect(route.summary.toLowerCase()).not.toContain('diagnosed')
    expect(route.summary.toLowerCase()).not.toContain('seizure detected')
  })

  test('reports unknown routes safely', () => {
    const intent = VoiceIntentParser.parseTranscript('sing a song')
    const route = VoiceCommandRouter.routeIntent(intent)

    expect(route.status).toBe(VOICE_ROUTE_STATUS.UNKNOWN)
    expect(route.target).toBe(VOICE_ROUTE_TARGETS.NONE)
    expect(VoiceCommandRouter.getStatus().historyCount).toBe(1)
  })
})
