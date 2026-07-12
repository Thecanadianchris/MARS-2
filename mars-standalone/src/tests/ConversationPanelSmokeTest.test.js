/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Smoke Test:
 * ConversationPanelSmokeTest
 *
 * Purpose:
 * Verifies the v0.14.2 Conversation Panel state model (the data
 * useConversationIntelligence exposes to ConversationPanel)
 * without browser rendering dependencies.
 *
 * Version:
 * v0.14.2
 * Date Code:
 * 110726
 * ==========================================================
 */

import { describe, expect, test, beforeEach } from 'vitest'
import { NaturalConversationEngine } from '../services/conversation'

beforeEach(() => {
  NaturalConversationEngine.reset()
})

describe('Conversation Panel Smoke Test', () => {
  test('idle status snapshot matches the shape the panel reads', () => {
    const snapshot = NaturalConversationEngine.getStatus()

    expect(snapshot.version).toBe('v0.14.2')
    expect(snapshot.service).toBe('NaturalConversationEngine')
    expect(snapshot.session).toBeTruthy()
    expect(snapshot.history).toBeTruthy()
    expect(snapshot.context).toBeTruthy()
    expect(snapshot.persistentMemory).toBe(false)
    expect(snapshot.liveAudio).toBe(false)
    expect(snapshot.medicalDiagnosis).toBe(false)
  })

  test('sending a turn produces a plan, response and updated metrics the panel displays', () => {
    const result = NaturalConversationEngine.processTurn('who do you see right now')

    expect(result.plan.capability).toBe('vision')
    expect(result.plan.action).toBe('route_to_vision')
    expect(result.response.title).toBe('Vision Conversation Request')
    expect(result.response.naturalConversation).toBe(true)

    const snapshot = NaturalConversationEngine.getStatus()
    expect(snapshot.session.conversationActive).toBe(true)
    expect(snapshot.history.historySize).toBeGreaterThan(0)
  })

  test('memory-routed turn surfaces the live store but the engine still does not write memory', () => {
    const result = NaturalConversationEngine.processTurn('remember my name is Christian')

    expect(result.plan.capability).toBe('memory')
    // v0.15: memory now exists app-side, so the engine reports it honestly...
    expect(result.response.title).toBe('Memory Intelligence Online')
    expect(result.response.memoryStoreActive).toBe(true)
    // ...but engine-driven writes are deferred to v0.15.1, so this stays false.
    expect(result.persistentMemory).toBe(false)
  })

  test('reset clears session, history and context back to idle', () => {
    NaturalConversationEngine.processTurn('who do you see right now')
    NaturalConversationEngine.reset()

    const snapshot = NaturalConversationEngine.getStatus()
    expect(snapshot.session.conversationActive).toBe(false)
    expect(snapshot.history.historySize).toBe(0)
  })
})
