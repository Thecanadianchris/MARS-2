/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Smoke Test:
 * ReferenceResolverSmokeTest
 *
 * Purpose:
 * Verifies simple v0.14.2 reference resolution.
 *
 * Version:
 * v0.14.2
 * Date Code:
 * 070726
 * ==========================================================
 */

import { describe, expect, test } from 'vitest'
import { ReferenceResolver, REFERENCE_TYPES } from '../services/conversation'

describe('Reference Resolver Smoke Test', () => {
  test('resolves pronouns against current person', () => {
    const result = ReferenceResolver.resolve('what is he doing', { currentPerson: 'Christian' })

    expect(result.referenceType).toBe(REFERENCE_TYPES.PRONOUN)
    expect(result.resolvedTarget).toBe('Christian')
    expect(result.confidence).toBeGreaterThan(0.7)
  })

  test('resolves repeat language against last intent', () => {
    const result = ReferenceResolver.resolve('do that again', { lastIntent: 'VISION_DESCRIBE_SCENE' })

    expect(result.referenceType).toBe(REFERENCE_TYPES.REPEAT)
    expect(result.resolvedTarget).toBe('VISION_DESCRIBE_SCENE')
  })

  test('resolves cancel language safely', () => {
    const result = ReferenceResolver.resolve('cancel that')

    expect(result.referenceType).toBe(REFERENCE_TYPES.CANCELLATION)
    expect(result.resolvedTarget).toBe('cancel-current-action')
  })
})
