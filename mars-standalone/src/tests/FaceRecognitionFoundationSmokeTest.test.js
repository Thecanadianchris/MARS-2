/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Smoke Test:
 * FaceRecognitionFoundationSmokeTest
 *
 * Purpose:
 * Vitest smoke test for the Face Recognition Foundation:
 * FaceEmbeddingEngine (pure descriptor-comparison math),
 * FaceEnrollmentStore, FaceRecognitionService, the SEARCHING
 * identity state, and the shouldActivatePerson()/setActivePerson()
 * payoff gate.
 *
 * v0.16.1: rewritten for the matcher swap from FaceSignatureEngine
 * (8 landmark-geometry ratios) to FaceEmbeddingEngine (128-d neural
 * face-embedding descriptors, @vladmandic/face-api via
 * FaceEmbeddingService) — a live test showed the geometry approach
 * wasn't discriminative enough between two different real people.
 *
 * @vladmandic/face-api's real model inference is not exercised here
 * (same convention as PoseDetectionService/FaceLandmarkService — no
 * dedicated smoke test for the real browser/model call). Everything
 * downstream of a raw descriptor array is fully real and fully
 * testable with synthetic descriptor data.
 *
 * Version:
 * v0.16.1
 *
 * Date Code:
 * 140726
 * ==========================================================
 */

