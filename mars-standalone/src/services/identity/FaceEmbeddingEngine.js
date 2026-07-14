/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Engine:
 * FaceEmbeddingEngine
 *
 * Purpose:
 * Pure comparison math for face-embedding descriptors (v0.16.1
 * matcher upgrade). Deliberately mirrors FaceSignatureEngine's
 * shape (compareSignatures/distanceToConfidence) so
 * FaceRecognitionService's orchestration logic barely changes —
 * only *what* it compares changes, from 8 geometry ratios to a
 * 128-d neural embedding.
 *
 * This module has no ML in it and needs no browser APIs, so it's
 * fully unit-testable with synthetic descriptor arrays — the real
 * embedding computation (FaceEmbeddingService, @vladmandic/face-api)
 * is not exercised in tests, same convention already used for
 * MediaPipe's PoseLandmarker/FaceLandmarker.
 *
 * Version:
 * v0.16.1
 *
 * Date Code:
 * 140726
 * ==========================================================
 */

// Euclidean distance threshold below which two face-embedding
// descriptors are considered a match. 0.6 is the commonly-used
// accept threshold for this class of triplet-loss-trained face
// descriptor model (matches the dlib/face-api.js convention) —
// unlike FaceSignatureEngine's 0.6 scale, this one is backed by a
// model actually trained to separate different people's faces.
const DEFAULT_DISTANCE_SCALE = 0.6

class FaceEmbeddingEngine {
  /**
   * Euclidean distance between two equal-length descriptor vectors.
   * Returns Infinity for malformed/mismatched input so callers never
   * accidentally treat a broken comparison as a strong match.
   */
  compareSignatures(descriptorA, descriptorB) {
    if (
      !Array.isArray(descriptorA) ||
      !Array.isArray(descriptorB) ||
      descriptorA.length !== descriptorB.length ||
      descriptorA.length === 0
    ) {
      return Infinity
    }

    let sumSquares = 0

    for (let i = 0; i < descriptorA.length; i += 1) {
      const diff = descriptorA[i] - descriptorB[i]
      sumSquares += diff * diff
    }

    return Math.sqrt(sumSquares)
  }

  /**
   * Converts a raw descriptor distance into a 0..1 confidence score.
   * Distance 0 (identical embedding) -> confidence 1.
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

export { DEFAULT_DISTANCE_SCALE }
export default new FaceEmbeddingEngine()
