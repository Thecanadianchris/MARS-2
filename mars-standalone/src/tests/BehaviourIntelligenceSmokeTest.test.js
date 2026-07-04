/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Smoke Test:
 * BehaviourIntelligenceSmokeTest
 *
 * Purpose:
 * Verifies the v0.13.3 Behaviour Intelligence Foundation.
 * Behaviour Intelligence observes body position, head direction,
 * movement and inactivity signs for assistive alerting.
 *
 * These tests ensure MARS does not diagnose medical conditions.
 *
 * Version:
 * v0.13.3
 *
 * Date Code:
 * 040726
 * ==========================================================
 */

import { describe, expect, test } from 'vitest'
import {
  BEHAVIOUR_ACTIONS,
  BEHAVIOUR_CONCERN_LEVELS,
  BehaviourPatternEngine,
  BODY_POSITIONS,
  HEAD_DIRECTIONS,
  MOVEMENT_STATES
} from '../services/behaviour'

describe('Behaviour Intelligence Smoke Test', () => {
  test('handles missing behaviour input safely', () => {
    const result = BehaviourPatternEngine.evaluate(null)

    expect(result.status).toBe('success')
    expect(result.observationStream.bodyPosition).toBe(BODY_POSITIONS.UNKNOWN)
    expect(result.risk.concernLevel).toBe(BEHAVIOUR_CONCERN_LEVELS.NONE)
    expect(result.decisionHint.recommendedAction).toBe(BEHAVIOUR_ACTIONS.OBSERVE)
  })

  test('flags floor position as an assistive concern observation', () => {
    const result = BehaviourPatternEngine.evaluate({
      perceptionResult: {
        bodyPosition: BODY_POSITIONS.FLOOR,
        movementState: MOVEMENT_STATES.STILL
      }
    })

    expect(result.risk.score).toBeGreaterThan(0)
    expect(result.risk.reasons).toContain('Person appears to be on the floor.')
    expect(result.summary).toContain('body=floor')
  })

  test('increases priority for protected users with unusual head direction', () => {
    const result = BehaviourPatternEngine.evaluate({
      identityResult: {
        protected: true,
        profile: {
          id: 'finley',
          displayName: 'Finley',
          protected: true
        }
      },
      perceptionResult: {
        headDirection: HEAD_DIRECTIONS.UP_LEFT,
        movementState: MOVEMENT_STATES.UNUSUAL
      }
    })

    expect(result.profile.protectedUser).toBe(true)
    expect(result.risk.score).toBeGreaterThanOrEqual(40)
    expect(result.protectedPolicy.priority).toBe('elevated')
  })

  test('recommends notification for high concern protected-user observations', () => {
    const result = BehaviourPatternEngine.evaluate({
      identityResult: {
        protected: true,
        profile: {
          id: 'protected-user-1',
          displayName: 'Protected User',
          protected: true
        }
      },
      perceptionResult: {
        bodyPosition: BODY_POSITIONS.FLOOR,
        headDirection: HEAD_DIRECTIONS.UP_RIGHT,
        movementState: MOVEMENT_STATES.FALL_DETECTED
      },
      options: {
        inactiveDurationSeconds: 240
      }
    })

    expect(result.risk.concernLevel).toBe(BEHAVIOUR_CONCERN_LEVELS.HIGH)
    expect(result.decisionHint.notifyAuthorisedUser).toBe(true)
    expect(result.decisionHint.recommendedAction).toBe(BEHAVIOUR_ACTIONS.NOTIFY)
  })

  test('does not use diagnostic medical language', () => {
    const result = BehaviourPatternEngine.evaluate({
      identityResult: {
        protected: true,
        profile: {
          id: 'finley',
          displayName: 'Finley',
          protected: true
        }
      },
      perceptionResult: {
        headDirection: HEAD_DIRECTIONS.UP_LEFT,
        movementState: MOVEMENT_STATES.UNUSUAL
      }
    })

    const output = JSON.stringify(result).toLowerCase()

    expect(output).not.toContain('seizure detected')
    expect(output).not.toContain('diagnosis')
    expect(output).not.toContain('diagnosed')
  })
})
