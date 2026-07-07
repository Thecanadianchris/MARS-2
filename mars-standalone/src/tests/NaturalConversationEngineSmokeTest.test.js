/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Smoke Test:
 * NaturalConversationEngineSmokeTest
 *
 * Purpose:
 * Verifies v0.14.2 Natural Conversation Engine orchestration.
 *
 * Version:
 * v0.14.2
 * Date Code:
 * 070726
 * ==========================================================
 */

import { beforeEach, describe, expect, test } from 'vitest'
import { NaturalConversationEngine } from '../services/conversation'

beforeEach(() => {
  NaturalConversationEngine.reset()
})

describe('Natural Conversation Engine Smoke Test', () => {
  test('processes a natural conversation turn', () => {
    const result = NaturalConversationEngine.processTurn('who is in the room', { timestamp: 1000 })

    expect(result.status).toBe('processed')
    expect(result.naturalConversation).toBe(true)
    expect(result.response.naturalConversation).toBe(true)
    expect(result.diagnostics.conversationActive).toBe(true)
  })

  test('keeps follow-up context across turns', () => {
    NaturalConversationEngine.processTurn('Christian is in the room', { timestamp: 1000 })
    const result = NaturalConversationEngine.processTurn('what is he doing', { timestamp: 2000 })

    expect(result.reference.resolvedTarget).toBe('Christian')
    expect(result.reference.confidence).toBeGreaterThan(0.7)
  })

  test('does not enable persistent memory or live audio', () => {
    const result = NaturalConversationEngine.processTurn('remember this conversation', { timestamp: 1000 })

    expect(result.persistentMemory).toBe(false)
    expect(result.liveAudio).toBe(false)
    expect(result.medicalDiagnosis).toBe(false)
  })
})
