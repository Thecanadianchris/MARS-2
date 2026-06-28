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
 * - Record short-term behaviour history
 * - Detect short-term behaviour patterns
 * - Recognise simple human activities
 * - Estimate face/head foundation signals
 * - Produce a structured vision result for the UI
 *
 * Version:
 * v0.11.0b
 *
 * Date Code:
 * 280626
 * ==========================================================
 */

import MovementAnalysisService from './MovementAnalysisService'
import PoseDetectionService from './PoseDetectionService'
import PoseSummaryService from './PoseSummaryService'
import BodyStateEngine from './BodyStateEngine'
import BehaviourHistoryEngine from './BehaviourHistoryEngine'
import BehaviourPatternEngine from './BehaviourPatternEngine'
import ActivityRecognitionEngine from './ActivityRecognitionEngine'
import FaceFoundationEngine from './FaceFoundationEngine'

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
    const bodyRiskLevel = Math.min(
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
        level: bodyRiskLevel,
        label: this.getRiskLabel(bodyRiskLevel),
        confidence: bodyState.confidence,
      },
    }

    const movement = MovementAnalysisService.analyse(baseResult)

    const resultWithMovement = {
      ...baseResult,
      movement,
    }

    const behaviourHistory = BehaviourHistoryEngine.record(resultWithMovement)
    const behaviourPattern = BehaviourPatternEngine.evaluate(behaviourHistory)
    const activityRecognition = ActivityRecognitionEngine.evaluate(
      behaviourHistory,
      behaviourPattern
    )
    const faceFoundation = FaceFoundationEngine.evaluate(
      poseResult,
      poseSummary
    )

    const calculatedRiskLevel = Math.min(
      10,
      bodyRiskLevel +
        behaviourHistory.riskModifier +
        behaviourPattern.riskModifier +
        activityRecognition.riskModifier +
        faceFoundation.riskModifier
    )

    return {
      ...resultWithMovement,
      detections: {
        ...resultWithMovement.detections,
        faces: faceFoundation.faceCount,
      },
      behaviourHistory,
      behaviourPattern,
      activityRecognition,
      faceFoundation,
      risk: {
        level: calculatedRiskLevel,
        label: this.getRiskLabel(calculatedRiskLevel),
        confidence: this.calculateConfidence(
          bodyState,
          movement,
          behaviourHistory,
          behaviourPattern,
          activityRecognition,
          faceFoundation
        ),
      },
      summary:
        `${poseResult.summary}\n` +
        `${poseSummary.summary}\n` +
        `${bodyState.summary}\n` +
        `${movement.summary}\n` +
        `${behaviourHistory.summary}\n` +
        `${behaviourPattern.summary}\n` +
        `${activityRecognition.summary}\n` +
        `${faceFoundation.summary}\n` +
        `Risk: ${calculatedRiskLevel} / 10`,
    }
  }

  calculateConfidence(
    bodyState,
    movement,
    behaviourHistory,
    behaviourPattern,
    activityRecognition,
    faceFoundation
  ) {
    const confidenceValues = [
      bodyState?.confidence || 0,
      movement?.confidence || 0,
    ]

    if (behaviourHistory?.sampleCount > 1) {
      confidenceValues.push(
        Math.min(100, behaviourHistory.sampleCount * 5)
      )
    }

    if (behaviourPattern?.confidence > 0) {
      confidenceValues.push(behaviourPattern.confidence)
    }

    if (activityRecognition?.confidence > 0) {
      confidenceValues.push(activityRecognition.confidence)
    }

    if (faceFoundation?.confidence > 0) {
      confidenceValues.push(faceFoundation.confidence)
    }

    const total = confidenceValues.reduce((sum, value) => sum + value, 0)

    return Math.round(total / confidenceValues.length)
  }

  getRiskLabel(level) {
    if (level >= 9) return 'critical'
    if (level >= 7) return 'high'
    if (level >= 5) return 'medium'
    if (level >= 3) return 'low'
    return 'normal'
  }

  reset() {
    MovementAnalysisService.reset()
    BehaviourHistoryEngine.reset()
    FaceFoundationEngine.reset()
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
      behaviourHistory: null,
      behaviourPattern: null,
      activityRecognition: null,
      faceFoundation: null,
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
