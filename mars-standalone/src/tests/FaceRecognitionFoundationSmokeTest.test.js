/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Smoke Test:
 * FaceRecognitionFoundationSmokeTest
 *
 * Purpose:
 * Vitest smoke test for the v0.16 Face Recognition Foundation:
 * FaceSignatureEngine (pure geometry math), FaceEnrollmentStore,
 * FaceRecognitionService, the SEARCHING identity state, and the
 * shouldActivatePerson()/setActivePerson() payoff gate.
 *
 * MediaPipe's FaceLandmarker itself is not exercised here (same
 * convention as PoseDetectionService — no dedicated smoke test for
 * the real browser/model call). Everything downstream of a raw
 * landmark array is fully real and fully testable with synthetic
 * landmark data, matching how VisionPipelineSmokeTest exercises
 * PoseDetectionService via a frame with no dataUrl.
 *
 * Version:
 * v0.16.0
 *
 * Date Code:
 * 130726
 * ==========================================================
 */

import { beforeEach, describe, expect, it } from 'vitest'
import FaceEnrollmentStore from '../services/identity/FaceEnrollmentStore.js'
import FaceRecognitionService from '../services/identity/FaceRecognitionService.js'
import FaceSignatureEngine, { LANDMARK_INDEX } from '../services/identity/FaceSignatureEngine.js'
import IdentityEngine from '../services/identity/IdentityEngine.js'
import IdentityStateMachine from '../services/identity/IdentityStateMachine.js'
import IdentityTrackingService from '../services/identity/IdentityTrackingService.js'
import { RECOGNITION_STATES } from '../services/identity/RecognitionCandidate.js'
import {
  IDENTITY_CONFIDENCE,
  IDENTITY_STATES,
} from '../services/identity/IdentityTypes.js'

