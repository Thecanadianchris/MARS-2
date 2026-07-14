/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Service:
 * FaceRecognitionService
 *
 * Purpose:
 * The pluggable recognizer that fills the slot
 * IdentityTrackingService/RecognitionCandidate were deliberately
 * built to receive back in v0.13.1: identityConfidence and
 * candidateProfiles instead of a hardcoded 0/[].
 *
 * Orchestrates, but does not implement itself:
 *   FaceQualityEngine    — is the face evidence good enough to try?
 *   FaceEmbeddingEngine  — descriptor comparison math
 *   FaceEnrollmentStore  — known descriptors per personId
 *
 * v0.16.1: swapped the matcher from FaceSignatureEngine (8 basic
 * geometry ratios — "Foundation-grade") to FaceEmbeddingEngine
 * (128-d neural face-embedding descriptors from
 * @vladmandic/face-api, computed by FaceEmbeddingService).
 * A live test (14 July 2026, Christian) showed the geometry-ratio
 * approach isn't discriminative enough — an unenrolled person
 * (Ann) was misidentified as the only enrolled person (Christian).
 * The embedding model is actually trained to separate different
 * people's faces, not just measure proportions. This is exactly
 * the "Option B" swap the original v0.16 scoping doc designed
 * this service's interface to allow without touching IdentityEngine,
 * IdentityTrackingService or anything downstream — only *what* is
 * compared changed (embedding vs geometry ratios), not the shape
 * of recognise()/enroll()'s inputs and outputs.
 *
 * Safety: never auto-enrolls. enroll() only ever writes a
 * descriptor for a personId the caller explicitly supplies — the
 * decision of *which* personId that is remains gated by
 * ProfileAuthorisationService/PersonRegistry's existing pending
 * -> confirmed flow, unchanged by this milestone. This service
 * has no opinion on trust; PersonRegistry keeps that.
 *
 * Version:
 * v0.16.1
 *
 * Date Code:
 * 140726
 * ==========================================================
 */

import FaceEmbeddingEngine from './FaceEmbeddingEngine'
import FaceEnrollmentStore from './FaceEnrollmentStore'

// Floor below which we don't even surface a weak candidate profile —
// distinct from (and lower than) the ~0.85 activation threshold that
// gates MemoryIntelligenceService.setActivePerson() downstream. This
// floor just keeps obvious noise out of candidateProfiles entirely.
const MIN_CANDIDATE_CONFIDENCE = 0.5

const RECOGNITION_PROVIDER = 'FACE_RECOGNITION_EMBEDDING_NET'

class FaceRecognitionService {
  /**
   * Attempts to recognise a face from a face-embedding descriptor
   * (see FaceEmbeddingService). Returns a RecognitionCandidate-shaped
   * partial result — never throws, always returns a usable object
   * even on bad input.
   */
  recognise({ embedding, faceQualityResult } = {}) {
    const suitable = Boolean(faceQualityResult?.suitable)

    if (!suitable) {
      return this.emptyResult('face_quality_not_suitable')
    }

    if (!Array.isArray(embedding) || embedding.length === 0) {
      return this.emptyResult('face_embedding_unavailable')
    }

    const match = this.matchBest(embedding)

    if (!match || match.confidence < MIN_CANDIDATE_CONFIDENCE) {
      return {
        status: 'success',
        provider: RECOGNITION_PROVIDER,
        identityConfidence: match?.confidence || 0,
        candidateProfiles: [],
        reason: 'no_match_above_floor',
      }
    }

    return {
      status: 'success',
      provider: RECOGNITION_PROVIDER,
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
   * Enrolls a face-embedding descriptor for a personId. The caller
   * (registration flow / demo bootstrap) is responsible for deciding
   * which personId is appropriate — this method performs no trust
   * checks itself, matching FaceEnrollmentStore's own scope.
   */
  enroll(personId, embedding) {
    if (!Array.isArray(embedding) || embedding.length === 0) {
      return { status: 'rejected', reason: 'face_embedding_unavailable' }
    }

    return FaceEnrollmentStore.enroll(personId, embedding)
  }

  matchBest(embedding) {
    const personIds = FaceEnrollmentStore.getEnrolledPersonIds()

    if (personIds.length === 0) {
      return null
    }

    let best = null

    personIds.forEach((personId) => {
      const samples = FaceEnrollmentStore.getSamples(personId)

      samples.forEach((sample) => {
        const distance = FaceEmbeddingEngine.compareSignatures(embedding, sample)
        const confidence = FaceEmbeddingEngine.distanceToConfidence(distance)

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
      provider: RECOGNITION_PROVIDER,
      identityConfidence: 0,
      candidateProfiles: [],
      reason,
    }
  }

  getStatus() {
    const enrollmentStatus = FaceEnrollmentStore.getStatus()

    return {
      status: 'success',
      provider: RECOGNITION_PROVIDER,
      version: 'v0.16.1',
      recognitionActive: true,
      matcherType: 'face_embedding_net',
      onDeviceOnly: true,
      minCandidateConfidence: MIN_CANDIDATE_CONFIDENCE,
      enrollment: enrollmentStatus,
    }
  }
}

export { MIN_CANDIDATE_CONFIDENCE, RECOGNITION_PROVIDER }
export default new FaceRecognitionService()
