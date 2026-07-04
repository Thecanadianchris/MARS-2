/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Service:
 * IdentityTrackingService
 *
 * Purpose:
 * Maintains provider-neutral tracking records for people
 * observed by the Vision subsystem.
 *
 * Tracking answers continuity questions such as:
 *
 *     "Is this the same observed person as last frame?"
 *
 * It does not answer identity, permission or decision questions.
 *
 * Version:
 * v0.13.1
 *
 * Date Code:
 * 040726
 * ==========================================================
 */

import FaceQualityEngine from './FaceQualityEngine'
import IdentityTimelineService from './IdentityTimelineService'
import RecognitionCandidate, { RECOGNITION_STATES } from './RecognitionCandidate'
import RecognitionConfidence from './RecognitionConfidence'

const TRACKING_TIMEOUT_MS = 5000

class IdentityTrackingService {
  constructor() {
    this.tracks = new Map()
    this.sequence = 0
  }

  updateFromPerception(perceptionResult = {}, options = {}) {
    const safePerception = perceptionResult || {}
    const safeOptions = options || {}
    const timestamp = safePerception.timestamp || Date.now()

    if (!this.hasPersonEvidence(safePerception)) {
      this.expireOldTracks(timestamp)
      return {
        status: 'no_person',
        provider: 'LOCAL_IDENTITY_TRACKING_SERVICE',
        version: 'v0.13.1',
        track: null,
        candidate: RecognitionCandidate.create({
          state: RECOGNITION_STATES.NO_PERSON,
          timestamp,
        }),
      }
    }

    const trackingId = safeOptions.trackingId || safePerception.trackingId || this.allocateTrackingId()
    const existingTrack = this.tracks.get(trackingId)
    const faceQuality = FaceQualityEngine.evaluate({
      ...safePerception,
      faceVisible: this.hasFaceEvidence(safePerception),
      faceFoundation: safePerception.faceFoundation,
      confidence:
        safePerception.faceFoundation?.confidence ??
        safePerception.detections?.confidence ??
        safePerception.confidence ??
        0.75,
    })

    const trackingConfidence = existingTrack ? 0.95 : 0.75
    const recognitionConfidence = RecognitionConfidence.calculate({
      visionConfidence: safePerception.confidence ?? 0.8,
      trackingConfidence,
      faceQuality: faceQuality.quality,
      identityConfidence: 0,
    })

    const track = {
      trackingId,
      status: 'active',
      firstSeen: existingTrack?.firstSeen || timestamp,
      lastSeen: timestamp,
      framesSeen: (existingTrack?.framesSeen || 0) + 1,
      faceVisible: faceQuality.suitable || this.hasFaceEvidence(safePerception),
      faceQuality: faceQuality.quality,
      trackingConfidence,
      boundingBox: safePerception.boundingBox || safePerception.personBox || null,
      metadata: {
        provider: safePerception.provider || 'UNKNOWN_VISION_PROVIDER',
      },
    }

    this.tracks.set(trackingId, track)

    const candidate = RecognitionCandidate.create({
      trackingId,
      timestamp,
      faceVisible: track.faceVisible,
      faceQuality: faceQuality.quality,
      visionConfidence: safePerception.confidence ?? 0.8,
      trackingConfidence,
      identityConfidence: 0,
      boundingBox: track.boundingBox,
      candidateProfiles: [],
      state: faceQuality.suitable
        ? RECOGNITION_STATES.SEARCHING
        : RECOGNITION_STATES.QUALITY_TOO_LOW,
      qualityReasons: faceQuality.reasons,
      metadata: {
        faceQuality,
        recognitionConfidence,
      },
    })

    IdentityTimelineService.addEvent(trackingId, {
      type: 'tracking_updated',
      label: 'Identity tracking updated from perception result.',
      state: candidate.state,
      confidence: recognitionConfidence.confidence,
      metadata: {
        faceVisible: track.faceVisible,
        faceQuality: faceQuality.quality,
        framesSeen: track.framesSeen,
      },
    })

    this.expireOldTracks(timestamp)

    return {
      status: 'success',
      provider: 'LOCAL_IDENTITY_TRACKING_SERVICE',
      version: 'v0.13.1',
      track,
      candidate,
      faceQuality,
      recognitionConfidence,
      timeline: IdentityTimelineService.getTimeline(trackingId),
    }
  }

  getTrack(trackingId) {
    return this.tracks.get(trackingId) || null
  }

  getActiveTracks() {
    return [...this.tracks.values()].filter((track) => track.status === 'active')
  }

  expireOldTracks(now = Date.now()) {
    this.tracks.forEach((track, trackingId) => {
      if (now - track.lastSeen > TRACKING_TIMEOUT_MS) {
        this.tracks.set(trackingId, {
          ...track,
          status: 'expired',
        })

        IdentityTimelineService.addEvent(trackingId, {
          type: 'tracking_expired',
          label: 'Identity tracking expired after timeout.',
          state: 'expired',
        })
      }
    })
  }

  allocateTrackingId() {
    this.sequence += 1
    return `TRK-${String(this.sequence).padStart(6, '0')}`
  }

  hasPersonEvidence(perceptionResult = {}) {
    const safePerception = perceptionResult || {}
    const observationIds = new Set([
      ...(safePerception.observationStream?.ids || []),
      ...(safePerception.observationStream?.observations || []).map(
        (observation) => observation.id
      ),
    ])

    return (
      observationIds.has('person_present') ||
      Boolean(safePerception.detections?.people > 0) ||
      Boolean(safePerception.personPresent)
    )
  }

  hasFaceEvidence(perceptionResult = {}) {
    const safePerception = perceptionResult || {}

    return (
      Boolean(safePerception.faceFoundation?.faceDetected) ||
      Boolean(safePerception.faceFoundation?.faceCount > 0) ||
      Boolean(safePerception.detections?.faces > 0) ||
      Boolean(safePerception.faceVisible)
    )
  }

  reset() {
    this.tracks.clear()
    this.sequence = 0
    IdentityTimelineService.reset()
  }
}

export default new IdentityTrackingService()
