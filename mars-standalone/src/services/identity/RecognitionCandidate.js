/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Module:
 * RecognitionCandidate
 *
 * Purpose:
 * Defines the standard Recognition Candidate object used
 * throughout the MARS Identity Recognition architecture.
 *
 * This object represents a possible recognised person
 * produced by the Vision subsystem before any identity
 * decision has been made.
 *
 * It intentionally contains no provider-specific information.
 * MediaPipe, OpenCV, Gemini Vision or any future recognition
 * provider must all produce this common format.
 *
 * Identity answers:
 *
 *     "Who might this be?"
 *
 * Vision answers:
 *
 *     "Where is the person?"
 *
 * Decision Intelligence determines:
 *
 *     "What should MARS do?"
 *
 * Version:
 * v0.13.1
 *
 * Date Code:
 * 040726
 * ==========================================================
 */

export const RECOGNITION_STATES = Object.freeze({
  NO_PERSON: 'NO_PERSON',
  TRACKING: 'TRACKING',
  FACE_VISIBLE: 'FACE_VISIBLE',
  QUALITY_TOO_LOW: 'QUALITY_TOO_LOW',
  SEARCHING: 'SEARCHING',
  RECOGNISED: 'RECOGNISED',
  UNKNOWN: 'UNKNOWN',
  PENDING_PROFILE: 'PENDING_PROFILE'
})

class RecognitionCandidate {
  constructor(data = {}) {
    this.trackingId =
      data.trackingId || null

    this.timestamp =
      data.timestamp || Date.now()

    this.faceVisible =
      Boolean(data.faceVisible)

    this.faceQuality =
      Number(data.faceQuality ?? 0)

    this.visionConfidence =
      Number(data.visionConfidence ?? 0)

    this.identityConfidence =
      Number(data.identityConfidence ?? 0)

    this.boundingBox =
      data.boundingBox || null

    this.candidateProfiles =
      Array.isArray(data.candidateProfiles)
        ? [...data.candidateProfiles]
        : []

    this.state =
      data.state || RECOGNITION_STATES.UNKNOWN

    this.provider =
      data.provider || 'LOCAL_VISION'

    this.metadata =
      data.metadata || {}
  }

  isSuitableForRecognition(threshold = 0.70) {
    return (
      this.faceVisible &&
      this.faceQuality >= threshold
    )
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
      identityConfidence: this.identityConfidence,
      boundingBox: this.boundingBox,
      candidateProfiles: this.candidateProfiles,
      state: this.state,
      provider: this.provider,
      metadata: this.metadata
    }
  }

  static create(data = {}) {
    return new RecognitionCandidate(data)
  }
}

export default RecognitionCandidate