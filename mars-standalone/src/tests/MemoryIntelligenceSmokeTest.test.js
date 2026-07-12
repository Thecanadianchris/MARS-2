/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Smoke Test:
 * MemoryIntelligenceSmokeTest
 *
 * Purpose:
 * Verifies the v0.15 Memory Intelligence Foundation store and,
 * critically, that absorbing the old Notes store did NOT regress
 * the behaviour ChatPanel and Control.jsx depend on. The shim
 * (components/mars/memory.js) must expose the exact same
 * remember / recall / recallAll / clearMemory contract as before.
 *
 * Runs in vitest's node environment (no localStorage), so the
 * service uses its in-memory fallback — the same code path as the
 * browser, minus persistence.
 *
 * Version:
 * v0.15
 * Date Code:
 * 120726
 * ==========================================================
 */

import { beforeEach, describe, expect, test } from 'vitest'
import MemoryIntelligenceService, {
  buildEntriesFromLegacy,
  MEMORY_CATEGORIES,
  MEMORY_SOURCES,
} from '../services/memory/MemoryIntelligenceService'
import {
  remember,
  recall,
  recallAll,
  clearMemory,
} from '../components/mars/memory'

beforeEach(() => {
  MemoryIntelligenceService.resetForTests()
})

describe('Memory Intelligence Service Smoke Test', () => {
  test('remember then recall round-trips a value', () => {
    MemoryIntelligenceService.remember('birthday', 'June 5th')
    expect(MemoryIntelligenceService.recall('birthday')).toBe('June 5th')
  })

  test('keys are normalised (trimmed + lowercased)', () => {
    MemoryIntelligenceService.remember('  Favourite Colour  ', 'red')
    expect(MemoryIntelligenceService.recall('favourite colour')).toBe('red')
  })

  test('getEntry returns the full v0.15 schema with Foundation defaults', () => {
    MemoryIntelligenceService.remember('name', 'Christian')
    const entry = MemoryIntelligenceService.getEntry('name')

    expect(entry.value).toBe('Christian')
    expect(entry.category).toBe(MEMORY_CATEGORIES.UNCATEGORISED)
    expect(entry.source).toBe(MEMORY_SOURCES.USER_EXPLICIT)
    expect(entry.confidence).toBe(1.0)
    expect(entry.createdAt).toBeTruthy()
    expect(entry.updatedAt).toBeTruthy()
  })

  test('updating a key preserves createdAt and refreshes the value', () => {
    MemoryIntelligenceService.remember('city', 'London')
    const first = MemoryIntelligenceService.getEntry('city')
    MemoryIntelligenceService.remember('city', 'Toronto')
    const second = MemoryIntelligenceService.getEntry('city')

    expect(second.value).toBe('Toronto')
    expect(second.createdAt).toBe(first.createdAt)
  })

  test('getStatus reports live persistent memory and counts', () => {
    MemoryIntelligenceService.remember('a', '1')
    MemoryIntelligenceService.remember('b', '2')
    const status = MemoryIntelligenceService.getStatus()

    expect(status.persistentMemory).toBe(true)
    expect(status.entryCount).toBe(2)
    expect(status.personCount).toBe(1)
    expect(status.personScoped).toBe(true)
    expect(status.medicalDiagnosis).toBe(false)
    expect(status.version).toBe('v0.15.1')
  })

  test('clearMemory empties the store', () => {
    MemoryIntelligenceService.remember('a', '1')
    MemoryIntelligenceService.clearMemory()
    expect(MemoryIntelligenceService.getStatus().entryCount).toBe(0)
  })
})

describe('Legacy migration (loss-free)', () => {
  test('buildEntriesFromLegacy converts a flat map without losing anything', () => {
    const legacy = { birthday: 'June 5th', 'favourite colour': 'red', name: 'Christian' }
    const entries = buildEntriesFromLegacy(legacy)

    expect(Object.keys(entries)).toHaveLength(3)
    expect(entries.birthday.value).toBe('June 5th')
    expect(entries.name.source).toBe(MEMORY_SOURCES.USER_EXPLICIT)
    expect(entries.name.confidence).toBe(1.0)
  })

  test('migration normalises keys and skips empty keys', () => {
    const legacy = { '  Pet  ': 'dog', '': 'ignored' }
    const entries = buildEntriesFromLegacy(legacy)

    expect(entries.pet.value).toBe('dog')
    expect(Object.keys(entries)).toHaveLength(1)
  })

  test('migration handles a null/garbage legacy map safely', () => {
    expect(buildEntriesFromLegacy(null)).toEqual({})
    expect(buildEntriesFromLegacy(undefined)).toEqual({})
    expect(buildEntriesFromLegacy('nonsense')).toEqual({})
  })
})

