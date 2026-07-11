/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Smoke Test:
 * ChatReasoningBridgeSmokeTest
 *
 * Purpose:
 * Regression guard for the v0.14.4 chat → AI reasoning
 * escalation. The critical property under test: only turns
 * where ChatPanel had nothing specific to say (the generic
 * fallback) may be escalated to an AI provider. Real memory
 * commands and canned replies must NEVER reach any AI tier or
 * be shadowed by one — same structural guarantee as v0.14.3.
 *
 * Version:
 * v0.14.4
 * Date Code:
 * 110726
 * ==========================================================
 */

import { describe, expect, test, vi } from 'vitest'
import { GENERIC_FALLBACK_MARKER } from '../services/conversation/ChatConversationBridge'
import {
  buildReasonedChatReply,
  shouldEscalateToReasoning,
} from '../services/conversation/ChatReasoningBridge'

const GENERIC_REPLY = `Understood, Christian. ${GENERIC_FALLBACK_MARKER}`

describe('Chat Reasoning Bridge Smoke Test (v0.14.4)', () => {
  test('only the generic fallback qualifies for escalation', () => {
    expect(shouldEscalateToReasoning(GENERIC_REPLY)).toBe(true)
    expect(shouldEscalateToReasoning('Your birthday is June 5th, Christian.')).toBe(false)
    expect(shouldEscalateToReasoning(null)).toBe(false)
  })

  test('REGRESSION GUARD: a real memory reply is returned untouched and no AI provider is ever consulted', async () => {
    const reasoningService = { reason: vi.fn() }
    const memoryReply = 'Understood, Christian. I will remember that your birthday is June 5th.'

    const result = await buildReasonedChatReply({
      bridgedReply: memoryReply,
      content: 'remember my birthday is June 5th',
      reasoningService,
    })

    expect(result.reply).toBe(memoryReply)
    expect(result.escalated).toBe(false)
    expect(reasoningService.reason).not.toHaveBeenCalled()
  })

  test('a generic-fallback turn escalates and uses the AI answer', async () => {
    const reasoningService = {
      reason: vi.fn(async () => ({
        status: 'success',
        provider: 'HOME_AI_SERVER',
        model: 'qwen3.5:4b',
        response: 'The capital of France is Paris, Christian.',
      })),
    }

    const result = await buildReasonedChatReply({
      bridgedReply: GENERIC_REPLY,
      content: 'what is the capital of France',
      reasoningService,
    })

    expect(result.reply).toBe('The capital of France is Paris, Christian.')
    expect(result.escalated).toBe(true)
    expect(result.provider).toBe('HOME_AI_SERVER')
    expect(reasoningService.reason).toHaveBeenCalledWith({ prompt: 'what is the capital of France' })
  })

  test('keeps the generic reply when every AI tier is unavailable', async () => {
    const reasoningService = {
      reason: vi.fn(async () => ({ status: 'unavailable', provider: 'NONE', response: null })),
    }

    const result = await buildReasonedChatReply({
      bridgedReply: GENERIC_REPLY,
      content: 'what is the capital of France',
      reasoningService,
    })

    expect(result.reply).toBe(GENERIC_REPLY)
    expect(result.escalated).toBe(false)
  })

  test('REGRESSION GUARD: a throwing reasoning service never breaks chat', async () => {
    const reasoningService = {
      reason: vi.fn(async () => {
        throw new Error('network exploded')
      }),
    }

    const result = await buildReasonedChatReply({
      bridgedReply: GENERIC_REPLY,
      content: 'anything',
      reasoningService,
    })

    expect(result.reply).toBe(GENERIC_REPLY)
    expect(result.escalated).toBe(false)
  })
})
