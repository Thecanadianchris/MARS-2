/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Engine:
 * FaceSignatureEngine
 *
 * Purpose:
 * Derives a lightweight, deterministic face "signature" from
 * MediaPipe face-mesh landmarks, and compares two signatures.
 *
 * SUPERSEDED as of v0.16.1: this was the v0.16 Face Recognition
 * Foundation's original matcher ("Option A" from the scoping doc)
 * — 8 geometry ratios, not a trained face-embedding model. A live
 * test (14 July 2026, Christian) showed it isn't discriminative
 * enough between two different real people (an unenrolled person
 * was misidentified as the only enrolled one). FaceRecognitionService
 * now uses FaceEmbeddingEngine/FaceEmbeddingService instead. This
 * module is kept (not deleted) — it's still fully real, still unit
 * tested, and remains available as a cheap secondary geometry check
 * if a future milestone wants to combine it with the embedding
 * match rather than replace it outright.
 *
 * All landmarks are MediaPipe's normalised face-mesh coordinates
 * (x, y in [0,1] relative to the image). The signature is built
 * from ratios of distances, normalised against inter-ocular
 * distance, so it is reasonably scale-invariant (distance from
 * camera) even though it is not rotation/lighting invariant.
 *
 * Landmark indices used are the standard MediaPipe Face Mesh
 * indices (468/478-point model):
 *   1   = nose tip
 *   10  = forehead top
 *   152 = chin bottom
 *   33  = left eye outer corner
 *   133 = left eye inner corner
 *   362 = right eye inner corner
 *   263 = right eye outer corner
 *   61  = mouth left corner
 *   291 = mouth right corner
 *   234 = left face edge (cheek/jaw)
 *   454 = right face edge (cheek/jaw)
 *
 * Version:
 * v0.16.0
 *
 * Date Code:
 * 130726
 * ==========================================================
 */

const LANDMARK_INDEX = Object.freeze({
  NOSE_TIP: 1,
  FOREHEAD_TOP: 10,
  CHIN_BOTTOM: 152,
  LEFT_EYE_OUTER: 33,
  LEFT_EYE_INNER: 133,
  RIGHT_EYE_INNER: 362,
  RIGHT_EYE_OUTER: 263,
  MOUTH_LEFT: 61,
  MOUTH_RIGHT: 291,
  FACE_EDGE_LEFT: 234,
  FACE_EDGE_RIGHT: 454,
})

const REQUIRED_INDICES = Object.values(LANDMARK_INDEX)

// Empirically chosen scale for the "distance -> confidence" curve.
// This is a Foundation-grade matcher: the exact constant matters far
// less than the fact the pipeline, threshold and gating are real.
const DEFAULT_DISTANCE_SCALE = 0.6

class FaceSignatureEngine {
  /**
   * Builds a normalised geometry signature from MediaPipe face-mesh
   * landmarks. Returns null if the landmark set is unusable (missing
   * points, degenerate interocular distance) rather than throwing.
   */
  computeSignature(landmarks = []) {
    if (!Array.isArray(landmarks) || landmarks.length === 0) {
      return null
    }

    if (!this.hasRequiredLandmarks(landmarks)) {
      return null
    }

    const point = (index) => landmarks[index]

    const leftEyeOuter = point(LANDMARK_INDEX.LEFT_EYE_OUTER)
    const leftEyeInner = point(LANDMARK_INDEX.LEFT_EYE_INNER)
    const rightEyeInner = point(LANDMARK_INDEX.RIGHT_EYE_INNER)
    const rightEyeOuter = point(LANDMARK_INDEX.RIGHT_EYE_OUTER)
    const nose = point(LANDMARK_INDEX.NOSE_TIP)
    const forehead = point(LANDMARK_INDEX.FOREHEAD_TOP)
    const chin = point(LANDMARK_INDEX.CHIN_BOTTOM)
    const mouthLeft = point(LANDMARK_INDEX.MOUTH_LEFT)
    const mouthRight = point(LANDMARK_INDEX.MOUTH_RIGHT)
    const faceEdgeLeft = point(LANDMARK_INDEX.FACE_EDGE_LEFT)
    const faceEdgeRight = point(LANDMARK_INDEX.FACE_EDGE_RIGHT)

    const interocular = this.distance(leftEyeOuter, rightEyeOuter)

    if (!interocular || interocular < 1e-6) {
      return null
    }

    const eyeMid = this.midpoint(leftEyeOuter, rightEyeOuter)
    const mouthMid = this.midpoint(mouthLeft, mouthRight)

    const signature = [
      this.distance(eyeMid, nose) / interocular,
      this.distance(nose, mouthMid) / interocular,
      this.distance(mouthLeft, mouthRight) / interocular,
      this.distance(faceEdgeLeft, faceEdgeRight) / interocular,
      this.distance(forehead, chin) / interocular,
      this.distance(leftEyeOuter, faceEdgeLeft) / interocular,
      this.distance(rightEyeOuter, faceEdgeRight) / interocular,
      this.distance(leftEyeInner, rightEyeInner) / interocular,
    ]

    if (signature.some((value) => !Number.isFinite(value))) {
      return null
    }

    return signature
  }

  hasRequiredLandmarks(landmarks) {
    const maxIndex = Math.max(...REQUIRED_INDICES)

    if (landmarks.length <= maxIndex) {
      return false
    }

    return REQUIRED_INDICES.every((index) => this.isValidPoint(landmarks[index]))
  }

  isValidPoint(point) {
    return Boolean(point) && Number.isFinite(point.x) && Number.isFinite(point.y)
  }

  distance(a, b) {
    if (!this.isValidPoint(a) || !this.isValidPoint(b)) {
      return NaN
    }

    return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2)
  }

  midpoint(a, b) {
    return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
  }

  /**
   * Euclidean distance between two equal-length signature vectors.
   * Returns Infinity for malformed/mismatched input so callers never
   * accidentally treat a broken comparison as a strong match.
   */
  compareSignatures(signatureA, signatureB) {
    if (
      !Array.isArray(signatureA) ||
      !Array.isArray(signatureB) ||
      signatureA.length !== signatureB.length ||
      signatureA.length === 0
    ) {
      return Infinity
    }

    let sumSquares = 0

    for (let i = 0; i < signatureA.length; i += 1) {
      const diff = signatureA[i] - signatureB[i]
      sumSquares += diff * diff
    }

    return Math.sqrt(sumSquares)
  }

  /**
   * Converts a raw signature distance into a 0..1 confidence score.
   * Distance 0 (identical geometry) -> confidence 1.
   * Distance >= scale -> confidence 0.
   */
  distanceToConfidence(distance, scale = DEFAULT_DISTANCE_SCALE) {
    if (!Number.isFinite(distance) || distance < 0) {
      return 0
    }

    const safeScale = scale > 0 ? scale : DEFAULT_DISTANCE_SCALE
    const confidence = 1 - distance / safeScale

    return Math.max(0, Math.min(1, confidence))
  }
}

export { LANDMARK_INDEX, DEFAULT_DISTANCE_SCALE }
export default new FaceSignatureEngine()