describe('Face Recognition Foundation Smoke Test', () => {
  beforeEach(() => {
    FaceEnrollmentStore.reset()
    IdentityTrackingService.reset()
    IdentityEngine.reset()
  })

  describe('FaceSignatureEngine', () => {
    it('returns null for missing or insufficient landmarks', () => {
      expect(FaceSignatureEngine.computeSignature([])).toBeNull()
      expect(FaceSignatureEngine.computeSignature(null)).toBeNull()
      expect(FaceSignatureEngine.computeSignature([{ x: 0.5, y: 0.5 }])).toBeNull()
    })

    it('computes a signature vector from a well-formed landmark set', () => {
      const signature = FaceSignatureEngine.computeSignature(buildLandmarks(PERSON_A_POINTS))

      expect(Array.isArray(signature)).toBe(true)
      expect(signature.length).toBeGreaterThan(0)
      expect(signature.every((value) => Number.isFinite(value))).toBe(true)
    })

    it('reports zero distance and full confidence comparing a signature to itself', () => {
      const signature = FaceSignatureEngine.computeSignature(buildLandmarks(PERSON_A_POINTS))
      const distance = FaceSignatureEngine.compareSignatures(signature, signature)

      expect(distance).toBe(0)
      expect(FaceSignatureEngine.distanceToConfidence(distance)).toBe(1)
    })

    it('reports a meaningfully larger distance between two different faces', () => {
      const signatureA = FaceSignatureEngine.computeSignature(buildLandmarks(PERSON_A_POINTS))
      const signatureB = FaceSignatureEngine.computeSignature(buildLandmarks(PERSON_B_POINTS))
      const distance = FaceSignatureEngine.compareSignatures(signatureA, signatureB)

      expect(distance).toBeGreaterThan(0.1)
      expect(FaceSignatureEngine.distanceToConfidence(distance)).toBeLessThan(0.85)
    })
  })

  describe('FaceEnrollmentStore', () => {
    it('enrolls and retrieves signatures per person', () => {
      const signature = FaceSignatureEngine.computeSignature(buildLandmarks(PERSON_A_POINTS))
      const result = FaceEnrollmentStore.enroll('christian', signature)

      expect(result.status).toBe('success')
      expect(FaceEnrollmentStore.isEnrolled('christian')).toBe(true)
      expect(FaceEnrollmentStore.getSamples('christian').length).toBe(1)
      expect(FaceEnrollmentStore.getEnrolledPersonIds()).toContain('christian')
    })

    it('rejects an invalid signature without throwing', () => {
      expect(FaceEnrollmentStore.enroll('christian', null).status).toBe('rejected')
      expect(FaceEnrollmentStore.enroll(null, [0.1, 0.2]).status).toBe('rejected')
    })

    it('caps stored samples per person and drops the oldest', () => {
      for (let i = 0; i < 7; i += 1) {
        FaceEnrollmentStore.enroll('christian', [i, i, i])
      }

      const samples = FaceEnrollmentStore.getSamples('christian')

      expect(samples.length).toBe(5)
      expect(samples[0]).toEqual([2, 2, 2])
    })
  })

  describe('FaceRecognitionService', () => {
    it('returns zero confidence when face quality is not suitable', () => {
      const result = FaceRecognitionService.recognise({
        landmarks: buildLandmarks(PERSON_A_POINTS),
        faceQualityResult: { suitable: false },
      })

      expect(result.identityConfidence).toBe(0)
      expect(result.candidateProfiles).toEqual([])
    })

    it('returns zero confidence when nobody is enrolled yet', () => {
      const result = FaceRecognitionService.recognise({
        landmarks: buildLandmarks(PERSON_A_POINTS),
        faceQualityResult: { suitable: true },
      })

      expect(result.identityConfidence).toBe(0)
      expect(result.candidateProfiles).toEqual([])
    })

    it('recognises an enrolled person from matching landmarks', () => {
      FaceRecognitionService.enroll('christian', buildLandmarks(PERSON_A_POINTS))

      const result = FaceRecognitionService.recognise({
        landmarks: buildLandmarks(PERSON_A_POINTS),
        faceQualityResult: { suitable: true },
      })

      expect(result.identityConfidence).toBeGreaterThanOrEqual(0.85)
      expect(result.candidateProfiles).toEqual([
        { profileId: 'christian', confidence: result.identityConfidence },
      ])
    })

    it('does not match an enrolled person against a visibly different face', () => {
      FaceRecognitionService.enroll('christian', buildLandmarks(PERSON_A_POINTS))

      const result = FaceRecognitionService.recognise({
        landmarks: buildLandmarks(PERSON_B_POINTS),
        faceQualityResult: { suitable: true },
      })

      expect(result.identityConfidence).toBeLessThan(0.85)
      expect(result.candidateProfiles).toEqual([])
    })
  })

  describe('SEARCHING identity state', () => {
    it('reports SEARCHING while attemptingRecognition is true', () => {
      const result = IdentityStateMachine.evaluate({
        personPresent: true,
        faceDetected: true,
        matchedProfile: null,
        pendingProfile: null,
        guest: false,
        attemptingRecognition: true,
      })

      expect(result.state).toBe(IDENTITY_STATES.SEARCHING)
      expect(result.confidence).toBe(IDENTITY_CONFIDENCE.SEARCHING)
    })

    it('falls back to UNKNOWN once attemptingRecognition is false', () => {
      const result = IdentityStateMachine.evaluate({
        personPresent: true,
        faceDetected: true,
        matchedProfile: null,
        pendingProfile: null,
        guest: false,
        attemptingRecognition: false,
      })

      expect(result.state).toBe(IDENTITY_STATES.UNKNOWN)
    })

    it('IdentityEngine.isAttemptingRecognition respects the patience window', () => {
      expect(
        IdentityEngine.isAttemptingRecognition(true, null, { track: { framesSeen: 1 } })
      ).toBe(true)
      expect(
        IdentityEngine.isAttemptingRecognition(true, null, { track: { framesSeen: 2 } })
      ).toBe(true)
      expect(
        IdentityEngine.isAttemptingRecognition(true, null, { track: { framesSeen: 3 } })
      ).toBe(false)
      expect(
        IdentityEngine.isAttemptingRecognition(true, null, { track: { framesSeen: 0 } })
      ).toBe(false)
      expect(
        IdentityEngine.isAttemptingRecognition(false, null, { track: { framesSeen: 1 } })
      ).toBe(false)
      expect(
        IdentityEngine.isAttemptingRecognition(true, { id: 'christian' }, { track: { framesSeen: 1 } })
      ).toBe(false)
    })
  })

  describe('shouldActivatePerson (setActivePerson payoff gate)', () => {
    it('never activates on a null or pending identity result', () => {
      expect(IdentityEngine.shouldActivatePerson(null)).toBe(false)
      expect(
        IdentityEngine.shouldActivatePerson({
          profile: { id: 'pending-1', pending: true },
          state: IDENTITY_STATES.PENDING_PROFILE,
        })
      ).toBe(false)
    })

    it('never activates on UNKNOWN/GUEST/SEARCHING states regardless of confidence', () => {
      expect(
        IdentityEngine.shouldActivatePerson({
          profile: { id: 'unknown' },
          state: IDENTITY_STATES.UNKNOWN,
          recognition: { candidate: { identityConfidence: 0.99 } },
        })
      ).toBe(false)
    })

    it('never activates below the confidence threshold, even on a protected profile', () => {
      expect(
        IdentityEngine.shouldActivatePerson({
          profile: { id: 'finley' },
          state: IDENTITY_STATES.PROTECTED,
          recognition: { candidate: { identityConfidence: 0.6 } },
        })
      ).toBe(false)
    })

    it('activates on a confident KNOWN/TRUSTED/PROTECTED match', () => {
      expect(
        IdentityEngine.shouldActivatePerson({
          profile: { id: 'ann' },
          state: IDENTITY_STATES.TRUSTED,
          recognition: { candidate: { identityConfidence: 0.9 } },
        })
      ).toBe(true)

      expect(
        IdentityEngine.shouldActivatePerson({
          profile: { id: 'finley' },
          state: IDENTITY_STATES.PROTECTED,
          recognition: { candidate: { identityConfidence: 0.92 } },
        })
      ).toBe(true)
    })
  })

  describe('End-to-end: IdentityTrackingService with a real enrolled match', () => {
    it('produces a RECOGNISED candidate for an enrolled face', () => {
      FaceRecognitionService.enroll('christian', buildLandmarks(PERSON_A_POINTS))

      const perception = createPerceptionWithLandmarks(buildLandmarks(PERSON_A_POINTS))
      const result = IdentityTrackingService.updateFromPerception(perception)

      expect(result.status).toBe('success')
      expect(result.candidate.identityConfidence).toBeGreaterThanOrEqual(0.85)
      expect(result.candidate.candidateProfiles).toEqual([
        { profileId: 'christian', confidence: result.candidate.identityConfidence },
      ])
      expect(result.candidate.state).toBe(RECOGNITION_STATES.RECOGNISED)
    })

    it('produces no match for an unenrolled face without breaking the pipeline', () => {
      const perception = createPerceptionWithLandmarks(buildLandmarks(PERSON_B_POINTS))
      const result = IdentityTrackingService.updateFromPerception(perception)

      expect(result.status).toBe('success')
      expect(result.candidate.identityConfidence).toBe(0)
      expect(result.candidate.candidateProfiles).toEqual([])
    })
  })
})

