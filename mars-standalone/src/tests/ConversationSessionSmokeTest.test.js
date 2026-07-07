/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Smoke Test:
 * ConversationSessionSmokeTest
 *
 * Purpose:
 * Verifies v0.14.2 short-lived natural conversation sessions.
 *
 * Version:
 * v0.14.2
 * Date Code:
 * 070726
 * ==========================================================
 */

import { beforeEach, describe, expect, test } from 'vitest'
import { ConversationSessionService, CONVERSATION_SESSION_STATUS } from '../services/conversation'

beforeEach(() => {
  ConversationSessionService.clearSession()
})

describe('Conversation Session Smoke Test', () => {
  test('creates an active conversation session', () => {
    const session = ConversationSessionService.startSession({ timestamp: 1000, activeTopic: 'voice' })

    expect(session.status).toBe(CONVERSATION_SESSION_STATUS.ACTIVE)
    expect(session.activeTopic).toBe('voice')
    expect(session.version).toBe('v0.14.2')
  })

  test('reuses an active session before timeout', () => {
    ConversationSessionService.startSession({ timestamp: 1000 })
    const session = ConversationSessionService.getOrCreateSession({ timestamp: 2000 })

    expect(session.id).toBe('conversation-1000')
    expect(session.turnCount).toBe(1)
  })

  test('reports expired sessions after timeout', () => {
    ConversationSessionService.startSession({ timestamp: 1000, timeoutMs: 100 })

    expect(ConversationSessionService.isExpired(1200)).toBe(true)
    expect(ConversationSessionService.getStatus(1200).sessionExpired).toBe(true)
  })
})
