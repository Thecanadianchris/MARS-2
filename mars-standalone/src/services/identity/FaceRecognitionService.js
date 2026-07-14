/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Service:
 * FaceRecognitionService
 *
 * Purpose:
 * The v0.16 Face Recognition Foundation's pluggable recognizer.
 * Fills the slot IdentityTrackingService/RecognitionCandidate
 * were deliberately built to receive back in v0.13.1: this is
 * the first real provider producing identityConfidence and
 * candidateProfiles instead of the previous hardcoded 0/[].
 *
 * Orchestrates, but does not implement itself:
 *   FaceQualityEngine    — is the face evidence good enough to try?
 *   FaceSignatureEngine  — geometry signature + comparison
 *   FaceEnrollmentStore  — known signatures per personId
 *
 * This is intentionally a provider behind a small interface
 * (recognise/enroll), matching the "honest-stub Foundation"
 * decision (scoping doc Option C): the matcher itself (currently
 * landmark-geometry, Option A) can be swapped for a stronger
 * embedding model later (Option B) without touching
 * IdentityEngine, IdentityTrackingService or anything downstream.
 *
 * Safety: never auto-enrolls. enroll() only ever writes a
 * signature for a personId the caller explicitly supplies — the
 * decision of *which* personId that is remains gated by
 * ProfileAuthorisationService/PersonRegistry's existing pending
 * -> confirmed flow, same as before this milestone. This service
 * has no opinion on trust; PersonRegistry keeps that.
 *
 * Version:
 * v0.16.0
 *
 * Date Code:
 * 130726
 * ==========================================================
 */

import FaceEnrollmentStore from './FaceEnrollmentStore'
import FaceSignatureEngine from './FaceSignatureEngine'

// Floor below which we don't even surface a weak candidate profile —
// distinct from (and lower than) the ~0.85 activation threshold that
// gates MemoryIntelligenceService.setActivePerson() downstream. This
// floor just keeps obvious noise out of candidateProfiles entirely.
const MIN_CANDIDATE_CONFIDENCE = 0.5

class FaceRecognitionService {
  /**
   * Attempts to recognise a face from MediaPipe face-mesh landmarks.
   * Returns a RecognitionCandidate-shaped partial result — never
   * throws, always returns a usable object even on bad input.
   */
  recognise({ landmarks, faceQualityResult } = {}) {
    const suitable = Boolean(faceQualityResult?.suitable)

    if (!suitable) {
      return this.emptyResult('face_quality_not_suitable')
    }

    const signature = FaceSignatureEngine.computeSignature(landmarks)

    if (!signature) {
      return this.emptyResult('face_signature_unavailable')
    }

    const match = this.matchBest(signature)

    if (!match || match.confidence < MIN_CANDIDATE_CONFIDENCE) {
      return {
        status: 'success',
        provider: 'FACE_RECOGNITION_LANDMARK_GEOMETRY',
        identityConfidence: match?.confidence || 0,
        candidateProfiles: [],
        reason: 'no_match_above_floor',
      }
    }

    return {
      status: 'success',
      provider: 'FACE_RECOGNITION_LANDMARK_GEOMETRY',
      identityConfidence: match.confidence,
      candidateProfiles: [
        {
          profileId: match.personId,
          confidence: match.confidence,
        },
      ],
      reason: 'matched',
    }
  }

  /**
   * Enrolls a signature for a personId. The caller (registration
   * flow / demo bootstrap) is responsible for deciding which
   * personId is appropriate — this method performs no trust checks
   * itself, matching FaceEnrollmentStore's own scope.
   */
  enroll(personId, landmarks) {
    const signature = FaceSignatureEngine.computeSignature(landmarks)

    if (!signature) {
      return { status: 'rejected', reason: 'face_signature_unavailable' }
    }

    return FaceEnrollmentStore.enroll(personId, signature)
  }

  matchBest(signature) {
    const personIds = FaceEnrollmentStore.getEnrolledPersonIds()

    if (personIds.length === 0) {
      return null
    }

    let best = null

    personIds.forEach((personId) => {
      const samples = FaceEnrollmentStore.getSamples(personId)

      samples.forEach((sample) => {
        const distance = FaceSignatureEngine.compareSignatures(signature, sample)
        const confidence = FaceSignatureEngine.distanceToConfidence(distance)

        if (!best || confidence > best.confidence) {
          best = { personId, distance, confidence }
        }
      })
    })

    return best
  }

  emptyResult(reason) {
    return {
      status: 'success',
      provider: 'FACE_RECOGNITION_LANDMARK_GEOMETRY',
      identityConfidence: 0,
      candidateProfiles: [],
      reason,
    }
  }

  getStatus() {
    const enrollmentStatus = FaceEnrollmentStore.getStatus()

    return {
      status: 'success',
      provider: 'FACE_RECOGNITION_LANDMARK_GEOMETRY',
      version: 'v0.16.0',
      recognitionActive: true,
      matcherType: 'landmark_geometry',
      onDeviceOnly: true,
      minCandidateConfidence: MIN_CANDIDATE_CONFIDENCE,
      enrollment: enrollmentStatus,
    }
  }
}

export { MIN_CANDIDATE_CONFIDENCE }
export default new FaceRecognitionService()
