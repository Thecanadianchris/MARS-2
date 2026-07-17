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
import IdentityLockService from '../services/identity/IdentityLockService.js'
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
    it('reports zero distance and very high confidence comparing a descriptor to itself', () => {
      const descriptor = PERSON_A_DESCRIPTOR
      const distance = FaceEmbeddingEngine.compareSignatures(descriptor, descriptor)

      expect(distance).toBe(0)
      // v0.16.11: the logistic curve is asymptotic — distance 0 reads
      // very high (~98%) but, unlike the old linear formula, never
      // exactly 1. That's intentional: see FaceEmbeddingEngine's
      // header for why an exact-1.0 formula was actually the bug.
      expect(FaceEmbeddingEngine.distanceToConfidence(distance)).toBeGreaterThan(0.95)
    })

    it('gives a genuinely good real-world match (distance well inside the accept boundary) a genuinely high confidence — the exact gap a live test found (16 July 2026, Christian: 55% for what was actually a solid match)', () => {
      // Christian's real live match against his own enrolled samples
      // measured ~0.27 Euclidean distance — comfortably inside the 0.6
      // accept boundary, a solid same-person match by any reasonable
      // standard, yet the old linear formula reported only ~55%.
      expect(FaceEmbeddingEngine.distanceToConfidence(0.27)).toBeGreaterThan(0.85)
    })

    it('reports confidence exactly 0.5 right at the accept/reject distance boundary', () => {
      expect(FaceEmbeddingEngine.distanceToConfidence(0.6)).toBeCloseTo(0.5, 5)
    })

    it('reports a meaningfully larger distance between two different faces, with confidence collapsing toward zero', () => {
      const distance = FaceEmbeddingEngine.compareSignatures(
        PERSON_A_DESCRIPTOR,
        PERSON_B_DESCRIPTOR
      )

      expect(distance).toBeGreaterThan(0.6)
      expect(FaceEmbeddingEngine.distanceToConfidence(distance)).toBeLessThan(0.01)
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

    it('caps stored samples per person and drops the oldest (v0.16.5: cap raised to 10 for guided-pose diversity)', () => {
      for (let i = 0; i < 12; i += 1) {
        FaceEnrollmentStore.enroll('christian', [i, i, i])
      }

      const samples = FaceEnrollmentStore.getSamples('christian')

      expect(samples.length).toBe(10)
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

      // v0.16.11: the logistic curve is asymptotic, never exactly 0 —
      // still comfortably below MIN_CANDIDATE_CONFIDENCE (0.5), so
      // this correctly falls back to the no-match branch either way.
      expect(result.identityConfidence).toBeLessThan(0.01)
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

  describe('IdentityLockService (v0.16.11, pure unit)', () => {
    it('does not lock on a single high-confidence frame', () => {
      const result = IdentityLockService.update({
        trackingId: 'TRK-LOCK-001',
        candidateProfiles: [{ profileId: 'finley', confidence: 0.95 }],
      })

      expect(result.locked).toBe(false)
      expect(result.lockState).toBe('locking')
      expect(result.framesToAcquire).toBe(2)
    })

    it('acquires a lock after 3 consecutive high-confidence frames for the same person', () => {
      let result
      for (let i = 0; i < 3; i += 1) {
        result = IdentityLockService.update({
          trackingId: 'TRK-LOCK-002',
          candidateProfiles: [{ profileId: 'finley', confidence: 0.95 }],
        })
      }

      expect(result.locked).toBe(true)
      expect(result.personId).toBe('finley')
      expect(result.framesToAcquire).toBe(0)
    })

    it('never locks on a weak match, even repeated', () => {
      let result
      for (let i = 0; i < 5; i += 1) {
        result = IdentityLockService.update({
          trackingId: 'TRK-LOCK-003',
          candidateProfiles: [{ profileId: 'finley', confidence: 0.6 }],
        })
      }

      expect(result.locked).toBe(false)
    })

    it('holds locked + held through a frame with no candidate at all', () => {
      for (let i = 0; i < 3; i += 1) {
        IdentityLockService.update({
          trackingId: 'TRK-LOCK-004',
          candidateProfiles: [{ profileId: 'finley', confidence: 0.95 }],
        })
      }

      const held = IdentityLockService.update({ trackingId: 'TRK-LOCK-004', candidateProfiles: [] })

      expect(held.locked).toBe(true)
      expect(held.held).toBe(true)
      expect(held.personId).toBe('finley')
    })

    it('releases the lock when a different profile clears the override bar on the same track', () => {
      for (let i = 0; i < 3; i += 1) {
        IdentityLockService.update({
          trackingId: 'TRK-LOCK-005',
          candidateProfiles: [{ profileId: 'finley', confidence: 0.95 }],
        })
      }

      const swapped = IdentityLockService.update({
        trackingId: 'TRK-LOCK-005',
        candidateProfiles: [{ profileId: 'ann', confidence: 0.9 }],
      })

      // A rival clearing the bar immediately un-locks (starts building
      // toward the new person instead) rather than keeping the stale
      // identity — never allowed to keep misattributing once better
      // evidence for someone else exists.
      expect(swapped.locked).toBe(false)
      expect(swapped.lockState).toBe('locking')
    })

    it('ignores a weak rival match and keeps holding the existing lock', () => {
      for (let i = 0; i < 3; i += 1) {
        IdentityLockService.update({
          trackingId: 'TRK-LOCK-006',
          candidateProfiles: [{ profileId: 'finley', confidence: 0.95 }],
        })
      }

      const stillHeld = IdentityLockService.update({
        trackingId: 'TRK-LOCK-006',
        candidateProfiles: [{ profileId: 'ann', confidence: 0.55 }],
      })

      expect(stillHeld.locked).toBe(true)
      expect(stillHeld.held).toBe(true)
      expect(stillHeld.personId).toBe('finley')
    })

    it('release() clears a lock immediately', () => {
      for (let i = 0; i < 3; i += 1) {
        IdentityLockService.update({
          trackingId: 'TRK-LOCK-007',
          candidateProfiles: [{ profileId: 'finley', confidence: 0.95 }],
        })
      }

      IdentityLockService.release('TRK-LOCK-007')

      expect(IdentityLockService.getLock('TRK-LOCK-007').locked).toBe(false)
    })
  })

  describe('End-to-end Identity Lock through the real pipeline (v0.16.11: "if finley has a seizure and is on the floor... it has a lock on it will continue to recognise the person")', () => {
    it('reuses the same trackingId across consecutive frames instead of minting a new one every time (the continuity bug this milestone also fixed)', () => {
      FaceRecognitionService.enroll('finley', PERSON_A_DESCRIPTOR)

      const first = IdentityTrackingService.updateFromPerception(createPerceptionWithEmbedding(PERSON_A_DESCRIPTOR))
      const second = IdentityTrackingService.updateFromPerception(createPerceptionWithEmbedding(PERSON_A_DESCRIPTOR))
      const third = IdentityTrackingService.updateFromPerception(createPerceptionWithEmbedding(PERSON_A_DESCRIPTOR))

      expect(second.track.trackingId).toBe(first.track.trackingId)
      expect(third.track.trackingId).toBe(first.track.trackingId)
      expect(third.track.framesSeen).toBe(3)
    })

    it('IdentityEngine keeps resolving PROTECTED for finley through a face-visibility gap, instead of falling back to generic tracking — the exact seizure/floor scenario', () => {
      FaceRecognitionService.enroll('finley', PERSON_A_DESCRIPTOR)

      let result
      for (let i = 0; i < 3; i += 1) {
        result = IdentityEngine.evaluate(createPerceptionWithEmbedding(PERSON_A_DESCRIPTOR))
      }

      expect(result.state).toBe(IDENTITY_STATES.PROTECTED)
      expect(result.profile.displayName).toBe('Finley')
      expect(result.identityHeld).toBe(false)

      // Finley collapses: person-presence evidence continues (a
      // separate detector from the face model — see VisionPipeline,
      // PoseDetectionService), but no face is visible or detectable
      // at all this frame.
      const heldResult = IdentityEngine.evaluate(createPerceptionWithNoFace())

      expect(heldResult.state).toBe(IDENTITY_STATES.PROTECTED)
      expect(heldResult.profile.displayName).toBe('Finley')
      expect(heldResult.identityHeld).toBe(true)
      expect(heldResult.reason).toContain('Tracking held')

      // The actual safety payoff: memory/behaviour attribution is
      // still allowed to stay on Finley throughout, not silently drop
      // to "unknown person on the floor."
      expect(IdentityEngine.shouldActivatePerson(heldResult)).toBe(true)
    })

    it('without a lock, a single no-face frame would have reported generic tracking, not the person — confirms this is a real fix, not a no-op', () => {
      // No enrollment, no prior frames — a bare no-face frame with no
      // lock ever established should behave exactly as before this
      // milestone: generic TRACKING, identity unknown.
      const result = IdentityEngine.evaluate(createPerceptionWithNoFace())

      expect(result.state).toBe(IDENTITY_STATES.TRACKING)
      expect(result.identityHeld).toBe(false)
    })

    it('drops the hold once the person is actually gone (track expires)', () => {
      FaceRecognitionService.enroll('finley', PERSON_A_DESCRIPTOR)

      let lastTrackingId
      for (let i = 0; i < 3; i += 1) {
        const result = IdentityTrackingService.updateFromPerception(
          createPerceptionWithEmbedding(PERSON_A_DESCRIPTOR)
        )
        lastTrackingId = result.track.trackingId
      }

      // Simulate real time passing well beyond the tracking timeout
      // with no person-presence evidence at all (not just no face) —
      // the person actually left, not just turned away or collapsed.
      const farFuture = Date.now() + 60 * 1000
      IdentityTrackingService.expireOldTracks(farFuture)

      expect(IdentityLockService.getLock(lastTrackingId).locked).toBe(false)
    })
  })

  describe('Multi-Person Simultaneous Locking (v0.16.13, "locked on to her but then the lock turned off on me")', () => {
    it('gives two simultaneously-recognised people their own independent trackingId, not a shared one', () => {
      FaceRecognitionService.enroll('christian', PERSON_A_DESCRIPTOR)
      FaceRecognitionService.enroll('ann', PERSON_B_DESCRIPTOR)

      const christianResult = IdentityTrackingService.updateFromPerception(
        createPerceptionWithEmbedding(PERSON_A_DESCRIPTOR)
      )
      const annResult = IdentityTrackingService.updateFromPerception(
        createPerceptionWithEmbedding(PERSON_B_DESCRIPTOR)
      )

      expect(christianResult.track.trackingId).not.toBe(annResult.track.trackingId)
    })

    it("does not let a second recognised person steal the first's lock — the exact bug found live with Ann", () => {
      FaceRecognitionService.enroll('christian', PERSON_A_DESCRIPTOR)
      FaceRecognitionService.enroll('ann', PERSON_B_DESCRIPTOR)

      // Christian locks in over 3 frames, same as any single-person
      // scenario.
      let christianTrackingId
      for (let i = 0; i < 3; i += 1) {
        const result = IdentityTrackingService.updateFromPerception(
          createPerceptionWithEmbedding(PERSON_A_DESCRIPTOR)
        )
        christianTrackingId = result.track.trackingId
      }
      expect(IdentityLockService.getLock(christianTrackingId).locked).toBe(true)

      // Ann now appears too and locks in over her OWN 3 frames,
      // interleaved with Christian still being updated every frame —
      // exactly like VisionPipeline processing every detected face
      // every frame (see VisionPipeline's per-face loop).
      let annTrackingId
      for (let i = 0; i < 3; i += 1) {
        IdentityTrackingService.updateFromPerception(createPerceptionWithEmbedding(PERSON_A_DESCRIPTOR))
        const annResult = IdentityTrackingService.updateFromPerception(
          createPerceptionWithEmbedding(PERSON_B_DESCRIPTOR)
        )
        annTrackingId = annResult.track.trackingId
      }

      expect(annTrackingId).not.toBe(christianTrackingId)
      expect(IdentityLockService.getLock(annTrackingId).locked).toBe(true)
      expect(IdentityLockService.getLock(annTrackingId).personId).toBe('ann')
      // The actual bug this milestone fixes: Christian's own lock must
      // still be intact, not stolen by Ann locking in alongside him.
      expect(IdentityLockService.getLock(christianTrackingId).locked).toBe(true)
      expect(IdentityLockService.getLock(christianTrackingId).personId).toBe('christian')
    })

    it("an unrecognised bystander face cannot steal a recognised person's dedicated track", () => {
      FaceRecognitionService.enroll('christian', PERSON_A_DESCRIPTOR)

      let christianTrackingId
      for (let i = 0; i < 3; i += 1) {
        const result = IdentityTrackingService.updateFromPerception(
          createPerceptionWithEmbedding(PERSON_A_DESCRIPTOR)
        )
        christianTrackingId = result.track.trackingId
      }

      const strangerResult = IdentityTrackingService.updateFromPerception(
        createPerceptionWithEmbedding(STRANGER_DESCRIPTOR)
      )

      expect(strangerResult.track.trackingId).not.toBe(christianTrackingId)
      expect(IdentityLockService.getLock(christianTrackingId).locked).toBe(true)
      expect(IdentityLockService.getLock(christianTrackingId).personId).toBe('christian')
    })

    it('a no-face whole-frame fallback still resumes a claimed/locked track (held-through-occlusion continuity is preserved)', () => {
      FaceRecognitionService.enroll('finley', PERSON_A_DESCRIPTOR)

      let finleyTrackingId
      for (let i = 0; i < 3; i += 1) {
        const result = IdentityTrackingService.updateFromPerception(
          createPerceptionWithEmbedding(PERSON_A_DESCRIPTOR)
        )
        finleyTrackingId = result.track.trackingId
      }
      expect(IdentityLockService.getLock(finleyTrackingId).locked).toBe(true)

      // No face at all this frame (faceEmbedding: null) — the same
      // whole-frame fallback VisionPipeline uses when nobody's face is
      // detected. Must resume Finley's own claimed track, not treat it
      // as excluded/unclaimed.
      const heldResult = IdentityTrackingService.updateFromPerception(createPerceptionWithNoFace())

      expect(heldResult.track.trackingId).toBe(finleyTrackingId)
      expect(IdentityLockService.getLock(finleyTrackingId).locked).toBe(true)
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

// v0.16.11: unlike createPerceptionWithEmbedding(null) (which would
// still claim faceFoundation.faceDetected: true, since only the
// embedding is missing), this simulates NO face evidence of any kind
// — faceFoundation itself reports nothing detected — while
// person-presence evidence continues. That's the actual seizure/floor
// scenario: the person is still there (tracked via pose/body
// detection, a separate detector from the face model), but no face
// is visible or detectable at all.
function createPerceptionWithNoFace() {
  return {
    status: 'success',
    provider: 'FACE_RECOGNITION_SMOKE_TEST',
    timestamp: Date.now(),
    confidence: 0.9,
    personPresent: true,
    detections: {
      people: 1,
      faces: 0,
    },
    faceFoundation: {
      faceDetected: false,
      faceCount: 0,
      confidence: 0,
    },
    faceEmbedding: null,
    observationStream: {
      ids: ['person_present'],
      observations: [],
    },
  }
}
