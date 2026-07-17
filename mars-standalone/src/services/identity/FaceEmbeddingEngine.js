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
 * v0.16.11: distanceToConfidence() recalibrated. Live testing (16
 * July 2026, Christian, building Identity Lock — see
 * IdentityLockService) surfaced a real problem with the original
 * linear formula (`confidence = 1 - distance / scale`): a genuinely
 * good live match — Christian's own face against his own enrolled
 * samples, distance ≈ 0.27, comfortably inside the 0.6 accept
 * boundary — produced only ~55% confidence, barely above
 * FaceRecognitionService's 0.5 "is this even a candidate" floor.
 * That's not a description of an actually-uncertain match; it's the
 * scale itself compressing the entire useful range. A linear scale
 * only awards ~90%+ confidence to distances under ~0.06 — essentially
 * an identical descriptor, which real frames with ordinary pose/
 * lighting variation don't produce. This was visible live as
 * recognition flickering between "trusted" and "Unknown" frame to
 * frame even for a confidently-enrolled, correctly-matching person.
 *
 * Replaced with a logistic (sigmoid) curve centered on the same 0.6
 * accept/reject boundary: confidence is exactly 0.5 right at that
 * boundary (consistent with 0.5 already being used elsewhere as the
 * "borderline, barely a candidate" floor), rises toward 1 as distance
 * drops below it, and falls toward 0 as distance rises above it — but
 * unlike the linear version, a clearly-good match (well inside the
 * boundary) now reads as clearly-high confidence instead of barely
 * clearing the floor. CONFIDENCE_STEEPNESS (0.15) was chosen so that
 * distance 0.3 (half the boundary — a solid same-person match) maps
 * to ~90% confidence, and distance 0.9 (1.5x the boundary — a clear
 * mismatch) maps to ~10%, roughly symmetric around the midpoint.
 *
 * Version:
 * v0.16.11
 *
 * Date Code:
 * 160726
 * ==========================================================
 */

// Euclidean distance threshold below which two face-embedding
// descriptors are considered a match. 0.6 is the commonly-used
// accept threshold for this class of triplet-loss-trained face
// descriptor model (matches the dlib/face-api.js convention) —
// unlike FaceSignatureEngine's 0.6 scale, this one is backed by a
// model actually trained to separate different people's faces. Now
// used as the midpoint of the confidence curve (see
// distanceToConfidence) rather than a hard linear cutoff.
const DEFAULT_DISTANCE_SCALE = 0.6

// v0.16.11. Controls how sharply confidence rises/falls around
// DEFAULT_DISTANCE_SCALE. Smaller = sharper transition. See the
// module header for how this value was chosen.
const DEFAULT_CONFIDENCE_STEEPNESS = 0.15

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
   * Converts a raw descriptor distance into a 0..1 confidence score
   * using a logistic curve centered on `scale` (see module header for
   * why — v0.16.11 replaced a linear scale that compressed genuinely
   * good matches down near the 0.5 floor). Distance 0 (identical
   * embedding) -> confidence ~1. Distance == scale (the accept/reject
   * boundary) -> confidence exactly 0.5. Distance well beyond scale ->
   * confidence -> 0.
   */
  distanceToConfidence(distance, scale = DEFAULT_DISTANCE_SCALE, steepness = DEFAULT_CONFIDENCE_STEEPNESS) {
    if (!Number.isFinite(distance) || distance < 0) {
      return 0
    }

    const safeScale = scale > 0 ? scale : DEFAULT_DISTANCE_SCALE
    const safeSteepness = steepness > 0 ? steepness : DEFAULT_CONFIDENCE_STEEPNESS
    const confidence = 1 / (1 + Math.exp((distance - safeScale) / safeSteepness))

    return Math.max(0, Math.min(1, confidence))
  }
}

export { DEFAULT_DISTANCE_SCALE, DEFAULT_CONFIDENCE_STEEPNESS }
export default new FaceEmbeddingEngine()
