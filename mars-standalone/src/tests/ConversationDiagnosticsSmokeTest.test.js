/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Smoke Test:
 * ConversationDiagnosticsSmokeTest
 *
 * Purpose:
 * Verifies v0.14.2 conversation diagnostics snapshots.
 *
 * Version:
 * v0.14.2
 * Date Code:
 * 070726
 * ==========================================================
 */

import { beforeEach, describe, expect, test } from 'vitest'
import { ConversationDiagnosticsService, NaturalConversationEngine } from '../services/conversation'

beforeEach(() => {
  NaturalConversationEngine.reset()
})

describe('Conversation Diagnostics Smoke Test', () => {
  test('creates diagnostics from a conversation turn', () => {
    const result = NaturalConversationEngine.processTurn('voice status', { timestamp: 1000 })

    expect(result.diagnostics.service).toBe('ConversationDiagnosticsService')
    expect(result.diagnostics.historySize).toBe(1)
    expect(result.diagnostics.liveAudio).toBe(false)
  })

  test('exposes last diagnostics snapshot', () => {
    NaturalConversationEngine.processTurn('who can you see', { timestamp: 1000 })
    const snapshot = ConversationDiagnosticsService.getLastSnapshot()

    expect(snapshot.lastPlan).toBe('route_to_vision')
    expect(snapshot.lastCapability).toBe('vision')
  })

  test('clears diagnostics snapshot safely', () => {
    NaturalConversationEngine.processTurn('help', { timestamp: 1000 })
    ConversationDiagnosticsService.clearSnapshot()

    expect(ConversationDiagnosticsService.getLastSnapshot()).toBe(null)
    expect(ConversationDiagnosticsService.getStatus().status).toBe('ready')
  })
})
