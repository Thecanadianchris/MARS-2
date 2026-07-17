/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Module:
 * RecognitionCandidate
 *
 * Purpose:
 * Defines the standard Recognition Candidate object used by
 * the MARS Identity Recognition architecture.
 *
 * A Recognition Candidate represents a possible person identity
 * produced from neutral vision/tracking information before any
 * trusted identity decision is made.
 *
 * This module is deliberately provider-neutral. MediaPipe,
 * Gemini, OpenCV or any future recognition provider must adapt
 * into this object rather than leaking provider-specific data
 * into the Identity Engine.
 *
 * v0.16.11: new `identityHeld` flag (see IdentityLockService). True
 * when this candidate's identity is being carried by a prior
 * high-confidence lock rather than this frame's own live face
 * evidence — deliberately kept separate from `faceVisible`, which
 * stays an honest, unaffected read of whether a face was actually
 * visible this frame. `deriveState()` now treats a held identity the
 * same as a visible, recognised face for state-derivation purposes,
 * since that is the entire point of a lock: surviving a frame with no
 * face evidence without falling back to a generic TRACKING/unknown
 * state.
 *
 * Version:
 * v0.16.11
 *
 * Date Code:
 * 160726
 * ==========================================================
 */

export const RECOGNITION_STATES = Object.freeze({
  NO_PERSON: 'no_person',
  TRACKING: 'tracking',
  FACE_VISIBLE: 'face_visible',
  QUALITY_TOO_LOW: 'quality_too_low',
  SEARCHING: 'searching',
  RECOGNISED: 'recognised',
  UNKNOWN: 'unknown',
  PENDING_PROFILE: 'pending_profile',
})

class RecognitionCandidate {
  constructor(data = {}) {
    const safeData = data || {}

    this.trackingId = safeData.trackingId || null
    this.timestamp = safeData.timestamp || Date.now()
    this.faceVisible = Boolean(safeData.faceVisible)
    this.faceQuality = this.normaliseScore(safeData.faceQuality)
    this.visionConfidence = this.normaliseScore(safeData.visionConfidence)
    this.trackingConfidence = this.normaliseScore(safeData.trackingConfidence)
    this.identityConfidence = this.normaliseScore(safeData.identityConfidence)
    this.boundingBox = safeData.boundingBox || null
    this.candidateProfiles = Array.isArray(safeData.candidateProfiles)
      ? [...safeData.candidateProfiles]
      : []
    this.identityHeld = Boolean(safeData.identityHeld)
    // v0.16.12: whether the underlying IdentityLockService lock is
    // currently engaged at all (state === 'locked'), independent of
    // whether THIS frame is held or live-confirmed. Drives a
    // persistent "locked on" UI indicator on the video overlay — see
    // VisionFaceOverlay. identityHeld alone can't do this: it's false
    // on every live-confirmed frame, even once fully locked.
    this.identityLocked = Boolean(safeData.identityLocked)
    this.state = safeData.state || this.deriveState()
    this.provider = safeData.provider || 'LOCAL_RECOGNITION_CANDIDATE'
    this.qualityReasons = Array.isArray(safeData.qualityReasons)
      ? [...safeData.qualityReasons]
      : []
    this.metadata = safeData.metadata || {}
  }

  deriveState() {
    if (!this.trackingId) {
      return RECOGNITION_STATES.NO_PERSON
    }

    if (!this.faceVisible) {
      // v0.16.11: a held lock survives exactly this case — no face
      // evidence this frame, but a prior high-confidence lock still
      // has an identity to report. Same identityConfidence/
      // candidateProfiles requirement as the RECOGNISED branch below.
      if (this.identityHeld && this.identityConfidence >= 0.75 && this.candidateProfiles.length > 0) {
        return RECOGNITION_STATES.RECOGNISED
      }

      return RECOGNITION_STATES.TRACKING
    }

    if (this.faceQuality > 0 && this.faceQuality < 0.7) {
      return RECOGNITION_STATES.QUALITY_TOO_LOW
    }

    if (this.identityConfidence >= 0.75 && this.candidateProfiles.length > 0) {
      return RECOGNITION_STATES.RECOGNISED
    }

    return RECOGNITION_STATES.SEARCHING
  }

  normaliseScore(value) {
    const number = Number(value)

    if (Number.isNaN(number)) {
      return 0
    }

    if (number > 1) {
      return Math.max(0, Math.min(1, number / 100))
    }

    return Math.max(0, Math.min(1, number))
  }

  isSuitableForRecognition(threshold = 0.7) {
    return this.faceVisible && this.faceQuality >= this.normaliseScore(threshold)
  }

  hasCandidates() {
    return this.candidateProfiles.length > 0
  }

  isRecognised() {
    return this.state === RECOGNITION_STATES.RECOGNISED
  }

  toJSON() {
    return {
      trackingId: this.trackingId,
      timestamp: this.timestamp,
      faceVisible: this.faceVisible,
      faceQuality: this.faceQuality,
      visionConfidence: this.visionConfidence,
      trackingConfidence: this.trackingConfidence,
      identityConfidence: this.identityConfidence,
      boundingBox: this.boundingBox,
      candidateProfiles: this.candidateProfiles,
      identityHeld: this.identityHeld,
      identityLocked: this.identityLocked,
      state: this.state,
      provider: this.provider,
      qualityReasons: this.qualityReasons,
      metadata: this.metadata,
    }
  }

  static create(data = {}) {
    return new RecognitionCandidate(data)
  }
}

export default RecognitionCandidate
