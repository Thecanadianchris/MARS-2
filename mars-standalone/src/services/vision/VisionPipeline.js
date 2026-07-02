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
 * v0.13.0
 *
 * Date Code:
 * 010726
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
import IdentityEngine from '../identity/IdentityEngine'
import DecisionIntelligenceService from '../decision/DecisionIntelligenceService'

class VisionPipeline {
  constructor() {
    this.lastFrameProcessedAt = null
    this.lastLatencyMs = null
    this.averageLatencyMs = null
    this.measuredFps = 0
    this.processedFrameCount = 0
  }

  async processFrame(frame) {
    if (!frame) {
      return this.errorResult('No frame supplied to VisionPipeline.')
    }

    const startTime = performance.now()
    const now = Date.now()

    const poseResult = await PoseDetectionService.detectPose(frame)
    const poseSummary = PoseSummaryService.summarise(poseResult)
    const bodyState = BodyStateEngine.evaluate(poseSummary)

    const bodyRiskLevel = this.calculateRiskLevel([bodyState.riskModifier])

    const baseResult = {
      status: 'success',
      provider: 'LOCAL_PIPELINE',
      timestamp: now,

      frame: {
        width: frame.width,
        height: frame.height,
        timestamp: frame.timestamp,
      },

      performance: this.createPendingPerformanceMetrics(),

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

    const identity = IdentityEngine.evaluate({
      faceFoundation,
      detectedPeople: this.createIdentityCandidates({
        poseResult,
        poseSummary,
        faceFoundation,
      }),
    })

    const prePersonalRiskLevel = this.calculateRiskLevel([
      bodyState.riskModifier,
      behaviourHistory.riskModifier,
      behaviourPattern.riskModifier,
      activityRecognition.riskModifier,
      faceFoundation.riskModifier,
    ])

    const riskBeforePersonalObservation = {
      level: prePersonalRiskLevel,
      label: this.getRiskLabel(prePersonalRiskLevel),
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
      identity,
      risk: riskBeforePersonalObservation,
    }

    const observationStream = ObservationStreamEngine.evaluate(perceptionResult)

    const personalObservation = PersonalObservationEngine.evaluate(
      observationStream
    )

    const calculatedRiskLevel = this.calculateRiskLevel([
      prePersonalRiskLevel,
      personalObservation.riskModifier,
    ])

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

    const performanceMetrics = this.updatePerformanceMetrics(startTime)

    return {
      ...resultBeforeDecision,
      performance: performanceMetrics,
      decisionIntelligence,
      context: decisionIntelligence.context,
      decision: decisionIntelligence.decision,
      priority: decisionIntelligence.priority,
      recommendation: decisionIntelligence.recommendation,
      summary: this.buildSummary([
        poseResult.summary,
        poseSummary.summary,
        bodyState.summary,
        movement.summary,
        behaviourHistory.summary,
        behaviourPattern.summary,
        activityRecognition.summary,
        faceFoundation.summary,
        identity.summary,
        observationStream.summary,
        personalObservation.summary,
        decisionIntelligence.summary,
        `Performance: ${performanceMetrics.fps} FPS, ${performanceMetrics.latencyMs} ms latency`,
        `Risk: ${calculatedRiskLevel} / 10`,
      ]),
    }
  }

  createIdentityCandidates({ poseResult, poseSummary, faceFoundation }) {
    if (!faceFoundation?.faceDetected) {
      return []
    }

    return [
      {
        id: null,
        name: null,
        confidence: faceFoundation.confidence || poseSummary?.confidence || 0,
        source: 'vision_pipeline_face_foundation',
        faceDetected: true,
        headOrientation: faceFoundation.head?.orientation || 'unknown',
        poseDetected: Boolean(poseResult?.poseDetected),
      },
    ]
  }

  createPendingPerformanceMetrics() {
    return {
      fps: this.measuredFps,
      latencyMs: this.lastLatencyMs || 0,
      averageLatencyMs: this.averageLatencyMs,
      processedFrameCount: this.processedFrameCount,
    }
  }

  updatePerformanceMetrics(startTime) {
    const completedAt = performance.now()
    const latencyMs = Math.round(completedAt - startTime)

    if (this.lastFrameProcessedAt) {
      const frameIntervalMs = completedAt - this.lastFrameProcessedAt

      if (frameIntervalMs > 0) {
        this.measuredFps = Math.round(1000 / frameIntervalMs)
      }
    }

    this.lastFrameProcessedAt = completedAt
    this.lastLatencyMs = latencyMs
    this.processedFrameCount += 1

    if (this.averageLatencyMs === null) {
      this.averageLatencyMs = latencyMs
    } else {
      this.averageLatencyMs = Math.round(
        this.averageLatencyMs * 0.8 + latencyMs * 0.2
      )
    }

    return {
      fps: this.measuredFps,
      latencyMs,
      averageLatencyMs: this.averageLatencyMs,
      processedFrameCount: this.processedFrameCount,
    }
  }

  calculateRiskLevel(riskModifiers) {
    const totalRisk = riskModifiers.reduce((total, modifier) => {
      return total + (modifier || 0)
    }, 0)

    return Math.min(10, Math.max(0, totalRisk))
  }

  buildSummary(summaryLines) {
    return summaryLines.filter(Boolean).join('\n')
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
    this.lastFrameProcessedAt = null
    this.lastLatencyMs = null
    this.averageLatencyMs = null
    this.measuredFps = 0
    this.processedFrameCount = 0

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
      performance: {
        fps: 0,
        latencyMs: 0,
        averageLatencyMs: this.averageLatencyMs,
        processedFrameCount: this.processedFrameCount,
      },
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
      identity: null,
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