/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Service:
 * BodyStateEngine
 *
 * Purpose:
 * Converts pose measurements into meaningful body states.
 *
 * This engine deliberately contains NO MediaPipe code.
 * It only interprets measurements produced by
 * PoseSummaryService.
 *
 * Version:
 * v0.10.6
 *
 * Date Code:
 * 280626
 * ==========================================================
 */

class BodyStateEngine {

  evaluate(summary) {

    if (!summary || !summary.bodyVisible) {

      return {
        state: "not_detected",
        posture: "unknown",
        confidence: 0,
        riskModifier: 0,
        summary: "No body detected."
      }

    }

    const m = summary.measurements

    //------------------------------------------
    // Basic posture
    //------------------------------------------

    let posture = "standing"

    if (summary.posture === "possibly_lying_or_sideways") {

      posture = "lying"

    }

    else if (summary.posture === "partial_body") {

      posture = "unknown"

    }

    else if (m.bodyVerticality < 0.12) {

      posture = "lying"

    }

    else if (m.torsoLength < 0.15) {

      posture = "sitting"

    }

    //------------------------------------------
    // Risk Modifier
    //------------------------------------------

    let riskModifier = 0

    if (posture === "lying")
        riskModifier = 4

    //------------------------------------------
    // Result
    //------------------------------------------

    return {

      state: posture,

      posture,

      confidence: summary.confidence,

      riskModifier,

      summary:
        `Body state estimated as ${posture}.`

    }

  }

}

export default new BodyStateEngine()