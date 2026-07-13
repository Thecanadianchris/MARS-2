/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Smoke Test:
 * BehaviourLearningSmokeTest
 *
 * Purpose:
 * Verifies the v0.15.5 Behaviour Learning engine: conversation +
 * behaviour inference into confirm-gated candidates, and the two
 * hard safety rules — inference NEVER creates a safety fact, and
 * NOTHING is stored until a human confirms. Includes the guard
 * that the conversation engine's per-turn observe() never stores a
 * fact or changes anything (ChatPanel stays the writer).
 *
 * Version:
 * v0.15.5
 * Date Code:
 * 120726
 * ==========================================================
 */

import { beforeEach, describe, expect, test } from 'vitest'
import MemoryIntelligenceService, { MEMORY_SOURCES } from '../services/memory/MemoryIntelligenceService'
import BehaviourLearningService from '../services/memory/BehaviourLearningService'
import { parseInferredFact } from '../services/memory/InferenceParser'
import { NaturalConversationEngine } from '../services/conversation'

beforeEach(() => {
  MemoryIntelligenceService.resetForTests()
  BehaviourLearningService.resetForTests()
  NaturalConversationEngine.reset()
})

describe('InferenceParser', () => {
  test('detects likes and routines from casual self-statements', () => {
    expect(parseInferredFact('I love gardening')).toEqual({ key: 'likes', value: 'gardening' })
    expect(parseInferredFact('I usually walk the dog at 7')).toEqual({ key: 'routine', value: 'walk the dog at 7' })
  })

  test('ignores explicit commands and unrelated messages', () => {
    expect(parseInferredFact('remember my birthday is June 5th')).toBeNull()
    expect(parseInferredFact('what is the capital of France')).toBeNull()
    expect(parseInferredFact('hello')).toBeNull()
  })
})

describe('Conversation inference → candidate', () => {
  test('observe proposes a confirm-gated candidate (nothing stored)', () => {
    const candidate = BehaviourLearningService.observe('I love gardening', { personId: 'christian' })

    expect(candidate.key).toBe('likes')
    expect(candidate.value).toBe('gardening')
    expect(candidate.sourceKind).toBe('conversation')
    expect(BehaviourLearningService.listCandidates('christian')).toHaveLength(1)
    // not stored until confirmed
    expect(MemoryIntelligenceService.getStatus().entryCount).toBe(0)
  })

  test('HARD RULE: a safety-flavoured inference is refused, never proposed', () => {
    const result = BehaviourLearningService.observe('I usually take my medication at 8pm', { personId: 'finley' })

    expect(result.refused).toBe(true)
    expect(result.reason).toBe('safety')
    expect(BehaviourLearningService.getStatus().candidateCount).toBe(0)
  })
})

describe('Confirm / reject', () => {
  test('confirm writes an inferred, lower-confidence fact', () => {
    const candidate = BehaviourLearningService.observe('I love gardening', { personId: 'christian' })
    BehaviourLearningService.confirmCandidate(candidate.id)

    const entry = MemoryIntelligenceService.getEntry('likes', { personId: 'christian' })
    expect(entry.value).toBe('gardening')
    expect(entry.source).toBe(MEMORY_SOURCES.INFERRED)
    expect(entry.confidence).toBeLessThan(1)
    // candidate consumed
    expect(BehaviourLearningService.listCandidates('christian')).toHaveLength(0)
  })

  test('reject discards without storing', () => {
    const candidate = BehaviourLearningService.observe('I love gardening', { personId: 'christian' })
    BehaviourLearningService.rejectCandidate(candidate.id)

    expect(BehaviourLearningService.listCandidates('christian')).toHaveLength(0)
    expect(MemoryIntelligenceService.recall('likes', { personId: 'christian' })).toBeUndefined()
  })
})

describe('Behaviour-engine inference (aggregated)', () => {
  test('proposes a candidate only after the same signal repeats to threshold', () => {
    const result = { profile: { personId: 'finley' }, observationStream: { bodyPosition: 'sitting' } }

    expect(BehaviourLearningService.observeBehaviour(result)).toBeNull() // 1
    expect(BehaviourLearningService.observeBehaviour(result)).toBeNull() // 2
    const candidate = BehaviourLearningService.observeBehaviour(result) // 3 = threshold

    expect(candidate.key).toBe('usual body position')
    expect(candidate.value).toBe('sitting')
    expect(candidate.sourceKind).toBe('behaviour')
  })

  test('skips unknown person and unknown position', () => {
    expect(
      BehaviourLearningService.observeBehaviour({ profile: { personId: 'unknown-person' }, observationStream: { bodyPosition: 'sitting' } })
    ).toBeNull()
    expect(
      BehaviourLearningService.observeBehaviour({ profile: { personId: 'finley' }, observationStream: { bodyPosition: 'unknown' } })
    ).toBeNull()
  })
})

describe('REGRESSION GUARD: observation is silent', () => {
  test('processTurn on an inferrable message proposes a candidate but stores no fact', () => {
    NaturalConversationEngine.processTurn('I love gardening')

    // A candidate was proposed for the active (owner) person...
    expect(BehaviourLearningService.getStatus().candidateCount).toBe(1)
    // ...but nothing was written to long-term memory.
    expect(MemoryIntelligenceService.getStatus().entryCount).toBe(0)
  })
})
