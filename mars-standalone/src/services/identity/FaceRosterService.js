/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Service:
 * FaceRosterService
 *
 * Purpose:
 * v0.16.4 Multi-Person Simultaneous Recognition. Builds a
 * lightweight, per-frame roster of EVERYONE currently visible
 * (box + best-guess name + confidence), for display/overlay
 * purposes only.
 *
 * Deliberately separate from IdentityEngine: the safety-critical
 * trust / pending-profile / memory-activation machinery
 * (IdentityStateMachine, ProfileAuthorisationService,
 * MemoryIntelligenceService.setActivePerson()) keeps operating
 * exactly as before, gated on the single primary/largest face
 * (perceptionResult.faceEmbedding) — unchanged by this milestone.
 * This service answers "who's on screen right now, for the video
 * overlay", not "who should MARS trust/remember". It re-uses
 * FaceRecognitionService.matchBest() (already public, already
 * per-embedding) rather than duplicating matching logic, so the
 * exact same descriptor-distance math and enrolled-sample data
 * back both the primary identity and the roster.
 *
 * Version:
 * v0.16.4
 *
 * Date Code:
 * 160726
 * ==========================================================
 */

import FaceRecognitionService, { MIN_CANDIDATE_CONFIDENCE } from './FaceRecognitionService'
import PersonRegistry from './PersonRegistry'

class FaceRosterService {
  /**
   * @param {Array} faces - perceptionResult.faces from VisionPipeline
   *   (each: { descriptor, box, landmarks, confidence }). Never throws;
   *   an empty/missing faces array simply yields an empty roster.
   */
  build(faces = []) {
    if (!Array.isArray(faces) || faces.length === 0) {
      return []
    }

    return faces.map((face) => this.buildEntry(face))
  }

  buildEntry(face = {}) {
    const match = FaceRecognitionService.matchBest(face.descriptor)
    const matched = Boolean(match && match.confidence >= MIN_CANDIDATE_CONFIDENCE)
    const profile = matched ? PersonRegistry.getProfile(match.personId) : null

    return {
      box: face.box || null,
      landmarks: face.landmarks || [],
      matched,
      profileId: matched ? match.personId : null,
      displayName: matched ? profile?.displayName || 'Unknown' : 'Unknown',
      confidence: match?.confidence || 0,
    }
  }
}

export default new FaceRosterService()
