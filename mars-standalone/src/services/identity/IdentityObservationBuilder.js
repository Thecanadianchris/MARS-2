/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Service:
 * IdentityObservationBuilder
 *
 * Purpose:
 * Converts identity evaluation results into neutral structured
 * observations for the wider MARS perception and decision layers.
 *
 * This service does not diagnose, infer medical conditions or
 * make intervention decisions. It only reports identity state.
 *
 * Version:
 * v0.13.0
 *
 * Date Code:
 * 010726
 * ==========================================================
 */

import {
  OBSERVATIONS,
  createObservation,
} from '@/core/observations/ObservationRegistry'

class IdentityObservationBuilder {
  build(identityResult = {}) {
    const observations = []
    const status = identityResult.status || 'unknown'
    const confidence = this.normaliseConfidence(identityResult.confidence)

    if (status === 'known') {
      observations.push(
        createObservation(OBSERVATIONS.IDENTITY_KNOWN, confidence, {
          personId: identityResult.person?.id || null,
          name: identityResult.person?.name || null,
        })
      )
    } else if (status === 'unknown') {
      observations.push(
        createObservation(OBSERVATIONS.IDENTITY_UNKNOWN, confidence, {
          reason: identityResult.reason || 'Identity not recognised.',
        })
      )
    } else {
      observations.push(
        createObservation(OBSERVATIONS.IDENTITY_NOT_AVAILABLE, 0, {
          reason: identityResult.reason || 'Identity evaluation was not available.',
        })
      )
    }

    observations.push(this.buildConfidenceObservation(confidence))

    const faceQualityObservation = this.buildFaceQualityObservation(
      identityResult.faceQuality
    )

    if (faceQualityObservation) {
      observations.push(faceQualityObservation)
    }

    if (identityResult.tracking?.primaryTrackId) {
      observations.push(
        createObservation(
          OBSERVATIONS.IDENTITY_TRACK_ACTIVE,
          confidence,
          {
            trackingId: identityResult.tracking.primaryTrackId,
            activeTrackCount: identityResult.tracking.activeTrackCount || 0,
          }
        )
      )
    }

    if (identityResult.tracking?.personCount > 1) {
      observations.push(
        createObservation(
          OBSERVATIONS.MULTI_PERSON_IDENTITY_TRACKING,
          confidence,
          {
            personCount: identityResult.tracking.personCount,
          }
        )
      )
    }

    return observations
  }

  buildFaceQualityObservation(faceQuality = {}) {
    const score = this.normaliseConfidence(faceQuality.score)
    const label = faceQuality.label || 'unavailable'

    const qualityMap = {
      good: OBSERVATIONS.FACE_QUALITY_GOOD,
      usable: OBSERVATIONS.FACE_QUALITY_USABLE,
      poor: OBSERVATIONS.FACE_QUALITY_POOR,
    }

    const observationId = qualityMap[label]

    if (!observationId) {
      return null
    }

    return createObservation(observationId, score, {
      label,
      usableForRecognition: Boolean(faceQuality.usableForRecognition),
      reasons: faceQuality.reasons || [],
    })
  }

  buildConfidenceObservation(confidence) {
    if (confidence >= 75) {
      return createObservation(OBSERVATIONS.IDENTITY_CONFIDENCE_HIGH, confidence)
    }

    if (confidence >= 40) {
      return createObservation(OBSERVATIONS.IDENTITY_CONFIDENCE_MEDIUM, confidence)
    }

    return createObservation(OBSERVATIONS.IDENTITY_CONFIDENCE_LOW, confidence)
  }

  normaliseConfidence(value) {
    const confidence = Number.isFinite(value) ? value : 0
    return Math.max(0, Math.min(100, Math.round(confidence)))
  }
}

export default IdentityObservationBuilder