// ---- synthetic landmark fixtures ----

const PERSON_A_POINTS = {
  [LANDMARK_INDEX.LEFT_EYE_OUTER]: { x: 0.35, y: 0.4 },
  [LANDMARK_INDEX.LEFT_EYE_INNER]: { x: 0.45, y: 0.4 },
  [LANDMARK_INDEX.RIGHT_EYE_INNER]: { x: 0.55, y: 0.4 },
  [LANDMARK_INDEX.RIGHT_EYE_OUTER]: { x: 0.65, y: 0.4 },
  [LANDMARK_INDEX.NOSE_TIP]: { x: 0.5, y: 0.5 },
  [LANDMARK_INDEX.FOREHEAD_TOP]: { x: 0.5, y: 0.2 },
  [LANDMARK_INDEX.CHIN_BOTTOM]: { x: 0.5, y: 0.8 },
  [LANDMARK_INDEX.MOUTH_LEFT]: { x: 0.42, y: 0.65 },
  [LANDMARK_INDEX.MOUTH_RIGHT]: { x: 0.58, y: 0.65 },
  [LANDMARK_INDEX.FACE_EDGE_LEFT]: { x: 0.25, y: 0.5 },
  [LANDMARK_INDEX.FACE_EDGE_RIGHT]: { x: 0.75, y: 0.5 },
}

const PERSON_B_POINTS = {
  [LANDMARK_INDEX.LEFT_EYE_OUTER]: { x: 0.35, y: 0.4 },
  [LANDMARK_INDEX.LEFT_EYE_INNER]: { x: 0.45, y: 0.4 },
  [LANDMARK_INDEX.RIGHT_EYE_INNER]: { x: 0.55, y: 0.4 },
  [LANDMARK_INDEX.RIGHT_EYE_OUTER]: { x: 0.65, y: 0.4 },
  [LANDMARK_INDEX.NOSE_TIP]: { x: 0.5, y: 0.44 },
  [LANDMARK_INDEX.FOREHEAD_TOP]: { x: 0.5, y: 0.27 },
  [LANDMARK_INDEX.CHIN_BOTTOM]: { x: 0.5, y: 0.68 },
  [LANDMARK_INDEX.MOUTH_LEFT]: { x: 0.46, y: 0.56 },
  [LANDMARK_INDEX.MOUTH_RIGHT]: { x: 0.54, y: 0.56 },
  [LANDMARK_INDEX.FACE_EDGE_LEFT]: { x: 0.31, y: 0.5 },
  [LANDMARK_INDEX.FACE_EDGE_RIGHT]: { x: 0.69, y: 0.5 },
}

function buildLandmarks(overridesByIndex) {
  const maxIndex = Math.max(...Object.values(LANDMARK_INDEX))
  const landmarks = new Array(maxIndex + 1).fill(null).map(() => ({ x: 0.5, y: 0.5, z: 0 }))

  Object.entries(overridesByIndex).forEach(([index, point]) => {
    landmarks[Number(index)] = { ...point, z: 0 }
  })

  return landmarks
}

function createPerceptionWithLandmarks(landmarks) {
  return {
    status: 'success',
    provider: 'FACE_RECOGNITION_SMOKE_TEST',
    timestamp: Date.now(),
    confidence: 0.9,
    personPresent: true,
    detections: {
      people: 1,
      faces: 1,
    },
    faceFoundation: {
      faceDetected: true,
      faceCount: 1,
      confidence: 90,
    },
    faceLandmarks: landmarks,
    observationStream: {
      ids: ['person_present'],
      observations: [],
    },
  }
}
