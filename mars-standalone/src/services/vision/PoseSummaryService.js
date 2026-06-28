/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Service:
 * PoseSummaryService
 *
 * Purpose:
 * Converts MediaPipe pose landmarks into useful MARS posture
 * and body-position summary data.
 *
 * Version:
 * v0.10.5
 *
 * Date Code:
 * 280626
 * ==========================================================
 */

class PoseSummaryService {
  summarise(poseResult) {
    const landmarks = poseResult?.landmarks || []

    if (!poseResult?.poseDetected || landmarks.length < 33) {
      return this.emptySummary()
    }

    const nose = landmarks[0]
    const leftShoulder = landmarks[11]
    const rightShoulder = landmarks[12]
    const leftHip = landmarks[23]
    const rightHip = landmarks[24]

    const shoulderCentre = this.midpoint(leftShoulder, rightShoulder)
    const hipCentre = this.midpoint(leftHip, rightHip)
    const bodyCentre = this.midpoint(shoulderCentre, hipCentre)

    const shoulderWidth = this.distance(leftShoulder, rightShoulder)
    const hipWidth = this.distance(leftHip, rightHip)
    const torsoLength = this.distance(shoulderCentre, hipCentre)

    const bodyVerticality = Math.abs(shoulderCentre.y - hipCentre.y)
    const bodyHorizontality = Math.abs(leftShoulder.y - rightShoulder.y)

    const posture = this.estimatePosture({
      nose,
      shoulderCentre,
      hipCentre,
      shoulderWidth,
      torsoLength,
      bodyVerticality,
      bodyHorizontality,
    })

    return {
      bodyVisible: true,
      upperBodyVisible: true,
      landmarkCount: landmarks.length,

      centre: {
        x: Number(bodyCentre.x.toFixed(3)),
        y: Number(bodyCentre.y.toFixed(3)),
      },

      measurements: {
        shoulderWidth: Number(shoulderWidth.toFixed(3)),
        hipWidth: Number(hipWidth.toFixed(3)),
        torsoLength: Number(torsoLength.toFixed(3)),
        bodyVerticality: Number(bodyVerticality.toFixed(3)),
        bodyHorizontality: Number(bodyHorizontality.toFixed(3)),
      },

      posture,

      confidence: 90,

      summary: `Body visible. Estimated posture: ${posture}.`,
    }
  }

  estimatePosture(data) {
    const {
      nose,
      shoulderCentre,
      hipCentre,
      shoulderWidth,
      torsoLength,
      bodyVerticality,
    } = data

    if (!nose || !shoulderCentre || !hipCentre) {
      return 'unknown'
    }

    if (torsoLength < 0.08) {
      return 'partial_body'
    }

    if (bodyVerticality < shoulderWidth * 0.45) {
      return 'possibly_lying_or_sideways'
    }

    if (nose.y < shoulderCentre.y && shoulderCentre.y < hipCentre.y) {
      return 'standing_or_sitting'
    }

    return 'unknown'
  }

  midpoint(a, b) {
    return {
      x: (a.x + b.x) / 2,
      y: (a.y + b.y) / 2,
      z: ((a.z || 0) + (b.z || 0)) / 2,
    }
  }

  distance(a, b) {
    const dx = a.x - b.x
    const dy = a.y - b.y
    const dz = (a.z || 0) - (b.z || 0)

    return Math.sqrt(dx * dx + dy * dy + dz * dz)
  }

  emptySummary() {
    return {
      bodyVisible: false,
      upperBodyVisible: false,
      landmarkCount: 0,
      centre: null,
      measurements: null,
      posture: 'not_detected',
      confidence: 0,
      summary: 'No complete body pose available.',
    }
  }
}

export default new PoseSummaryService()