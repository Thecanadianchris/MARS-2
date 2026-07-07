/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Smoke Test:
 * ConversationContextSmokeTest
 *
 * Purpose:
 * Verifies v0.14.2 short-term conversation context building.
 *
 * Version:
 * v0.14.2
 * Date Code:
 * 070726
 * ==========================================================
 */

import { beforeEach, describe, expect, test } from 'vitest'
import { ConversationContextService } from '../services/conversation'

beforeEach(() => {
  ConversationContextService.clearContext()
})

describe('Conversation Context Smoke Test', () => {
  test('infers a known person from current message', () => {
    const context = ConversationContextService.buildContext({ userMessage: 'what is Christian doing' })

    expect(context.currentPerson).toBe('Christian')
    expect(context.currentSubject).toBe('Christian')
  })

  test('infers a location from current message', () => {
    const context = ConversationContextService.buildContext({ userMessage: 'check the kitchen' })

    expect(context.currentLocation).toBe('kitchen')
  })

  test('keeps conversation context separate from persistent memory', () => {
    ConversationContextService.buildContext({ userMessage: 'remember this later' })

    expect(ConversationContextService.getStatus().persistentMemory).toBe(false)
  })
})
