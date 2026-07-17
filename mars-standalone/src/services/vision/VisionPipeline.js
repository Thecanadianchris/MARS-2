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
import FaceLandmarkService from './FaceLandmarkService'
import FaceEmbeddingService from './FaceEmbeddingService'
import ObservationStreamEngine from './ObservationStreamEngine'
import PersonalObservationEngine from './PersonalObservationEngine'
import IdentityEngine from '../identity/IdentityEngine'
import IdentityTrackingService from '../identity/IdentityTrackingService'
import FaceRosterService from '../identity/FaceRosterService'
import DecisionIntelligenceService from '../decision/DecisionIntelligenceService'
import NotificationManager from '../notifications/NotificationManager'
import LivePipelineStore from '../livePipeline/LivePipelineStore'
import MemoryIntelligenceService from '../memory/MemoryIntelligenceService'

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

    // v0.16: separate MediaPipe face-mesh landmarks (up to 478 points)
    // for Face Recognition, distinct from FaceFoundationEngine's coarse
    // ~11-point head-orientation read off the pose landmarks above.
    // Gracefully degrades (empty landmarks) with no camera/model, same
    // pattern as PoseDetectionService. Retained for quality-gating and
    // potential future geometry-hybrid use even though v0.16.1 moved
    // matching itself onto face embeddings (below).
    const faceLandmarkResult = await FaceLandmarkService.detectFace(frame)

    // v0.16.1: real face-embedding descriptor (128-d, @vladmandic/face-api)
    // for actual matching — replaces the v0.16 landmark-geometry-ratio
    // signature, which a live test showed wasn't discriminative enough
    // between two different real people. Computed from the raw frame
    // (not the MediaPipe landmarks above) since the embedding model runs
    // its own detection/alignment. Same graceful-degrade contract as
    // every other vision provider here.
    //
    // v0.16.4: switched from computeEmbedding() (detectSingleFace, one
    // face only) to detectFaces() (detectAllFaces, every face in the
    // frame). faces[0] is the largest/most-prominent face and becomes
    // faceEmbedding below, preserving the exact single-primary-person
    // behaviour every existing consumer (IdentityTrackingService,
    // IdentityEngine, MemoryIntelligenceService.setActivePerson()) was
    // already built around. The full faces[] array is new — it feeds
    // FaceRosterService below to recognise everyone else in view too,
    // for display/overlay only (never the trust/memory pipeline).
    const faceDetectionResult = await FaceEmbeddingService.detectFaces(frame)
    const detectedFaces = faceDetectionResult.faces || []

    // v0.16.13: Multi-Person Simultaneous Locking. Christian live-
    // tested two enrolled people (himself + Ann) in frame together and
    // found the lock acquired on Ann, then dropped off him — because
    // every face fed into IdentityTrackingService shared the SAME one
    // trackingId (whoever was largest/most-prominent that frame), and
    // IdentityLockService's lock is keyed by trackingId. A second,
    // simultaneously-visible recognised person could only ever steal
    // the lock, never hold their own alongside it.
    //
    // Runs IdentityTrackingService.updateFromPerception() (real side
    // effect: builds/advances a track, and IdentityLockService's lock
    // logic with it) for EVERY detected face this frame, not just the
    // largest — each on its own per-profile trackingId (see
    // IdentityTrackingService.resolveTrackingId) so simultaneously-
    // visible enrolled people each accumulate and hold their own
    // independent lock. IdentityEngine.evaluate() is fed a minimal,
    // self-sufficient per-face perception object plus that face's own
    // already-computed trackingResult (via the `trackingResult` option
    // IdentityEngine already supported) — this avoids a second,
    // duplicate updateFromPerception() call for the same face/frame,
    // which would otherwise double-count framesSeen and corrupt the
    // lock's consecutive-frame counter.
    const perFaceResults = detectedFaces.map((face) => {
      const facePerception = {
        personPresent: true,
        faceDetected: true,
        faceEmbedding: face.descriptor,
        faceFoundation: {
          faceDetected: true,
          faceCount: 1,
          confidence: faceFoundation.confidence,
        },
        detections: { people: 1, faces: 1 },
        timestamp: now,
      }

      const trackingResult = IdentityTrackingService.updateFromPerception(facePerception)
      const faceIdentity = IdentityEngine.evaluate(facePerception, { trackingResult })

      return {
        face,
        facePerception,
        trackingResult,
        identity: faceIdentity,
        trackingId: trackingResult?.track?.trackingId || null,
      }
    })

    // v0.16.13: choose which ONE face drives the single primary trust/
    // decision/notification/memory-activation pipeline below (all
    // unchanged past this point) — Christian: "Finley is the
    // priority." A protected profile always wins primary regardless of
    // face size; failing that, anyone already locked keeps their
    // primary slot rather than being bumped by a merely-larger face;
    // failing that, falls back to the original largest-face default
    // (detectAllFaces already sorts largest-first, so perFaceResults[0]
    // IS that same default).
    const primaryEntry =
      perFaceResults.find((entry) => entry.identity.protected) ||
      perFaceResults.find((entry) => entry.identity.identityLocked) ||
      perFaceResults[0] ||
      null

    const primaryFace = primaryEntry?.face || null

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
      faceLandmarks: faceLandmarkResult.landmarks,
      faceEmbedding: primaryFace?.descriptor || null,
      faces: detectedFaces,
      facesRoster: FaceRosterService.build(detectedFaces),
      // v0.16.13: per-person lock/identity status for EVERY detected
      // face this frame, independent of who's chosen as primary below
      // — feeds VisionFaceOverlay so each simultaneously-visible
      // recognised person can show their own LOCKED badge, not just
      // whoever the single primary/decision pipeline currently is.
      identityRoster: perFaceResults.map((entry) => ({
        trackingId: entry.trackingId,
        profileId: entry.identity.profile?.id || null,
        displayName: entry.identity.profile?.displayName || null,
        identityLocked: Boolean(entry.identity.identityLocked),
        identityHeld: Boolean(entry.identity.identityHeld),
      })),
      risk: riskBeforePersonalObservation,
    }

    const observationStream = ObservationStreamEngine.evaluate(perceptionResult)

    // v0.16.13: when at least one face was detected, reuse the
    // priority-selected primary face's ALREADY-COMPUTED trackingResult
    // from the per-face loop above, rather than letting IdentityEngine
    // call IdentityTrackingService.updateFromPerception() a second
    // time for the same face/frame — that would double-count
    // framesSeen and corrupt the lock's consecutive-frame counter.
    // With no face detected at all this frame, falls back to the
    // original whole-frame call unchanged — the path the held-
    // through-occlusion lock (v0.16.11) depends on for continuity.
    const identity = primaryEntry
      ? IdentityEngine.evaluate(
          { ...primaryEntry.facePerception, observationStream },
          { trackingResult: primaryEntry.trackingResult }
        )
      : IdentityEngine.evaluate({ ...perceptionResult, observationStream })

    // v0.16 payoff: a confirmed, high-confidence face match flips the
    // whole memory system onto that person automatically. Gated by
    // IdentityEngine.shouldActivatePerson() — never fires on a weak
    // match, pending profile, or non-KNOWN/TRUSTED/PROTECTED state.
    if (IdentityEngine.shouldActivatePerson(identity)) {
      MemoryIntelligenceService.setActivePerson(identity.profile.id)
    }

    const personalObservation = PersonalObservationEngine.evaluate(
      observationStream,
      { profileId: identity.profile?.id === 'finley' ? 'finley' : undefined }
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
      identity,
      personalObservation,
      risk: finalRisk,
    }

    const decisionIntelligence = this.runDecisionIntelligence(
      resultBeforeDecision
    )

    const notificationEngine = this.runNotificationEngine(
      decisionIntelligence,
      identity
    )

    const performanceMetrics = this.updatePerformanceMetrics(startTime)

    const finalResult = {
      ...resultBeforeDecision,
      performance: performanceMetrics,
      decisionIntelligence,
      context: decisionIntelligence.context,
      decision: decisionIntelligence.decisionResult,
      priority: decisionIntelligence.priorityResult,
      recommendation: decisionIntelligence.recommendationResult,
      notificationEngine,
      notification: notificationEngine.notification,
      summary: this.buildSummary([
        poseResult.summary,
        poseSummary.summary,
        bodyState.summary,
        movement.summary,
        behaviourHistory.summary,
        behaviourPattern.summary,
        activityRecognition.summary,
        faceFoundation.summary,
        observationStream.summary,
        identity.summary,
        personalObservation.summary,
        decisionIntelligence.summary,
        notificationEngine.summary,
        `Performance: ${performanceMetrics.fps} FPS, ${performanceMetrics.latencyMs} ms latency`,
        `Risk: ${calculatedRiskLevel} / 10`,
      ]),
    }

    LivePipelineStore.saveResult(finalResult)
    LivePipelineStore.saveNotification(notificationEngine)

    return finalResult
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


  runNotificationEngine(decisionIntelligence, identity) {
    const profileId = identity?.profile?.id || 'owner-default'
    const decisionForNotification = {
      status: decisionIntelligence?.status || 'waiting',
      type: 'live_pipeline_decision',
      source: 'live-pipeline',
      summary: decisionIntelligence?.summary,
      highestPriority: decisionIntelligence?.priorityResult?.highestPriority,
      highestRecommendation:
        decisionIntelligence?.recommendationResult?.highestRecommendation,
      priority: decisionIntelligence?.priorityResult?.highestPriority?.originalPriority,
      score: decisionIntelligence?.priorityResult?.highestPriority?.score || 0,
    }

    if (!decisionIntelligence || decisionIntelligence.status !== 'success') {
      return NotificationManager.evaluateDecision(null, profileId)
    }

    return NotificationManager.evaluateDecision(decisionForNotification, profileId)
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
    IdentityEngine.reset()
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
      faceLandmarks: [],
      faceEmbedding: null,
      faces: [],
      facesRoster: [],
      observationStream: null,
      identity: null,
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