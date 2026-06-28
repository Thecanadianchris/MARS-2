/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Service:
 * MovementAnalysisService
 *
 * Purpose:
 * Analyses movement between Vision Pipeline frames.
 *
 * Version:
 * v0.10.2
 *
 * Date Code:
 * 280626
 * ==========================================================
 */

class MovementAnalysisService {

    constructor() {

        this.previousFrame = null

    }

    analyse(frameResult) {

        if (!this.previousFrame) {

            this.previousFrame = frameResult

            return {

                movement: "initialising",
                confidence: 0,
                posture: "unknown",
                risk: 0

            }

        }

        // Placeholder for MediaPipe/OpenCV analysis

        const result = {

            movement: "stationary",
            confidence: 100,
            posture: "standing",
            risk: 0

        }

        this.previousFrame = frameResult

        return result

    }

    reset() {

        this.previousFrame = null

    }

}

export default new MovementAnalysisService()