describe('Person-scoped memory (v0.15.1)', () => {
  test('remembers facts for different people independently', () => {
    MemoryIntelligenceService.remember('medication', '8pm', { personId: 'finley' })
    MemoryIntelligenceService.remember('favourite colour', 'red') // owner/default

    expect(MemoryIntelligenceService.recall('medication', { personId: 'finley' })).toBe('8pm')
    // owner scope must NOT see finley's fact
    expect(MemoryIntelligenceService.recall('medication')).toBeUndefined()
    expect(MemoryIntelligenceService.recall('favourite colour')).toBe('red')
  })

  test('is unbounded — any number of people get their own scope', () => {
    ;['finley', 'ann', 'christian', 'bob', 'dana'].forEach((p, i) =>
      MemoryIntelligenceService.remember('note', String(i), { personId: p })
    )
    expect(MemoryIntelligenceService.getStatus().personCount).toBe(5)
  })

  test('listPersonsWithMemory reports per-person counts', () => {
    MemoryIntelligenceService.remember('a', '1', { personId: 'finley' })
    MemoryIntelligenceService.remember('b', '2', { personId: 'finley' })
    MemoryIntelligenceService.remember('c', '3', { personId: 'ann' })

    const finley = MemoryIntelligenceService.listPersonsWithMemory().find((p) => p.personId === 'finley')
    expect(finley.entryCount).toBe(2)
  })

  test('clearMemory clears only the target person; clearAllPersons wipes everything', () => {
    MemoryIntelligenceService.remember('a', '1', { personId: 'finley' })
    MemoryIntelligenceService.remember('b', '2', { personId: 'ann' })

    MemoryIntelligenceService.clearMemory({ personId: 'finley' })
    expect(MemoryIntelligenceService.recall('a', { personId: 'finley' })).toBeUndefined()
    expect(MemoryIntelligenceService.recall('b', { personId: 'ann' })).toBe('2')

    MemoryIntelligenceService.clearAllPersons()
    expect(MemoryIntelligenceService.getStatus().personCount).toBe(0)
  })

  test('active person overrides default resolution (face-recognition hook)', () => {
    MemoryIntelligenceService.setActivePerson('finley')
    MemoryIntelligenceService.remember('mood', 'calm') // no personId → active person = finley
    expect(MemoryIntelligenceService.recall('mood', { personId: 'finley' })).toBe('calm')

    MemoryIntelligenceService.setActivePerson(null)
    expect(MemoryIntelligenceService.recall('mood')).toBeUndefined() // back to owner scope
  })
})

describe('REGRESSION GUARD: memory.js shim preserves the old contract', () => {
  test('remember + recall through the shim behave exactly as before', () => {
    remember('birthday', 'June 5th')
    expect(recall('birthday')).toBe('June 5th')
    // unknown keys return undefined, same as the old flat store
    expect(recall('nothing stored')).toBeUndefined()
  })

  test('recallAll returns a flat { key: value } map (Notes tab + Control.jsx contract)', () => {
    remember('name', 'Christian')
    remember('city', 'Toronto')
    const all = recallAll()

    // Exactly the shape NotesPanel does Object.entries(memory) over.
    expect(all).toEqual({ name: 'Christian', city: 'Toronto' })
  })

  test('clearMemory through the shim empties the store', () => {
    remember('a', '1')
    clearMemory()
    expect(recallAll()).toEqual({})
  })

  test('shim and service share one store (writing via shim is visible to the service)', () => {
    remember('shared', 'yes')
    expect(MemoryIntelligenceService.recall('shared')).toBe('yes')
  })
})
