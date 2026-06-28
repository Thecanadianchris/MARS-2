/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Service:
 * MovementAnalysisService
 *
 * Purpose:
 * Analyses movement between Vision Pipeline frames using the
 * body centre calculated by PoseSummaryService.
 *
 * This service deliberately contains NO MediaPipe code.
 * It receives structured frame results and compares the latest
 * body centre with the previous visible body centre.
 *
 * Version:
 * v0.10.8
 *
 * Date Code:
 * 280626
 * ==========================================================
 */

class MovementAnalysisService {

  constructor() {

    this.previousFrame = null
    this.movementThreshold = 0.025
    this.highMovementThreshold = 0.08

  }

  analyse(frameResult) {

    if (!frameResult?.poseSummary?.bodyVisible) {

      return {
        movement: 'not_visible',
        direction: 'unknown',
        confidence: 0,
        posture: frameResult?.bodyState?.posture || 'unknown',
        delta: 0,
        risk: 0,
        summary: 'No visible body available for movement analysis.',
      }

    }

    if (!this.previousFrame?.poseSummary?.bodyVisible) {

      this.previousFrame = frameResult

      return {
        movement: 'initialising',
        direction: 'unknown',
        confidence: 40,
        posture: frameResult.bodyState?.posture || 'unknown',
        delta: 0,
        risk: 0,
        summary: 'Movement analysis initialising from first visible body frame.',
      }

    }

    const currentCentre = frameResult.poseSummary.centre
    const previousCentre = this.previousFrame.poseSummary.centre

    const deltaX = currentCentre.x - previousCentre.x
    const deltaY = currentCentre.y - previousCentre.y
    const delta = Math.sqrt((deltaX * deltaX) + (deltaY * deltaY))

    const movement = this.estimateMovement(delta)
    const direction = this.estimateDirection(deltaX, deltaY, delta)
    const confidence = this.estimateConfidence(delta, movement)

    const result = {
      movement,
      direction,
      confidence,
      posture: frameResult.bodyState?.posture || 'unknown',
      delta: Number(delta.toFixed(4)),
      risk: 0,
      summary:
        `Movement estimated as ${movement}. ` +
        `Direction: ${direction}. ` +
        `Frame delta: ${Number(delta.toFixed(4))}.`,
    }

    this.previousFrame = frameResult

    return result

  }

  estimateMovement(delta) {

    if (delta >= this.highMovementThreshold) {

      return 'moving_fast'

    }

    if (delta >= this.movementThreshold) {

      return 'moving'

    }

    return 'stationary'

  }

  estimateDirection(deltaX, deltaY, delta) {

    if (delta < this.movementThreshold) {

      return 'none'

    }

    const absX = Math.abs(deltaX)
    const absY = Math.abs(deltaY)

    if (absX > absY) {

      return deltaX > 0 ? 'right' : 'left'

    }

    return deltaY > 0 ? 'down' : 'up'

  }

  estimateConfidence(delta, movement) {

    if (movement === 'stationary') {

      return 92

    }

    if (delta >= this.highMovementThreshold) {

      return 88

    }

    return 80

  }

  reset() {

    this.previousFrame = null

  }

}

export default new MovementAnalysisService()
