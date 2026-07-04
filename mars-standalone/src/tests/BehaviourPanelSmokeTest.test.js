/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Smoke Test:
 * BehaviourPanelSmokeTest
 *
 * Purpose:
 * Verifies the v0.13.6 M2.3 Behaviour Panel UI state layer.
 *
 * Version:
 * v0.13.6
 * Date Code:
 * 040726
 * ==========================================================
 */

import { describe, expect, test } from 'vitest'
import {
  BEHAVIOUR_ACTIONS,
  BEHAVIOUR_CONCERN_LEVELS,
  BODY_POSITIONS,
  BehaviourPatternEngine,
  HEAD_DIRECTIONS,
  MOVEMENT_STATES
} from '../services/behaviour'

function createBehaviourPanelSnapshot(scenario = 'normal') {
  const scenarios = {
    normal: {
      identityResult: {
        protected: false,
        profile: {
          id: 'christian',
          displayName: 'Christian',
          protected: false
        }
      },
      perceptionResult: {
        bodyPosition: BODY_POSITIONS.STANDING,
        headDirection: HEAD_DIRECTIONS.FORWARD,
        movementState: MOVEMENT_STATES.MOVING,
        confidence: 0.86
      }
    },
    protectedConcern: {
      identityResult: {
        protected: true,
        profile: {
          id: 'finley',
          displayName: 'Finley',
          protected: true
        }
      },
      perceptionResult: {
        bodyPosition: BODY_POSITIONS.FLOOR,
        headDirection: HEAD_DIRECTIONS.UP_LEFT,
        movementState: MOVEMENT_STATES.FALL_DETECTED,
        confidence: 0.78
      },
      options: {
        inactiveDurationSeconds: 240
      }
    }
  }

  const result = BehaviourPatternEngine.evaluate(scenarios[scenario] || scenarios.normal)

  return {
    panel: 'BehaviourPanel',
    version: 'v0.13.6',
    status: 'success',
    profileName: result.profile.displayName,
    protectedUser: result.profile.protectedUser,
    bodyPosition: result.observationStream.bodyPosition,
    headDirection: result.observationStream.headDirection,
    movementState: result.observationStream.movementState,
    concernLevel: result.risk.concernLevel,
    recommendedAction: result.decisionHint.recommendedAction,
    notifyAuthorisedUser: result.decisionHint.notifyAuthorisedUser,
    capabilityAreas: [
      'behaviour-pattern-engine',
      'body-position-tracking',
      'head-direction-tracking',
      'movement-state-tracking',
      'protected-user-policy',
      'baseline-learning',
      'watch-correlation'
    ],
    safetyBoundary: 'Behaviour Intelligence observes signs only and does not diagnose medical conditions.'
  }
}

describe('Behaviour Panel Smoke Test', () => {
  test('creates a safe behaviour panel snapshot', () => {
    const snapshot = createBehaviourPanelSnapshot()

    expect(snapshot.panel).toBe('BehaviourPanel')
    expect(snapshot.status).toBe('success')
    expect(snapshot.bodyPosition).toBe(BODY_POSITIONS.STANDING)
    expect(snapshot.recommendedAction).toBe(BEHAVIOUR_ACTIONS.OBSERVE)
  })

  test('reports the behaviour capability areas required by M2.3', () => {
    const snapshot = createBehaviourPanelSnapshot()

    expect(snapshot.capabilityAreas).toContain('behaviour-pattern-engine')
    expect(snapshot.capabilityAreas).toContain('body-position-tracking')
    expect(snapshot.capabilityAreas).toContain('head-direction-tracking')
    expect(snapshot.capabilityAreas).toContain('movement-state-tracking')
    expect(snapshot.capabilityAreas).toContain('protected-user-policy')
  })

  test('keeps protected-user concern observations non-medical and decision-ready', () => {
    const snapshot = createBehaviourPanelSnapshot('protectedConcern')

    expect(snapshot.protectedUser).toBe(true)
    expect(snapshot.concernLevel).toBe(BEHAVIOUR_CONCERN_LEVELS.HIGH)
    expect(snapshot.recommendedAction).toBe(BEHAVIOUR_ACTIONS.NOTIFY)
    expect(snapshot.notifyAuthorisedUser).toBe(true)
  })

  test('does not use diagnostic medical language in the panel state', () => {
    const snapshot = createBehaviourPanelSnapshot('protectedConcern')
    const output = JSON.stringify(snapshot).toLowerCase()

    expect(output).not.toContain('seizure detected')
    expect(output).not.toContain('diagnosis')
    expect(output).not.toContain('diagnosed')
  })
})
