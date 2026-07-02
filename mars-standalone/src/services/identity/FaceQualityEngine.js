/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Service:
 * FaceQualityEngine
 *
 * Purpose:
 * Assesses whether the current face/head signal is suitable
 * for future identity matching.
 *
 * This service does not recognise people, store biometric data
 * or make alerting decisions. It only describes signal quality
 * so the Identity Intelligence pipeline can remain disciplined.
 *
 * Version:
 * v0.13.0
 *
 * Date Code:
 * 010726
 * ==========================================================
 */

class FaceQualityEngine {
  evaluate(input = {}) {
    const faceFoundation = input?.faceFoundation || {}
    const candidate = input?.candidate || {}

    const faceDetected = Boolean(
      faceFoundation.faceDetected || candidate.faceDetected
    )

    if (!faceDetected) {
      return this.createResult({
        status: 'not_available',
        score: 0,
        label: 'unavailable',
        usableForRecognition: false,
        reasons: ['No face signal available.'],
      })
    }

    const faceConfidence = this.normaliseConfidence(
      faceFoundation.confidence ?? candidate.confidence ?? 0
    )

    const orientation =
      faceFoundation?.head?.orientation ||
      candidate.headOrientation ||
      'unknown'

    const orientationScore = this.scoreOrientation(orientation)
    const countScore = this.scoreFaceCount(faceFoundation.faceCount)
    const signalScore = Math.round(
      faceConfidence * 0.65 + orientationScore * 0.25 + countScore * 0.1
    )

    const score = Math.max(0, Math.min(100, signalScore))
    const label = this.getQualityLabel(score)
    const reasons = this.buildReasons({
      score,
      faceConfidence,
      orientation,
      faceCount: faceFoundation.faceCount,
    })

    return this.createResult({
      status: 'success',
      score,
      label,
      usableForRecognition: score >= 60,
      reasons,
      orientation,
      faceConfidence,
    })
  }

  createResult({
    status,
    score,
    label,
    usableForRecognition,
    reasons,
    orientation = 'unknown',
    faceConfidence = 0,
  }) {
    return {
      status,
      score,
      label,
      usableForRecognition,
      orientation,
      faceConfidence,
      reasons,
      summary: `Face quality: ${label} (${score}%).`,
      timestamp: Date.now(),
    }
  }

  scoreOrientation(orientation) {
    const orientationText = String(orientation || '').toLowerCase()

    if (orientationText.includes('level') || orientationText.includes('forward')) {
      return 95
    }

    if (orientationText.includes('up') || orientationText.includes('down')) {
      return 70
    }

    if (orientationText.includes('left') || orientationText.includes('right')) {
      return 65
    }

    return 50
  }

  scoreFaceCount(faceCount) {
    if (!Number.isFinite(faceCount) || faceCount <= 0) {
      return 40
    }

    if (faceCount === 1) {
      return 100
    }

    return 70
  }

  buildReasons({ score, faceConfidence, orientation, faceCount }) {
    const reasons = []

    if (faceConfidence < 50) {
      reasons.push('Face/head confidence is low.')
    }

    if (!orientation || orientation === 'unknown') {
      reasons.push('Head orientation is unknown.')
    }

    if (Number.isFinite(faceCount) && faceCount > 1) {
      reasons.push('Multiple people may be present.')
    }

    if (score >= 80) {
      reasons.push('Face signal is strong enough for future recognition work.')
    } else if (score >= 60) {
      reasons.push('Face signal is usable but not ideal.')
    } else {
      reasons.push('Face signal is not yet reliable enough for recognition.')
    }

    return reasons
  }

  getQualityLabel(score) {
    if (score >= 80) {
      return 'good'
    }

    if (score >= 60) {
      return 'usable'
    }

    if (score > 0) {
      return 'poor'
    }

    return 'unavailable'
  }

  normaliseConfidence(value) {
    const confidence = Number.isFinite(value) ? value : 0
    return Math.max(0, Math.min(100, Math.round(confidence)))
  }
}

export default FaceQualityEngine
