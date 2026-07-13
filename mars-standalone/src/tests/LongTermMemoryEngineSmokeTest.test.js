/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Smoke Test:
 * LongTermMemoryEngineSmokeTest
 *
 * Purpose:
 * Verifies the v0.15.3 Long-Term Memory Engine: heuristic
 * categorisation (incl. the care-critical `safety` category),
 * access-based salience ranking, and the SAFETY-aware retention
 * policy. Critically, it guards that explicit and safety facts are
 * NEVER auto-forgotten — the core safety property for a care system.
 *
 * Version:
 * v0.15.3
 * Date Code:
 * 120726
 * ==========================================================
 */

import { beforeEach, describe, expect, test } from 'vitest'
import MemoryIntelligenceService, { MEMORY_SOURCES } from '../services/memory/MemoryIntelligenceService'
import LongTermMemoryEngine from '../services/memory/LongTermMemoryEngine'
import { classify, MEMORY_CATEGORY } from '../services/memory/MemoryClassifier'

beforeEach(() => {
  MemoryIntelligenceService.resetForTests()
})

describe('Heuristic classification', () => {
  test('flags care-critical facts as safety', () => {
    expect(classify('medication', '8pm')).toBe(MEMORY_CATEGORY.SAFETY)
    expect(classify('allergy', 'penicillin')).toBe(MEMORY_CATEGORY.SAFETY)
    expect(classify('emergency contact', 'Ann 07…')).toBe(MEMORY_CATEGORY.SAFETY)
    expect(classify('safe word', 'bluebird')).toBe(MEMORY_CATEGORY.SAFETY)
  })

  test('value can trigger safety even when the key does not', () => {
    expect(classify('note', 'give insulin at 8pm')).toBe(MEMORY_CATEGORY.SAFETY)
  })

  test('classifies preference, personal and fact', () => {
    expect(classify('favourite colour', 'red')).toBe(MEMORY_CATEGORY.PREFERENCE)
    expect(classify('birthday', 'June 5th')).toBe(MEMORY_CATEGORY.PERSONAL)
    expect(classify('parking spot', 'level 3')).toBe(MEMORY_CATEGORY.FACT)
  })

  test('new writes are auto-classified by the store', () => {
    MemoryIntelligenceService.remember('medication', '8pm', { personId: 'finley' })
    expect(MemoryIntelligenceService.getEntry('medication', { personId: 'finley' }).category).toBe(
      MEMORY_CATEGORY.SAFETY
    )
  })
})

describe('categoriseAll backfill', () => {
  test('re-classifies entries left uncategorised by older versions', () => {
    MemoryIntelligenceService.remember('medication', '8pm', { personId: 'finley', category: 'uncategorised' })
    const updated = LongTermMemoryEngine.categoriseAll('finley')

    expect(updated).toBe(1)
    expect(MemoryIntelligenceService.getEntry('medication', { personId: 'finley' }).category).toBe(
      MEMORY_CATEGORY.SAFETY
    )
  })
})

describe('Access tracking + salience', () => {
  test('recall bumps access count', () => {
    MemoryIntelligenceService.remember('parking spot', 'level 3', { personId: 'christian' })
    MemoryIntelligenceService.recall('parking spot', { personId: 'christian' })
    MemoryIntelligenceService.recall('parking spot', { personId: 'christian' })

    expect(MemoryIntelligenceService.getEntry('parking spot', { personId: 'christian' }).accessCount).toBe(2)
  })

  test('safety facts rank above everyday facts', () => {
    MemoryIntelligenceService.remember('parking spot', 'level 3', { personId: 'finley' })
    MemoryIntelligenceService.remember('medication', '8pm', { personId: 'finley' })

    const ranked = LongTermMemoryEngine.getRankedEntriesForPerson('finley')
    expect(ranked[0].key).toBe('medication')
    expect(ranked[0].category).toBe(MEMORY_CATEGORY.SAFETY)
  })
})

describe('Retention — safety-aware, conservative', () => {
  test('all explicit facts are protected; nothing is eligible to forget', () => {
    MemoryIntelligenceService.remember('medication', '8pm', { personId: 'finley' })
    MemoryIntelligenceService.remember('parking spot', 'level 3', { personId: 'finley' })

    const report = LongTermMemoryEngine.getRetentionReport('finley')
    expect(report.total).toBe(2)
    expect(report.protectedCount).toBe(2)
    expect(report.eligibleToForget).toBe(0)
    expect(report.safetyCount).toBe(1)
  })

  test('REGRESSION GUARD: an armed retention pass never prunes explicit facts', () => {
    MemoryIntelligenceService.remember('parking spot', 'level 3', { personId: 'finley' })

    // Armed (dryRun false) and maximally aggressive (maxAgeDays -1) — yet the
    // explicit fact is protected and survives.
    const result = LongTermMemoryEngine.runRetention({ personId: 'finley', maxAgeDays: -1, dryRun: false })

    expect(result.prunedCount).toBe(0)
    expect(MemoryIntelligenceService.recall('parking spot', { personId: 'finley' })).toBe('level 3')
  })

  test('a safety fact is protected even when it is inferred', () => {
    MemoryIntelligenceService.remember('allergy', 'nuts', {
      personId: 'ann',
      source: MEMORY_SOURCES.INFERRED,
    })

    const result = LongTermMemoryEngine.runRetention({ personId: 'ann', maxAgeDays: -1, dryRun: false })
    expect(result.prunedCount).toBe(0)
    expect(MemoryIntelligenceService.recall('allergy', { personId: 'ann' })).toBe('nuts')
  })

  test('only an inferred, non-safety fact is eligible and can be pruned when armed', () => {
    MemoryIntelligenceService.remember('overheard', 'something', {
      personId: 'ann',
      source: MEMORY_SOURCES.INFERRED,
    })

    const eligible = LongTermMemoryEngine.getEligibleForRetention('ann', { maxAgeDays: -1 })
    expect(eligible.map((e) => e.key)).toContain('overheard')

    const result = LongTermMemoryEngine.runRetention({ personId: 'ann', maxAgeDays: -1, dryRun: false })
    expect(result.prunedCount).toBe(1)
    expect(MemoryIntelligenceService.recall('overheard', { personId: 'ann' })).toBeUndefined()
  })

  test('default runRetention is a dry-run no-op', () => {
    MemoryIntelligenceService.remember('x', '1', { personId: 'ann', source: MEMORY_SOURCES.INFERRED })
    const result = LongTermMemoryEngine.runRetention()

    expect(result.dryRun).toBe(true)
    expect(result.prunedCount).toBe(0)
    expect(MemoryIntelligenceService.recall('x', { personId: 'ann' })).toBe('1')
  })
})