import { beforeEach, describe, expect, it } from 'vitest'
import FaceEnrollmentStore from '../services/identity/FaceEnrollmentStore.js'
import FaceRecognitionService, { RECOGNITION_PROVIDER } from '../services/identity/FaceRecognitionService.js'
import FaceEmbeddingEngine from '../services/identity/FaceEmbeddingEngine.js'
import FaceRosterService from '../services/identity/FaceRosterService.js'
import FaceEmbeddingService from '../services/vision/FaceEmbeddingService.js'
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

  describe('FaceEmbeddingEngine', () => {
    it('reports zero distance and full confidence comparing a descriptor to itself', () => {
      const descriptor = PERSON_A_DESCRIPTOR
      const distance = FaceEmbeddingEngine.compareSignatures(descriptor, descriptor)

      expect(distance).toBe(0)
      expect(FaceEmbeddingEngine.distanceToConfidence(distance)).toBe(1)
    })

    it('reports a meaningfully larger distance between two different faces', () => {
      const distance = FaceEmbeddingEngine.compareSignatures(
        PERSON_A_DESCRIPTOR,
        PERSON_B_DESCRIPTOR
      )

      expect(distance).toBeGreaterThan(0.6)
      expect(FaceEmbeddingEngine.distanceToConfidence(distance)).toBe(0)
    })

    it('returns Infinity for malformed or mismatched descriptors', () => {
      expect(FaceEmbeddingEngine.compareSignatures(null, PERSON_A_DESCRIPTOR)).toBe(Infinity)
      expect(FaceEmbeddingEngine.compareSignatures([], [])).toBe(Infinity)
      expect(FaceEmbeddingEngine.compareSignatures([1, 2], [1, 2, 3])).toBe(Infinity)
    })
  })

  describe('FaceEnrollmentStore', () => {
    it('enrolls and retrieves descriptors per person', () => {
      const result = FaceEnrollmentStore.enroll('christian', PERSON_A_DESCRIPTOR)

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

    it('v0.16.1: reports persistence availability without throwing under a non-browser (Vitest) environment', () => {
      const status = FaceEnrollmentStore.getStatus()

      expect(status.status).toBe('success')
      expect(typeof status.persistentStorage).toBe('boolean')
      expect(status.onDeviceOnly).toBe(true)
    })

    it('v0.16.1: clearPerson removes only the targeted person', () => {
      FaceEnrollmentStore.enroll('christian', [1, 2, 3])
      FaceEnrollmentStore.enroll('ann', [4, 5, 6])

      expect(FaceEnrollmentStore.clearPerson('christian')).toBe(true)
      expect(FaceEnrollmentStore.isEnrolled('christian')).toBe(false)
      expect(FaceEnrollmentStore.isEnrolled('ann')).toBe(true)
    })
  })

  describe('FaceRecognitionService', () => {
    it('returns zero confidence when face quality is not suitable', () => {
      const result = FaceRecognitionService.recognise({
        embedding: PERSON_A_DESCRIPTOR,
        faceQualityResult: { suitable: false },
      })

      expect(result.identityConfidence).toBe(0)
      expect(result.candidateProfiles).toEqual([])
      expect(result.provider).toBe(RECOGNITION_PROVIDER)
    })

    it('returns zero confidence when no embedding is available', () => {
      const result = FaceRecognitionService.recognise({
        embedding: null,
        faceQualityResult: { suitable: true },
      })

      expect(result.identityConfidence).toBe(0)
      expect(result.candidateProfiles).toEqual([])
    })

    it('returns zero confidence when nobody is enrolled yet', () => {
      const result = FaceRecognitionService.recognise({
        embedding: PERSON_A_DESCRIPTOR,
        faceQualityResult: { suitable: true },
      })

      expect(result.identityConfidence).toBe(0)
      expect(result.candidateProfiles).toEqual([])
    })

    it('recognises an enrolled person from a matching embedding', () => {
      FaceRecognitionService.enroll('christian', PERSON_A_DESCRIPTOR)

      const result = FaceRecognitionService.recognise({
        embedding: PERSON_A_DESCRIPTOR,
        faceQualityResult: { suitable: true },
      })

      expect(result.identityConfidence).toBeGreaterThanOrEqual(0.85)
      expect(result.candidateProfiles).toEqual([
        { profileId: 'christian', confidence: result.identityConfidence },
      ])
    })

    it('does not match an enrolled person against a visibly different face — the exact failure mode found live with Ann', () => {
      FaceRecognitionService.enroll('christian', PERSON_A_DESCRIPTOR)

      const result = FaceRecognitionService.recognise({
        embedding: PERSON_B_DESCRIPTOR,
        faceQualityResult: { suitable: true },
      })

      expect(result.identityConfidence).toBe(0)
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
      FaceRecognitionService.enroll('christian', PERSON_A_DESCRIPTOR)

      const perception = createPerceptionWithEmbedding(PERSON_A_DESCRIPTOR)
      const result = IdentityTrackingService.updateFromPerception(perception)

      expect(result.status).toBe('success')
      expect(result.candidate.identityConfidence).toBeGreaterThanOrEqual(0.85)
      expect(result.candidate.candidateProfiles).toEqual([
        { profileId: 'christian', confidence: result.candidate.identityConfidence },
      ])
      expect(result.candidate.state).toBe(RECOGNITION_STATES.RECOGNISED)
    })

    it('produces no match for an unenrolled face without breaking the pipeline', () => {
      const perception = createPerceptionWithEmbedding(PERSON_B_DESCRIPTOR)
      const result = IdentityTrackingService.updateFromPerception(perception)

      expect(result.status).toBe('success')
      expect(result.candidate.identityConfidence).toBe(0)
      expect(result.candidate.candidateProfiles).toEqual([])
    })

    it('does not confuse a second enrolled person with the first (the exact scenario found live with Ann)', () => {
      FaceRecognitionService.enroll('christian', PERSON_A_DESCRIPTOR)
      FaceRecognitionService.enroll('ann', PERSON_B_DESCRIPTOR)

      const resultForAnn = IdentityTrackingService.updateFromPerception(
        createPerceptionWithEmbedding(PERSON_B_DESCRIPTOR)
      )

      expect(resultForAnn.candidate.candidateProfiles).toEqual([
        { profileId: 'ann', confidence: resultForAnn.candidate.identityConfidence },
      ])
    })
  })

  describe('FaceRosterService (v0.16.4 multi-person simultaneous roster)', () => {
    it('builds an empty roster when no faces are supplied', () => {
      expect(FaceRosterService.build([])).toEqual([])
      expect(FaceRosterService.build()).toEqual([])
    })

    it('labels a face as Unknown when nobody is enrolled yet', () => {
      const roster = FaceRosterService.build([
        { descriptor: PERSON_A_DESCRIPTOR, box: { x: 0, y: 0, width: 100, height: 100 }, landmarks: [] },
      ])

      expect(roster).toHaveLength(1)
      expect(roster[0].matched).toBe(false)
      expect(roster[0].displayName).toBe('Unknown')
      expect(roster[0].profileId).toBe(null)
    })

    it('identifies two different enrolled people in the same frame simultaneously, and leaves a stranger Unknown — the Christian+Ann scenario, but at the same time', () => {
      FaceRecognitionService.enroll('christian', PERSON_A_DESCRIPTOR)
      FaceRecognitionService.enroll('ann', PERSON_B_DESCRIPTOR)

      const roster = FaceRosterService.build([
        { descriptor: PERSON_A_DESCRIPTOR, box: { x: 0, y: 0, width: 100, height: 100 }, landmarks: [] },
        { descriptor: PERSON_B_DESCRIPTOR, box: { x: 200, y: 0, width: 100, height: 100 }, landmarks: [] },
        { descriptor: STRANGER_DESCRIPTOR, box: { x: 400, y: 0, width: 100, height: 100 }, landmarks: [] },
      ])

      expect(roster).toHaveLength(3)
      expect(roster[0]).toMatchObject({ matched: true, profileId: 'christian', displayName: 'Christian' })
      expect(roster[1]).toMatchObject({ matched: true, profileId: 'ann', displayName: 'Ann' })
      expect(roster[2]).toMatchObject({ matched: false, profileId: null, displayName: 'Unknown' })
    })
  })

  describe('FaceEmbeddingService.detectFaces (v0.16.4)', () => {
    it('gracefully degrades to an empty faces array when no dataUrl is supplied', async () => {
      const result = await FaceEmbeddingService.detectFaces({ width: 640, height: 480, dataUrl: null })

      expect(result.status).toBe('empty')
      expect(result.faceDetected).toBe(false)
      expect(result.faces).toEqual([])
    })

    it('gracefully degrades to an empty faces array when no frame is supplied at all', async () => {
      const result = await FaceEmbeddingService.detectFaces(null)

      expect(result.faces).toEqual([])
    })
  })
})

// ---- synthetic 128-d descriptor fixtures ----
// Not real face embeddings (no model is run in this test) — two
// deliberately far-apart vectors standing in for "two different
// people", and reused-as-is for "the same person again" comparisons,
// exactly like the old landmark fixtures stood in for real MediaPipe
// output.

const DESCRIPTOR_LENGTH = 128

const PERSON_A_DESCRIPTOR = buildDescriptor(0.1)
const PERSON_B_DESCRIPTOR = buildDescriptor(0.9)
// v0.16.4: a third, equally-far-apart vector standing in for an
// unenrolled stranger sharing a frame with two enrolled people.
const STRANGER_DESCRIPTOR = buildDescriptor(0.5)

function buildDescriptor(baseValue) {
  return new Array(DESCRIPTOR_LENGTH).fill(0).map((_, index) => {
    // Small deterministic per-index variation so the vector isn't a
    // flat constant (which would trivially minimise distance math),
    // while keeping every "Person A" vector clearly separated from
    // every "Person B" vector.
    return baseValue + (index % 5) * 0.001
  })
}

function createPerceptionWithEmbedding(embedding) {
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
    faceEmbedding: embedding,
    observationStream: {
      ids: ['person_present'],
      observations: [],
    },
  }
}
