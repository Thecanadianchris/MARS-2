/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Engine:
 * FaceQualityEngine
 *
 * Purpose:
 * Evaluates whether visible face evidence is suitable for
 * future identity recognition.
 *
 * This engine does not recognise a face. It only assesses
 * quality, stability and suitability before a recognition
 * provider is allowed to contribute an identity candidate.
 *
 * Version:
 * v0.13.1
 *
 * Date Code:
 * 040726
 * ==========================================================
 */

class FaceQualityEngine {
  evaluate(faceInput = {}, options = {}) {
    const safeInput = faceInput || {}
    const safeOptions = options || {}
    const threshold = this.clamp(safeOptions.threshold ?? 0.7)

    const faceVisible = Boolean(
      safeInput.faceVisible ||
        safeInput.faceDetected ||
        safeInput.faceFoundation?.faceDetected ||
        safeInput.faceFoundation?.faceCount > 0
    )

    if (!faceVisible) {
      return this.createResult({
        suitable: false,
        quality: 0,
        threshold,
        reasons: ['face_not_visible'],
      })
    }

    const faceConfidence = this.clamp(
      safeInput.faceConfidence ??
        safeInput.confidence ??
        safeInput.faceFoundation?.confidence ??
        0
    )

    const sizeScore = this.clamp(safeInput.sizeScore ?? safeInput.faceSize ?? 1)
    const angleScore = this.clamp(safeInput.angleScore ?? safeInput.faceAngle ?? 1)
    const blurScore = this.clamp(safeInput.blurScore ?? safeInput.sharpness ?? 1)
    const lightingScore = this.clamp(safeInput.lightingScore ?? safeInput.lighting ?? 1)
    const occlusionScore = this.clamp(safeInput.occlusionScore ?? 1)
    const stabilityScore = this.clamp(safeInput.stabilityScore ?? 1)

    const quality = this.clamp(
      (faceConfidence +
        sizeScore +
        angleScore +
        blurScore +
        lightingScore +
        occlusionScore +
        stabilityScore) /
        7
    )

    const reasons = []

    if (faceConfidence < 0.5) reasons.push('low_face_confidence')
    if (sizeScore < 0.5) reasons.push('face_too_small')
    if (angleScore < 0.5) reasons.push('face_angle_unsuitable')
    if (blurScore < 0.5) reasons.push('face_blur_high')
    if (lightingScore < 0.5) reasons.push('lighting_unsuitable')
    if (occlusionScore < 0.5) reasons.push('face_occluded')
    if (stabilityScore < 0.5) reasons.push('face_unstable')
    if (quality < threshold) reasons.push('quality_below_threshold')

    return this.createResult({
      suitable: quality >= threshold,
      quality,
      threshold,
      reasons,
      scores: {
        faceConfidence,
        sizeScore,
        angleScore,
        blurScore,
        lightingScore,
        occlusionScore,
        stabilityScore,
      },
    })
  }

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

  createResult({ suitable, quality, threshold, reasons, scores = {} }) {
    return {
      status: 'success',
      provider: 'LOCAL_FACE_QUALITY_ENGINE',
      version: 'v0.13.1',
      suitable: Boolean(suitable),
      quality: this.clamp(quality),
      threshold: this.clamp(threshold),
      reasons: Array.isArray(reasons) ? reasons : [],
      scores,
      timestamp: Date.now(),
    }
  }
}

export default new FaceQualityEngine()
