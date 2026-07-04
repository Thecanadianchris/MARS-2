/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Module:
 * RecognitionConfidence
 *
 * Purpose:
 * Provides confidence calculation utilities for the MARS
 * Identity Recognition architecture.
 *
 * This module does not recognise people. It only normalises
 * and combines confidence values produced by Vision, Tracking,
 * Face Quality and future recognition providers.
 *
 * Version:
 * v0.13.1
 *
 * Date Code:
 * 040726
 * ==========================================================
 */

const DEFAULT_WEIGHTS = Object.freeze({
  visionConfidence: 0.25,
  trackingConfidence: 0.25,
  faceQuality: 0.25,
  identityConfidence: 0.25,
})

class RecognitionConfidence {
  clamp(value) {
    const number = Number(value)

    if (Number.isNaN(number)) {
      return 0
    }

    if (number > 1) {
      return Math.max(0, Math.min(1, number / 100))
    }

    return Math.max(0, Math.min(1, number))
  }

  calculate(scores = {}, weights = DEFAULT_WEIGHTS) {
    const safeScores = scores || {}
    const safeWeights = weights || DEFAULT_WEIGHTS

    const visionConfidence = this.clamp(safeScores.visionConfidence)
    const trackingConfidence = this.clamp(safeScores.trackingConfidence)
    const faceQuality = this.clamp(safeScores.faceQuality)
    const identityConfidence = this.clamp(safeScores.identityConfidence)

    const totalWeight =
      this.clamp(safeWeights.visionConfidence) +
      this.clamp(safeWeights.trackingConfidence) +
      this.clamp(safeWeights.faceQuality) +
      this.clamp(safeWeights.identityConfidence)

    const divisor = totalWeight || 1

    const weightedScore =
      (visionConfidence * this.clamp(safeWeights.visionConfidence) +
        trackingConfidence * this.clamp(safeWeights.trackingConfidence) +
        faceQuality * this.clamp(safeWeights.faceQuality) +
        identityConfidence * this.clamp(safeWeights.identityConfidence)) /
      divisor

    return {
      status: 'success',
      provider: 'LOCAL_RECOGNITION_CONFIDENCE',
      version: 'v0.13.1',
      confidence: this.clamp(weightedScore),
      description: this.describe(weightedScore),
      scores: {
        visionConfidence,
        trackingConfidence,
        faceQuality,
        identityConfidence,
      },
      weights: {
        ...safeWeights,
      },
    }
  }

  describe(confidence = 0) {
    const value = this.clamp(confidence)

    if (value >= 0.9) return 'very_high'
    if (value >= 0.75) return 'high'
    if (value >= 0.5) return 'medium'
    if (value >= 0.25) return 'low'

    return 'very_low'
  }

  isReliable(confidence = 0, threshold = 0.75) {
    return this.clamp(confidence) >= this.clamp(threshold)
  }
}

export default new RecognitionConfidence()
