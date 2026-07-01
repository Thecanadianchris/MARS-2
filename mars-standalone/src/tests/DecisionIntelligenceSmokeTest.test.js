/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Test:
 * DecisionIntelligenceSmokeTest
 *
 * Purpose:
 * Vitest smoke test for the MARS Decision Intelligence Layer.
 *
 * Version:
 * v0.12.4
 *
 * Date Code:
 * 010726
 * ==========================================================
 */

import { describe, expect, it } from 'vitest'
import DecisionIntelligenceService from '../services/decision/DecisionIntelligenceService.js'

describe('DecisionIntelligenceService Smoke Test', () => {
  it('handles missing input safely', () => {
    const result = DecisionIntelligenceService.evaluate(null)

    expect(result).toBeDefined()
    expect(result.status).toBeDefined()
  })

  it('produces decision intelligence output from a valid perception result', () => {
    const result = DecisionIntelligenceService.evaluate(
      createMockPerceptionResult()
    )

    expect(result).toBeDefined()
    expect(result.status).toBeDefined()

    expect(
      result.context || result.decisionContext || result.contextResult
    ).toBeDefined()

    expect(
      result.decision || result.decisionResult
    ).toBeDefined()

    expect(
      result.priority || result.priorityResult
    ).toBeDefined()

    expect(
      result.recommendation || result.recommendationResult
    ).toBeDefined()
  })
})

function createMockPerceptionResult() {
  return {
    status: 'success',
    provider: 'SMOKE_TEST',
    timestamp: Date.now(),

    frame: {
      width: 640,
      height: 480,
      timestamp: Date.now(),
    },

    detections: {
      people: 1,
      faces: 0,
      objects: 0,
      pose: 'standing',
    },

    bodyState: {
      posture: 'standing',
      confidence: 90,
      riskModifier: 0,
      summary: 'Body standing.',
    },

    movement: {
      movement: 'stationary',
      direction: 'none',
      delta: 0,
      confidence: 90,
      riskModifier: 0,
      summary: 'Movement stationary.',
    },

    behaviourHistory: {
      behaviourState: 'sustained_stationary',
      behaviourDisplay: 'Sustained stationary',
      sampleCount: 5,
      riskModifier: 0,
      summary: 'Behaviour history stable.',
    },

    behaviourPattern: {
      pattern: 'stable',
      patternDisplay: 'Stable',
      transition: 'none',
      transitionDisplay: 'No transition',
      confidence: 80,
      riskModifier: 0,
      summary: 'Behaviour pattern stable.',
    },

    activityRecognition: {
      activity: 'standing',
      activityDisplay: 'Standing',
      direction: 'none',
      confidence: 80,
      riskModifier: 0,
      summary: 'Activity standing.',
    },

    faceFoundation: {
      faceDetected: false,
      faceCount: 0,
      confidence: 0,
      riskModifier: 0,
      summary: 'No face foundation signals.',
    },

    observationStream: {
      observationCount: 3,
      ids: [
        'person_present',
        'body_standing',
        'movement_stationary',
      ],
      labels: [
        'Person present',
        'Body standing',
        'Movement stationary',
      ],
      observations: [
        {
          id: 'person_present',
          label: 'Person present',
        },
        {
          id: 'body_standing',
          label: 'Body standing',
        },
        {
          id: 'movement_stationary',
          label: 'Movement stationary',
        },
      ],
      summary: 'Observation stream active.',
    },

    personalObservation: {
      profile: {
        id: 'unknown',
        displayName: 'Unknown',
      },
      activeMarkerCount: 0,
      highestPriority: 'normal',
      markers: [],
      riskModifier: 0,
      summary: 'No personal observation markers.',
    },

    risk: {
      level: 1,
      label: 'normal',
      confidence: 80,
    },
  }
}