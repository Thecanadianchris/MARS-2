/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Smoke Test:
 * WorkingMemorySmokeTest
 *
 * Purpose:
 * Verifies the v0.15.2 Short-Term Memory Engine: seeding the
 * session working set from a person's long-term facts, noting
 * short-term items, and promoting them back to long-term through
 * a real CapabilityRouter memory-write dispatch. Includes the
 * REGRESSION GUARD that the conversation engine's per-turn
 * processing never writes to long-term (ChatPanel stays the sole
 * automatic writer for typed chat).
 *
 * Version:
 * v0.15.2
 * Date Code:
 * 120726
 * ==========================================================
 */

import { beforeEach, describe, expect, test } from 'vitest'
import MemoryIntelligenceService from '../services/memory/MemoryIntelligenceService'
import WorkingMemoryService, { ITEM_ORIGIN } from '../services/memory/WorkingMemoryService'
import CapabilityRouter from '../services/conversation/CapabilityRouter'
import { NaturalConversationEngine } from '../services/conversation'

beforeEach(() => {
  MemoryIntelligenceService.resetForTests()
  WorkingMemoryService.resetForTests()
  NaturalConversationEngine.reset()
})

describe('Working Memory — seed from long-term', () => {
  test('seeds the active person\'s long-term facts into the working set', () => {
    MemoryIntelligenceService.remember('medication', '8pm', { personId: 'finley' })
    MemoryIntelligenceService.remember('safe word', 'bluebird', { personId: 'finley' })

    WorkingMemoryService.seedForPerson('finley')
    const status = WorkingMemoryService.getStatus()

    expect(status.personId).toBe('finley')
    expect(status.seededCount).toBe(2)
    const medication = WorkingMemoryService.getWorkingSet().find((i) => i.key === 'medication')
    expect(medication.origin).toBe(ITEM_ORIGIN.LONG_TERM)
    expect(medication.promoted).toBe(true)
  })

  test('another person\'s facts are not seeded', () => {
    MemoryIntelligenceService.remember('medication', '8pm', { personId: 'finley' })
    MemoryIntelligenceService.remember('favourite colour', 'red', { personId: 'christian' })

    WorkingMemoryService.seedForPerson('finley')
    expect(WorkingMemoryService.getWorkingSet().map((i) => i.key)).toEqual(['medication'])
  })
})

describe('Working Memory — note and promote', () => {
  test('note adds a working-only item that is NOT persisted', () => {
    WorkingMemoryService.seedForPerson('finley')
    WorkingMemoryService.note('mood', 'calm')

    const item = WorkingMemoryService.getWorkingSet().find((i) => i.key === 'mood')
    expect(item.origin).toBe(ITEM_ORIGIN.WORKING)
    expect(item.promoted).toBe(false)
    // not yet in long-term
    expect(MemoryIntelligenceService.recall('mood', { personId: 'finley' })).toBeUndefined()
  })

  test('promote writes the working item to long-term via CapabilityRouter', () => {
    WorkingMemoryService.seedForPerson('finley')
    WorkingMemoryService.note('mood', 'calm')

    const result = WorkingMemoryService.promote('mood', { personId: 'finley' })

    expect(result.action).toBe('memory-write')
    expect(result.status).toBe('stored')
    expect(MemoryIntelligenceService.recall('mood', { personId: 'finley' })).toBe('calm')

    const status = WorkingMemoryService.getStatus()
    expect(status.promotedCount).toBeGreaterThanOrEqual(1)
    expect(status.lastPromotion.key).toBe('mood')
  })

  test('noteAndPromote persists in one call', () => {
    WorkingMemoryService.noteAndPromote('allergy', 'penicillin', { personId: 'ann' })
    expect(MemoryIntelligenceService.recall('allergy', { personId: 'ann' })).toBe('penicillin')
  })
})

describe('CapabilityRouter memory-write dispatch (v0.15.2)', () => {
  test('a memory write plan stores to the target person', () => {
    const result = CapabilityRouter.route({
      plan: { capability: 'memory', memoryOp: 'write', payload: { key: 'pet', value: 'dog', personId: 'finley' } },
    })

    expect(result.action).toBe('memory-write')
    expect(result.status).toBe('stored')
    expect(MemoryIntelligenceService.recall('pet', { personId: 'finley' })).toBe('dog')
  })

  test('a memory read plan still returns a read (no write)', () => {
    const result = CapabilityRouter.route({ plan: { capability: 'memory' } })
    expect(result.action).toBe('memory-read')
  })
})

describe('REGRESSION GUARD: the conversation engine never writes long-term memory', () => {
  test('processTurn on a memory-style message stores nothing (ChatPanel stays the writer)', () => {
    NaturalConversationEngine.processTurn('remember my secret code is 4242')

    // The engine may seed/read working memory, but it must not persist anything.
    expect(MemoryIntelligenceService.getStatus().entryCount).toBe(0)
  })
})
