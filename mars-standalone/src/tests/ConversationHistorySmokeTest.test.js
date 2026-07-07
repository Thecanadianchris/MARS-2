/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Smoke Test:
 * ConversationHistorySmokeTest
 *
 * Purpose:
 * Verifies v0.14.2 temporary rolling conversation history.
 *
 * Version:
 * v0.14.2
 * Date Code:
 * 070726
 * ==========================================================
 */

import { beforeEach, describe, expect, test } from 'vitest'
import { ConversationHistoryService } from '../services/conversation'

beforeEach(() => {
  ConversationHistoryService.clearHistory()
})

describe('Conversation History Smoke Test', () => {
  test('stores a user exchange without persistent memory', () => {
    const exchange = ConversationHistoryService.addExchange({ userMessage: 'who is in the room', intent: 'VISION_DESCRIBE_SCENE' })

    expect(exchange.userMessage).toBe('who is in the room')
    expect(exchange.intent).toBe('VISION_DESCRIBE_SCENE')
    expect(ConversationHistoryService.getStatus().persistentMemory).toBe(false)
  })

  test('updates the latest exchange with assistant response', () => {
    ConversationHistoryService.addExchange({ userMessage: 'voice status' })
    const updated = ConversationHistoryService.updateLastAssistantResponse({ title: 'Voice Status' }, { plan: 'route_to_voice_command' })

    expect(updated.assistantResponse.title).toBe('Voice Status')
    expect(updated.plan).toBe('route_to_voice_command')
  })

  test('limits rolling history to twenty exchanges', () => {
    for (let index = 0; index < 25; index += 1) {
      ConversationHistoryService.addExchange({ userMessage: `message ${index}`, timestamp: 1000 + index })
    }

    expect(ConversationHistoryService.getHistory()).toHaveLength(20)
    expect(ConversationHistoryService.getStatus().historySize).toBe(20)
  })
})
