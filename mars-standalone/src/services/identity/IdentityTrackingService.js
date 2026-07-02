/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Service:
 * IdentityTrackingService
 *
 * Purpose:
 * Creates short-lived tracking references for people currently
 * visible to the Identity Foundation layer.
 *
 * This service does not persist identities or recognise people.
 * It provides continuity hints for future identity matching.
 *
 * Version:
 * v0.13.0
 *
 * Date Code:
 * 010726
 * ==========================================================
 */

class IdentityTrackingService {
  constructor() {
    this.nextTrackingNumber = 1
    this.lastTrackingState = null
  }

  evaluate({ detectedPeople = [], faceFoundation = {}, faceQuality = {} } = {}) {
    const faceCount = Number.isFinite(faceFoundation?.faceCount)
      ? faceFoundation.faceCount
      : 0

    const personCount = Math.max(detectedPeople.length, faceCount)
    const tracks = this.createTracks({ detectedPeople, personCount, faceQuality })

    const trackingState = {
      enabled: true,
      personCount,
      multiPerson: personCount > 1,
      activeTrackCount: tracks.length,
      primaryTrackId: tracks[0]?.trackingId || null,
      tracks,
      timestamp: Date.now(),
    }

    this.lastTrackingState = trackingState
    return trackingState
  }

  createTracks({ detectedPeople, personCount, faceQuality }) {
    const count = Math.max(0, personCount)

    return Array.from({ length: count }).map((_, index) => {
      const detectedPerson = detectedPeople[index] || {}
      const trackingId = detectedPerson.trackingId || this.createTrackingId(index)

      return {
        trackingId,
        index,
        status: 'active',
        identityStatus: 'unknown',
        confidence: this.normaliseConfidence(detectedPerson.confidence),
        faceQuality: faceQuality.label || 'unknown',
        usableForRecognition: Boolean(faceQuality.usableForRecognition),
        source: detectedPerson.source || 'identity_tracking_service',
      }
    })
  }

  createTrackingId(index) {
    const trackingNumber = String(this.nextTrackingNumber + index).padStart(3, '0')

    if (index === 0) {
      this.nextTrackingNumber += 1
    }

    return `TRACK-${trackingNumber}`
  }

  normaliseConfidence(value) {
    const confidence = Number.isFinite(value) ? value : 0
    return Math.max(0, Math.min(100, Math.round(confidence)))
  }
}

export default IdentityTrackingService
