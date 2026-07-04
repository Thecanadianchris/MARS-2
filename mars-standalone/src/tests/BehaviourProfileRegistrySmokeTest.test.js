/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Smoke Test:
 * BehaviourProfileRegistrySmokeTest
 *
 * Purpose:
 * Verifies v0.13.8 user-extensible behaviour profiles.
 *
 * Version:
 * v0.13.8
 * Date Code:
 * 040726
 * ==========================================================
 */

import { describe, expect, test } from 'vitest'
import {
  BEHAVIOUR_CONCERN_LEVELS,
  BehaviourProfileMatcher,
  BehaviourProfileRegistry,
  BODY_POSITIONS,
  HEAD_DIRECTIONS,
  MOVEMENT_STATES
} from '../services/behaviour'

describe('Behaviour Profile Registry Smoke Test', () => {
  test('includes user-extensible behaviour profiles such as laying in bed', () => {
    const profiles = BehaviourProfileRegistry.listProfiles()
    const labels = profiles.map((profile) => profile.label.toLowerCase())

    expect(labels).toContain('laying in bed')
    expect(labels).toContain('lying on sofa')
  })

  test('allows a user-defined behaviour profile to be added safely', () => {
    const profile = BehaviourProfileRegistry.addProfile({
      id: 'test-pacing-profile',
      label: 'Pacing in hallway',
      description: 'User-defined pacing behaviour label.',
      normal: false,
      concernLevel: BEHAVIOUR_CONCERN_LEVELS.LOW,
      conditions: {
        bodyPositions: [BODY_POSITIONS.STANDING],
        movementStates: [MOVEMENT_STATES.MOVING],
        contexts: ['hallway']
      }
    })

    expect(profile.label).toBe('Pacing in hallway')
    expect(profile.conditions.contexts).toContain('hallway')

    BehaviourProfileRegistry.resetDefaults()
  })

  test('matches laying in bed without treating it as a medical diagnosis', () => {
    const match = BehaviourProfileMatcher.match(
      {
        bodyPosition: BODY_POSITIONS.LYING,
        headDirection: HEAD_DIRECTIONS.FORWARD,
        movementState: MOVEMENT_STATES.STILL
      },
      {
        contexts: ['bed', 'bedroom', 'night']
      }
    )

    expect(match.matched).toBe(true)
    expect(match.profile.label).toBe('Laying in bed')
    expect(match.profile.normal).toBe(true)

    const output = JSON.stringify(match).toLowerCase()
    expect(output).not.toContain('diagnosis')
    expect(output).not.toContain('diagnosed')
    expect(output).not.toContain('seizure detected')
  })
})
