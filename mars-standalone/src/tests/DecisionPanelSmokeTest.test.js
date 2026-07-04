/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Test:
 * DecisionPanelSmokeTest
 *
 * Purpose:
 * Smoke test for v0.13.7 M2.4 Decision Intelligence panel
 * supporting data and service output.
 *
 * Version:
 * v0.13.7
 * Date Code:
 * 040726
 * ==========================================================
 */

import { describe, expect, it } from 'vitest'
import DecisionIntelligenceService from '../services/decision/DecisionIntelligenceService.js'

describe('Decision Panel Smoke Test', () => {
  it('creates safe decision output from normal context', () => {
    const result = DecisionIntelligenceService.evaluate(createMockPipelineResult())

    expect(result).toBeDefined()
    expect(result.status).toBe('success')
    expect(result.context).toBeDefined()
    expect(result.decisionResult).toBeDefined()
    expect(result.priorityResult).toBeDefined()
    expect(result.recommendationResult).toBeDefined()
  })

  it('keeps recommendation separate from notification execution', () => {
    const result = DecisionIntelligenceService.evaluate(createMockPipelineResult({
      riskLevel: 8,
      riskLabel: 'high',
      highestPriority: 'high'
    }))

    const recommendation = result.recommendationResult.highestRecommendation

    expect(recommendation).toBeDefined()
    expect(recommendation.actionType).toBeDefined()
    expect(recommendation.executionTarget).toBeDefined()
    expect(recommendation.metadata?.notificationSent).toBeUndefined()
  })

  it('supports protected user context without diagnosing', () => {
    const result = DecisionIntelligenceService.evaluate(createMockPipelineResult({
      profileId: 'finley',
      displayName: 'Finley',
      highestPriority: 'high',
      riskLevel: 8,
      riskLabel: 'high',
      activity: 'unusual_sign'
    }))

    expect(result.context.personal.displayName).toBe('Finley')
    expect(result.priorityResult.highestPriority.score).toBeGreaterThanOrEqual(70)
    expect(result.summary.toLowerCase()).not.toContain('diagnosis')
  })

  it('handles missing input safely', () => {
    const result = DecisionIntelligenceService.evaluate(null)

    expect(result).toBeDefined()
    expect(result.status).not.toBe('success')
    expect(result.context).toBeDefined()
  })
})

function createMockPipelineResult(options = {}) {
  const profileId = options.profileId || 'christian'
  const displayName = options.displayName || 'Christian'
  const observations = [
    { id: 'person_present', label: 'Person present' },
    { id: options.bodyObservation || 'body_standing', label: 'Body standing' },
    { id: 'personal_profile_active', label: 'Personal profile active' }
  ]

  return {
    status: 'success',
    provider: 'DECISION_PANEL_SMOKE_TEST',
    timestamp: Date.now(),
    frame: {
      width: 640,
      height: 480,
      timestamp: Date.now()
    },
    detections: {
      people: 1,
      faces: 1,
      objects: 0,
      pose: 'standing'
    },
    bodyState: {
      posture: options.posture || 'standing',
      confidence: 84
    },
    movement: {
      movement: options.movement || 'moving',
      direction: 'forward',
      confidence: 82
    },
    behaviourHistory: {
      behaviourState: options.behaviourState || 'active',
      sampleCount: options.sampleCount || 6
    },
    behaviourPattern: {
      pattern: options.pattern || 'stable',
      transition: 'none',
      confidence: 82
    },
    activityRecognition: {
      activity: options.activity || 'standing',
      activityDisplay: options.activity || 'Standing',
      confidence: 82
    },
    faceFoundation: {
      faceDetected: true,
      faceCount: 1,
      confidence: 82
    },
    observationStream: {
      observationCount: observations.length,
      ids: observations.map((observation) => observation.id),
      labels: observations.map((observation) => observation.label),
      observations,
      summary: 'Decision panel smoke test observations.'
    },
    personalObservation: {
      profile: {
        id: profileId,
        displayName
      },
      activeMarkerCount: 1,
      highestPriority: options.highestPriority || 'normal',
      markers: [],
      summary: `${displayName} active.`
    },
    identity: {
      state: 'known_user',
      confidence: 84,
      profile: {
        id: profileId,
        displayName
      },
      userType: profileId === 'finley' ? 'protected_user' : 'standard_user',
      known: true,
      trusted: true,
      protected: profileId === 'finley',
      blocked: false,
      requiresTrustedUserConfirmation: false
    },
    risk: {
      level: options.riskLevel || 1,
      label: options.riskLabel || 'normal',
      confidence: 84
    }
  }
}
