/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Smoke Test:
 * ChatConversationBridgeSmokeTest
 *
 * Purpose:
 * Regression guard for the v0.14.3 ChatPanel <-> Natural
 * Conversation Engine bridge. The critical property under test:
 * ChatPanel's existing working memory commands and canned
 * replies must NEVER be shadowed by the engine's response, even
 * though the engine is now consulted on every turn.
 *
 * Version:
 * v0.14.3
 * Date Code:
 * 110726
 * ==========================================================
 */

import { describe, expect, test, beforeEach } from 'vitest'
import { NaturalConversationEngine } from '../services/conversation'
import {
  buildChatReply,
  isGenericFallback,
  shouldUseConversationResponse,
  GENERIC_FALLBACK_MARKER,
} from '../services/conversation/ChatConversationBridge'
import { CONVERSATION_PLAN_ACTIONS } from '../services/conversation/ConversationPlanner'

beforeEach(() => {
  NaturalConversationEngine.reset()
})

describe('Chat Conversation Bridge Smoke Test', () => {
  test('detects the generic fallback marker', () => {
    expect(isGenericFallback(`Understood, Christian. ${GENERIC_FALLBACK_MARKER}`)).toBe(true)
    expect(isGenericFallback('Hello Christian. MARS systems are online.')).toBe(false)
    expect(isGenericFallback(null)).toBe(false)
    expect(isGenericFallback(undefined)).toBe(false)
  })

  test('only overrides for the intended conversational plan actions', () => {
    expect(shouldUseConversationResponse(CONVERSATION_PLAN_ACTIONS.CANCEL_ACTION)).toBe(true)
    expect(shouldUseConversationResponse(CONVERSATION_PLAN_ACTIONS.CONTINUE_PREVIOUS_ACTION)).toBe(true)
    expect(shouldUseConversationResponse(CONVERSATION_PLAN_ACTIONS.ASK_CLARIFYING_QUESTION)).toBe(true)
    expect(shouldUseConversationResponse(CONVERSATION_PLAN_ACTIONS.ROUTE_TO_VISION)).toBe(true)
    expect(shouldUseConversationResponse(CONVERSATION_PLAN_ACTIONS.ROUTE_TO_MEMORY)).toBe(false)
    expect(shouldUseConversationResponse(CONVERSATION_PLAN_ACTIONS.ANSWER_NOW)).toBe(false)
    expect(shouldUseConversationResponse(CONVERSATION_PLAN_ACTIONS.ROUTE_TO_VOICE_COMMAND)).toBe(false)
  })

  test('REGRESSION GUARD: a specific local reply (e.g. real remembered fact) is never shadowed by the engine', () => {
    const localReply = 'Understood, Christian. I will remember that your birthday is June 5th.'
    const engineResult = NaturalConversationEngine.processTurn('remember my birthday is June 5th')

    // The engine's own memory branch is a placeholder — confirm the bridge
    // does not use it, and the real local reply survives untouched.
    expect(engineResult.plan.capability).toBe('memory')
    expect(buildChatReply({ localReply, engineResult })).toBe(localReply)
  })

  test('REGRESSION GUARD: specific canned replies (greeting, status) are never shadowed', () => {
    const greeting = 'Hello Christian. MARS systems are online and operating normally. How can I assist you today?'
    const status = 'Current system status.\n\nVoice interface: Online.'
    const engineResult = NaturalConversationEngine.processTurn('hello')

    expect(buildChatReply({ localReply: greeting, engineResult })).toBe(greeting)
    expect(buildChatReply({ localReply: status, engineResult })).toBe(status)
  })

  test('uses the engine response only when local reply is generic AND the plan action is in the override set', () => {
    const localReply = `Understood, Christian. ${GENERIC_FALLBACK_MARKER}`
    const engineResult = NaturalConversationEngine.processTurn('who do you see right now')

    expect(engineResult.plan.action).toBe(CONVERSATION_PLAN_ACTIONS.ROUTE_TO_VISION)
    const reply = buildChatReply({ localReply, engineResult })
    expect(reply).toBe(engineResult.response.summary)
    expect(reply).not.toBe(localReply)
  })

  test('falls back to the generic local reply when the plan action is not in the override set', () => {
    const localReply = `Understood, Christian. ${GENERIC_FALLBACK_MARKER}`
    const engineResult = NaturalConversationEngine.processTurn('remember something vague')

    expect(buildChatReply({ localReply, engineResult })).toBe(localReply)
  })

  test('handles a missing engine result gracefully', () => {
    const localReply = `Understood, Christian. ${GENERIC_FALLBACK_MARKER}`
    expect(buildChatReply({ localReply, engineResult: null })).toBe(localReply)
  })
})
