/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Module:
 * VisionPipeline
 *
 * Purpose:
 * Central processing pipeline for camera frames.
 *
 * Responsibilities:
 * - Receive captured camera frames
 * - Run local pose detection
 * - Summarise body posture
 * - Evaluate body state
 * - Run movement analysis
 * - Produce a structured vision result for the UI
 *
 * Version:
 * v0.10.6
 *
 * Date Code:
 * 280626
 * ==========================================================
 */

import MovementAnalysisService from './MovementAnalysisService'
import PoseDetectionService from './PoseDetectionService'
import PoseSummaryService from './PoseSummaryService'
import BodyStateEngine from './BodyStateEngine'

class VisionPipeline {
  async processFrame(frame) {
    if (!frame) {
      return this.errorResult('No frame supplied to VisionPipeline.')
    }

    const startTime = performance.now()

    const poseResult = await PoseDetectionService.detectPose(frame)
    const poseSummary = PoseSummaryService.summarise(poseResult)
    const bodyState = BodyStateEngine.evaluate(poseSummary)

    const baseRiskLevel = 0
    const calculatedRiskLevel = Math.min(
      10,
      baseRiskLevel + bodyState.riskModifier
    )

    const baseResult = {
      status: 'success',
      provider: 'LOCAL_PIPELINE',
      timestamp: Date.now(),

      frame: {
        width: frame.width,
        height: frame.height,
        timestamp: frame.timestamp,
      },

      performance: {
        fps: 30,
        latencyMs: Math.round(performance.now() - startTime),
      },

      detections: {
        people: poseResult.poseDetected ? 1 : 0,
        faces: 0,
        objects: 0,
        pose: bodyState.posture,
      },

      pose: poseResult,
      poseSummary,
      bodyState,

      risk: {
        level: calculatedRiskLevel,
        label: this.getRiskLabel(calculatedRiskLevel),
        confidence: bodyState.confidence,
      },
    }

    const movement = MovementAnalysisService.analyse(baseResult)

    return {
      ...baseResult,
      movement,
      summary:
        `${poseResult.summary}\n` +
        `${poseSummary.summary}\n` +
        `${bodyState.summary}\n` +
        `Movement: ${movement.movement}\n` +
        `Risk: ${calculatedRiskLevel} / 10`,
    }
  }

  getRiskLabel(level) {
    if (level >= 9) return 'critical'
    if (level >= 7) return 'high'
    if (level >= 5) return 'medium'
    if (level >= 3) return 'low'
    return 'normal'
  }

  errorResult(message) {
    return {
      status: 'error',
      provider: 'LOCAL_PIPELINE',
      timestamp: Date.now(),
      frame: null,
      performance: null,
      detections: {
        people: 0,
        faces: 0,
        objects: 0,
        pose: 'not_active',
      },
      pose: null,
      poseSummary: null,
      bodyState: null,
      movement: null,
      risk: {
        level: 0,
        label: 'unknown',
        confidence: 0,
      },
      summary: message,
    }
  }
}

export default new VisionPipeline()