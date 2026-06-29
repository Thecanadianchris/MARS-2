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
 * Version:
 * v0.12.2
 *
 * Date Code:
 * 290626
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
import ObservationStreamEngine from './ObservationStreamEngine'
import PersonalObservationEngine from './PersonalObservationEngine'
import DecisionIntelligenceService from '../decision/DecisionIntelligenceService'

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

    const riskBeforePersonalObservation = {
      level: Math.min(
        10,
        bodyRiskLevel +
          behaviourHistory.riskModifier +
          behaviourPattern.riskModifier +
          activityRecognition.riskModifier +
          faceFoundation.riskModifier
      ),
      label: this.getRiskLabel(
        Math.min(
          10,
          bodyRiskLevel +
            behaviourHistory.riskModifier +
            behaviourPattern.riskModifier +
            activityRecognition.riskModifier +
            faceFoundation.riskModifier
        )
      ),
      confidence: this.calculateConfidence(
        bodyState,
        movement,
        behaviourHistory,
        behaviourPattern,
        activityRecognition,
        faceFoundation
      ),
    }

    const perceptionResult = {
      ...resultWithMovement,
      detections: {
        ...resultWithMovement.detections,
        faces: faceFoundation.faceCount,
      },
      behaviourHistory,
      behaviourPattern,
      activityRecognition,
      faceFoundation,
      risk: riskBeforePersonalObservation,
    }

    const observationStream = ObservationStreamEngine.evaluate(perceptionResult)

    const personalObservation = PersonalObservationEngine.evaluate(
      observationStream
    )

    const calculatedRiskLevel = Math.min(
      10,
      riskBeforePersonalObservation.level + personalObservation.riskModifier
    )

    const finalRisk = {
      level: calculatedRiskLevel,
      label: this.getRiskLabel(calculatedRiskLevel),
      confidence: riskBeforePersonalObservation.confidence,
    }

    const resultBeforeDecision = {
      ...perceptionResult,
      observationStream,
      personalObservation,
      risk: finalRisk,
    }

    const decisionIntelligence = this.runDecisionIntelligence(
      resultBeforeDecision
    )

    return {
      ...resultBeforeDecision,
      decisionIntelligence,
      context: decisionIntelligence.context,
      decision: decisionIntelligence.decision,
      priority: decisionIntelligence.priority,
      recommendation: decisionIntelligence.recommendation,
      summary:
        `${poseResult.summary}\n` +
        `${poseSummary.summary}\n` +
        `${bodyState.summary}\n` +
        `${movement.summary}\n` +
        `${behaviourHistory.summary}\n` +
        `${behaviourPattern.summary}\n` +
        `${activityRecognition.summary}\n` +
        `${faceFoundation.summary}\n` +
        `${observationStream.summary}\n` +
        `${personalObservation.summary}\n` +
        `${decisionIntelligence.summary}\n` +
        `Risk: ${calculatedRiskLevel} / 10`,
    }
  }

  runDecisionIntelligence(visionResult) {
    if (typeof DecisionIntelligenceService.evaluate === 'function') {
      return DecisionIntelligenceService.evaluate(visionResult)
    }

    if (typeof DecisionIntelligenceService.process === 'function') {
      return DecisionIntelligenceService.process(visionResult)
    }

    if (typeof DecisionIntelligenceService.analyse === 'function') {
      return DecisionIntelligenceService.analyse(visionResult)
    }

    if (typeof DecisionIntelligenceService.analyze === 'function') {
      return DecisionIntelligenceService.analyze(visionResult)
    }

    return {
      status: 'warning',
      context: null,
      decision: null,
      priority: null,
      recommendation: null,
      summary:
        'Decision Intelligence Service exists but no supported execution method was found.',
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
      confidenceValues.push(Math.min(100, behaviourHistory.sampleCount * 5))
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
    PersonalObservationEngine.reset()
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
      observationStream: null,
      personalObservation: null,
      decisionIntelligence: null,
      context: null,
      decision: null,
      priority: null,
      recommendation: null,
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