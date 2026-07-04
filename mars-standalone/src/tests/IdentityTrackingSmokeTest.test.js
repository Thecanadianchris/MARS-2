/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Smoke Test:
 * IdentityTrackingSmokeTest
 *
 * Purpose:
 * Vitest smoke test for the MARS v0.13.1 Identity Tracking
 * Layer and provider-neutral Recognition Candidate architecture.
 *
 * Version:
 * v0.13.1
 *
 * Date Code:
 * 040726
 * ==========================================================
 */

import { describe, expect, it } from 'vitest'
import FaceQualityEngine from '../services/identity/FaceQualityEngine.js'
import IdentityEngine from '../services/identity/IdentityEngine.js'
import IdentityTimelineService from '../services/identity/IdentityTimelineService.js'
import IdentityTrackingService from '../services/identity/IdentityTrackingService.js'
import RecognitionCandidate, { RECOGNITION_STATES } from '../services/identity/RecognitionCandidate.js'
import RecognitionConfidence from '../services/identity/RecognitionConfidence.js'


describe('Identity Tracking Smoke Test', () => {
  it('creates a provider-neutral recognition candidate', () => {
    const candidate = RecognitionCandidate.create({
      trackingId: 'TRK-000001',
      faceVisible: true,
      faceQuality: 0.9,
      visionConfidence: 0.8,
    })

    expect(candidate.trackingId).toBe('TRK-000001')
    expect(candidate.faceVisible).toBe(true)
    expect(candidate.isSuitableForRecognition()).toBe(true)
    expect(candidate.provider).toBe('LOCAL_RECOGNITION_CANDIDATE')
  })

  it('normalises recognition confidence values safely', () => {
    const result = RecognitionConfidence.calculate({
      visionConfidence: 80,
      trackingConfidence: 0.9,
      faceQuality: 0.8,
      identityConfidence: 0,
    })

    expect(result.status).toBe('success')
    expect(result.confidence).toBeGreaterThan(0)
    expect(result.confidence).toBeLessThanOrEqual(1)
    expect(result.description).toBeDefined()
  })

  it('rejects unsuitable face evidence without recognising anyone', () => {
    const result = FaceQualityEngine.evaluate({
      faceVisible: true,
      confidence: 0.2,
      blurScore: 0.2,
      lightingScore: 0.2,
    })

    expect(result.status).toBe('success')
    expect(result.suitable).toBe(false)
    expect(result.reasons).toContain('quality_below_threshold')
  })

  it('creates a tracking record from neutral perception input', () => {
    IdentityTrackingService.reset()

    const result = IdentityTrackingService.updateFromPerception(createMockPerceptionResult())

    expect(result.status).toBe('success')
    expect(result.track.trackingId).toBe('TRK-000001')
    expect(result.candidate.trackingId).toBe('TRK-000001')
    expect(result.timeline.length).toBeGreaterThan(0)
  })

  it('integrates tracking with the identity engine without biometric recognition', () => {
    IdentityEngine.reset()

    const result = IdentityEngine.evaluate(createMockPerceptionResult())

    expect(result.status).toBe('success')
    expect(result.tracking.active).toBe(true)
    expect(result.tracking.trackingId).toBe('TRK-000001')
    expect(result.recognition.faceRecognitionActive).toBe(false)
    expect(result.recognition.preparedForFutureRecognition).toBe(true)
  })

  it('records identity timeline events independently of decision making', () => {
    IdentityTimelineService.reset()

    const event = IdentityTimelineService.addEvent('TRK-TEST', {
      type: 'smoke_test_event',
      label: 'Smoke test event recorded.',
      state: RECOGNITION_STATES.SEARCHING,
    })

    const timeline = IdentityTimelineService.getTimeline('TRK-TEST')

    expect(event.id).toBe('TRK-TEST-EVT-0001')
    expect(timeline.length).toBe(1)
    expect(timeline[0].type).toBe('smoke_test_event')
  })
})

function createMockPerceptionResult() {
  return {
    status: 'success',
    provider: 'IDENTITY_TRACKING_SMOKE_TEST',
    timestamp: Date.now(),
    confidence: 0.9,
    detections: {
      people: 1,
      faces: 1,
    },
    faceFoundation: {
      faceDetected: true,
      faceCount: 1,
      confidence: 85,
    },
    observationStream: {
      ids: ['person_present', 'head_visible'],
      observations: [
        {
          id: 'person_present',
          label: 'Person present',
          confidence: 90,
        },
        {
          id: 'head_visible',
          label: 'Head visible',
          confidence: 80,
        },
      ],
    },
  }
}
