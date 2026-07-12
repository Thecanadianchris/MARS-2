/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Smoke Test:
 * MemoryCommandParserSmokeTest
 *
 * Purpose:
 * Verifies the v0.15.1 explicit person-tag parser and, critically,
 * that it NEVER matches the untagged owner-scoped "my …" commands
 * (which ChatPanel must keep handling exactly as before).
 *
 * Version:
 * v0.15.1
 * Date Code:
 * 120726
 * ==========================================================
 */

import { describe, expect, test } from 'vitest'
import {
  parsePersonMemoryWrite,
  parsePersonMemoryRecall,
} from '../services/memory/MemoryCommandParser'

describe('Person-tag write parsing', () => {
  test('parses "remember Finley\'s medication is 8pm"', () => {
    expect(parsePersonMemoryWrite("remember Finley's medication is 8pm")).toEqual({
      personName: 'Finley',
      key: 'medication',
      value: '8pm',
    })
  })

  test('handles the optional "that" and the "are" verb', () => {
    expect(parsePersonMemoryWrite("remember that Ann's appointments are on Tuesdays")).toEqual({
      personName: 'Ann',
      key: 'appointments',
      value: 'on Tuesdays',
    })
  })

  test('REGRESSION GUARD: does NOT match owner "remember my X is Y"', () => {
    expect(parsePersonMemoryWrite('remember my birthday is June 5th')).toBeNull()
    expect(parsePersonMemoryWrite('remember my favourite colour is red')).toBeNull()
  })

  test('ignores a non-possessive statement', () => {
    expect(parsePersonMemoryWrite('remember Finley is coming over')).toBeNull()
  })
})

describe('Person-tag recall parsing', () => {
  test('parses "what is Finley\'s medication"', () => {
    expect(parsePersonMemoryRecall("what is Finley's medication")).toEqual({
      personName: 'Finley',
      key: 'medication',
    })
  })

  test('handles the contracted "what\'s"', () => {
    expect(parsePersonMemoryRecall("what's Ann's dentist")).toEqual({
      personName: 'Ann',
      key: 'dentist',
    })
  })

  test('REGRESSION GUARD: does NOT match owner "what is my X"', () => {
    expect(parsePersonMemoryRecall('what is my favourite colour')).toBeNull()
    expect(parsePersonMemoryRecall("what's my birthday")).toBeNull()
  })
})
