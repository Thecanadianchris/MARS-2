/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Manager:
 * DiagnosticsManager
 *
 * Purpose:
 * Provides a unified diagnostics framework for MARS capability
 * modules without coupling the UI directly to implementation
 * details of Identity, Vision, AI, Decision or Notifications.
 *
 * Version:
 * v0.13.6
 *
 * Date Code:
 * 050726
 * ==========================================================
 */

import AIStatusService from '@/services/ai/AIStatusService'
import VisionService from '@/services/vision/VisionService'
import IdentityDiagnosticsService from '@/services/identity/IdentityDiagnosticsService'
import NotificationManager from '@/services/notifications/NotificationManager'
import DecisionIntelligenceService from '@/services/decision/DecisionIntelligenceService'
import LivePipelineStore from '@/services/livePipeline/LivePipelineStore'
import PipelineHealthService from '@/services/pipelineHealth/PipelineHealthService'
import VoiceDiagnosticsService from '@/services/voice/VoiceDiagnosticsService'
import DiagnosticsStore from './DiagnosticsStore'
import {
  DIAGNOSTIC_GROUPS,
  DIAGNOSTIC_STATUS,
  createDiagnosticCheck,
  createDiagnosticItem,
  getDiagnosticRank,
} from './DiagnosticsTypes'

class DiagnosticsManager {
  runDiagnostics(context = {}) {
    const timestamp = Date.now()
    const livePipelineResult = context.pipelineResult || LivePipelineStore.getLatestResult()
    const liveNotification = context.notificationResult || LivePipelineStore.getLatestNotification()

    const items = [
      this.evaluateRobotPlatform(timestamp),
      this.evaluateAIStatus(timestamp),
      this.evaluateVisionStatus(timestamp, livePipelineResult),
      this.evaluateLivePipelineStatus(timestamp, livePipelineResult),
      this.evaluateDiagnosticsStability(timestamp, livePipelineResult),
      this.evaluatePipelineHealthStatus(timestamp, livePipelineResult, liveNotification),
      this.evaluateIdentityStatus(context.identityResult || livePipelineResult?.identity, timestamp),
      this.evaluateBehaviourStatus(timestamp, livePipelineResult),
      this.evaluateDecisionStatus(timestamp, livePipelineResult),
      this.evaluateNotificationStatus(timestamp, liveNotification),
      this.evaluateVoiceStatus(timestamp),
      this.evaluateBaseStationStatus(timestamp),
      this.evaluateCloudStatus(timestamp),
      this.evaluateWearableStatus(timestamp),
    ]

    const pipelineHealth = PipelineHealthService.evaluate({
      items,
      pipelineResult: livePipelineResult,
      notificationResult: liveNotification,
      timestamp,
    })

    const snapshot = {
      status: this.deriveOverallStatus(items, pipelineHealth),
      version: 'v0.13.6',
      module: 'Diagnostics Stabilisation Framework',
      stability: this.createStabilityReport(items, livePipelineResult),
      pipelineHealth,
      capabilityState: pipelineHealth.capabilityState,
      timestamp,
      summary: this.createSummary(items),
      counts: this.createCounts(items),
      items,
      groups: this.groupItems(items),
    }

    return DiagnosticsStore.saveSnapshot(snapshot)
  }

  getSnapshot() {
    return DiagnosticsStore.getSnapshot() || this.runDiagnostics()
  }

  evaluateRobotPlatform(timestamp) {
    return createDiagnosticItem({
      id: 'robot-onboard-platform',
      label: 'Onboard Intelligence Platform',
      group: DIAGNOSTIC_GROUPS.ROBOT,
      status: DIAGNOSTIC_STATUS.ONLINE,
      summary: 'Robot-local diagnostics are running on the onboard application.',
      details: {
        role: 'Robot onboard intelligence',
        currentImplementation: 'Samsung Galaxy S22',
        platformIndependent: true,
      },
      checks: [
        createDiagnosticCheck({
          id: 'onboard-role-defined',
          label: 'Onboard role defined',
          passed: true,
          summary: 'The current S22 is treated as part of the robot, not a remote controller.',
        }),
        createDiagnosticCheck({
          id: 'platform-independent',
          label: 'Platform independence preserved',
          passed: true,
          summary: 'The diagnostics model describes roles, not permanent hardware products.',
        }),
      ],
      timestamp,
    })
  }

  evaluateAIStatus(timestamp) {
    const status = AIStatusService.getStatus()

    return createDiagnosticItem({
      id: 'mars-intelligence-layer',
      label: 'MARS Intelligence Layer',
      group: DIAGNOSTIC_GROUPS.INTELLIGENCE,
      status: status.localDevice ? DIAGNOSTIC_STATUS.READY : DIAGNOSTIC_STATUS.DEGRADED,
      summary: `AI routing mode: ${status.mode || 'unknown'}. Active provider: ${status.activeProvider || 'unknown'}.`,
      details: status,
      checks: [
        createDiagnosticCheck({
          id: 'local-device-ai',
          label: 'Local device intelligence',
          passed: Boolean(status.localDevice),
        }),
        createDiagnosticCheck({
          id: 'home-server-ai',
          label: 'Base Station intelligence',
          passed: Boolean(status.homeServer),
          summary: 'Optional supporting capability. Not required for robot core operation.',
        }),
        createDiagnosticCheck({
          id: 'cloud-ai',
          label: 'Cloud AI augmentation',
          passed: Boolean(status.cloudAI),
          summary: 'Optional service. Cloud AI is not the default intelligence.',
        }),
      ],
      timestamp,
    })
  }

  evaluateVisionStatus(timestamp, pipelineResult = null) {
    const status = VisionService.getStatus()
    const ready = Boolean(
      status.cameraAvailable ||
      status.localProcessingEnabled ||
      pipelineResult?.status === 'success'
    )

    return createDiagnosticItem({
      id: 'vision-system',
      label: 'Vision System',
      group: DIAGNOSTIC_GROUPS.PERCEPTION,
      status: ready ? DIAGNOSTIC_STATUS.READY : DIAGNOSTIC_STATUS.WAITING,
      summary: pipelineResult
        ? `Vision mode: ${status.activeMode || 'unknown'}. Live pipeline frame ${pipelineResult.performance?.processedFrameCount || 0} processed.`
        : `Vision mode: ${status.activeMode || 'unknown'}. Camera ${status.cameraAvailable ? 'available' : 'not available'}.`,
      details: {
        ...status,
        livePipelineFrameCount: pipelineResult?.performance?.processedFrameCount || 0,
        latestRisk: pipelineResult?.risk || null,
      },
      checks: [
        createDiagnosticCheck({
          id: 'camera-available',
          label: 'Camera available',
          passed: Boolean(status.cameraAvailable),
        }),
        createDiagnosticCheck({
          id: 'local-processing',
          label: 'Local processing enabled',
          passed: Boolean(status.localProcessingEnabled),
        }),
        createDiagnosticCheck({
          id: 'continuous-monitoring',
          label: 'Continuous monitoring',
          passed: Boolean(status.continuousMonitoringEnabled),
        }),
      ],
      timestamp,
    })
  }

  evaluateLivePipelineStatus(timestamp, pipelineResult = null) {
    const status = LivePipelineStore.getStatus(timestamp)
    const active = Boolean(pipelineResult)

    return createDiagnosticItem({
      id: 'live-pipeline-wiring',
      label: 'Live Pipeline Wiring',
      group: DIAGNOSTIC_GROUPS.PERCEPTION,
      status: active
        ? status.stale
          ? DIAGNOSTIC_STATUS.DEGRADED
          : DIAGNOSTIC_STATUS.ONLINE
        : DIAGNOSTIC_STATUS.WAITING,
      summary: active
        ? status.stale
          ? `Live pipeline has data but the latest frame is stale (${status.ageMs} ms old).`
          : `Live pipeline is online. Last processed frame: ${status.processedFrameCount}. Risk: ${status.latestRiskLabel}.`
        : 'Live pipeline is waiting for the first camera frame.',
      details: status,
      checks: [
        createDiagnosticCheck({
          id: 'single-source-of-truth',
          label: 'Single source of truth available',
          passed: active,
          summary: 'VisionPipeline output is the authoritative live state for downstream panels.',
        }),
        createDiagnosticCheck({
          id: 'pipeline-result-stored',
          label: 'Pipeline result stored',
          passed: Boolean(LivePipelineStore.getLatestResult()),
        }),
        createDiagnosticCheck({
          id: 'pipeline-not-stale',
          label: 'Pipeline result not stale',
          passed: !status.stale,
          summary: 'A stale frame degrades diagnostics but does not crash the application.',
        }),
      ],
      timestamp,
    })
  }


  evaluateDiagnosticsStability(timestamp, pipelineResult = null) {
    const storeStatus = DiagnosticsStore.getStatus()
    const liveStatus = LivePipelineStore.getStatus(timestamp)
    const requiredLiveFields = [
      'identity',
      'behaviourHistory',
      'behaviourPattern',
      'decisionIntelligence',
      'notificationEngine',
    ]
    const missingFields = pipelineResult
      ? requiredLiveFields.filter((fieldName) => !pipelineResult[fieldName])
      : requiredLiveFields
    const hasLiveResult = Boolean(pipelineResult)
    const stable = hasLiveResult && missingFields.length === 0 && !liveStatus.stale

    return createDiagnosticItem({
      id: 'diagnostics-stabilisation',
      label: 'Diagnostics Stabilisation',
      group: DIAGNOSTIC_GROUPS.PLATFORM,
      status: stable
        ? DIAGNOSTIC_STATUS.READY
        : hasLiveResult
          ? DIAGNOSTIC_STATUS.DEGRADED
          : DIAGNOSTIC_STATUS.WAITING,
      summary: stable
        ? 'Diagnostics are reading a complete, current live pipeline snapshot.'
        : hasLiveResult
          ? `Diagnostics detected ${missingFields.length} missing live field(s) or stale pipeline data.`
          : 'Diagnostics stabilisation is waiting for the first live pipeline snapshot.',
      details: {
        diagnosticsStore: storeStatus,
        livePipeline: liveStatus,
        requiredLiveFields,
        missingFields,
        liveResultAvailable: hasLiveResult,
      },
      checks: [
        createDiagnosticCheck({
          id: 'diagnostics-store-active',
          label: 'Diagnostics store active',
          passed: true,
        }),
        createDiagnosticCheck({
          id: 'live-result-present',
          label: 'Live pipeline result present',
          passed: hasLiveResult,
        }),
        createDiagnosticCheck({
          id: 'live-result-complete',
          label: 'Required live fields present',
          passed: missingFields.length === 0,
          summary: missingFields.length === 0
            ? 'All required live pipeline fields are available to diagnostics.'
            : `Missing fields: ${missingFields.join(', ')}`,
        }),
        createDiagnosticCheck({
          id: 'live-result-current',
          label: 'Live pipeline result current',
          passed: !liveStatus.stale,
          summary: liveStatus.ageMs === null
            ? 'No live frame age is available yet.'
            : `Latest frame age: ${liveStatus.ageMs} ms.`,
        }),
      ],
      timestamp,
    })
  }

  evaluatePipelineHealthStatus(timestamp, pipelineResult = null, liveNotification = null) {
    const health = PipelineHealthService.evaluate({
      items: [],
      pipelineResult,
      notificationResult: liveNotification,
      timestamp,
    })

    return createDiagnosticItem({
      id: 'pipeline-health-summary',
      label: 'Pipeline Health Summary',
      group: DIAGNOSTIC_GROUPS.PLATFORM,
      status: health.status,
      summary: health.summary,
      details: health,
      checks: [
        createDiagnosticCheck({
          id: 'pipeline-live',
          label: 'Pipeline live data available',
          passed: health.live,
          summary: health.live
            ? 'Live data is current and available to diagnostics.'
            : 'Diagnostics are waiting for current live pipeline data.',
        }),
        createDiagnosticCheck({
          id: 'stage-model-created',
          label: 'Stage health model created',
          passed: health.stages.length >= 6,
          summary: `${health.stages.length} pipeline stage(s) reported.`,
        }),
        createDiagnosticCheck({
          id: 'latency-metrics-available',
          label: 'Latency metrics available',
          passed: Number.isFinite(health.metrics.latencyMs),
          summary: `Latest latency: ${health.metrics.latencyMs} ms.`,
        }),
      ],
      timestamp,
    })
  }

  evaluateIdentityStatus(identityResult, timestamp) {
    const status = IdentityDiagnosticsService.evaluate(identityResult)
    const ready = Boolean(status.capabilities?.identityStateMachine && status.capabilities?.localProfileRegistry)

    return createDiagnosticItem({
      id: 'identity-foundation',
      label: 'Identity Foundation',
      group: DIAGNOSTIC_GROUPS.IDENTITY,
      status: ready ? DIAGNOSTIC_STATUS.READY : DIAGNOSTIC_STATUS.DEGRADED,
      summary: status.summary,
      details: status,
      checks: [
        createDiagnosticCheck({
          id: 'identity-state-machine',
          label: 'Identity state machine',
          passed: Boolean(status.capabilities?.identityStateMachine),
        }),
        createDiagnosticCheck({
          id: 'profile-registry',
          label: 'Local profile registry',
          passed: Boolean(status.capabilities?.localProfileRegistry),
        }),
        createDiagnosticCheck({
          id: 'face-recognition',
          label: 'Face recognition provider',
          passed: Boolean(status.capabilities?.faceRecognition),
          summary: 'v0.16: landmark-geometry matcher active (Foundation-grade, not biometric-grade).',
        }),
      ],
      timestamp,
    })
  }

  evaluateBehaviourStatus(timestamp, pipelineResult = null) {
    const hasBehaviour = Boolean(
      pipelineResult?.behaviourHistory ||
      pipelineResult?.behaviourPattern ||
      pipelineResult?.activityRecognition
    )

    return createDiagnosticItem({
      id: 'behaviour-live-intelligence',
      label: 'Behaviour Intelligence',
      group: DIAGNOSTIC_GROUPS.BEHAVIOUR,
      status: hasBehaviour ? DIAGNOSTIC_STATUS.READY : DIAGNOSTIC_STATUS.WAITING,
      summary: hasBehaviour
        ? pipelineResult.behaviourPattern?.summary || 'Behaviour intelligence is receiving live pipeline observations.'
        : 'Behaviour intelligence is waiting for live pipeline observations.',
      details: {
        behaviourHistory: pipelineResult?.behaviourHistory || null,
        behaviourPattern: pipelineResult?.behaviourPattern || null,
        activityRecognition: pipelineResult?.activityRecognition || null,
      },
      checks: [
        createDiagnosticCheck({
          id: 'behaviour-history-live',
          label: 'Behaviour history receives live data',
          passed: Boolean(pipelineResult?.behaviourHistory),
        }),
        createDiagnosticCheck({
          id: 'behaviour-pattern-live',
          label: 'Behaviour pattern receives live data',
          passed: Boolean(pipelineResult?.behaviourPattern),
        }),
      ],
      timestamp,
    })
  }

  evaluateDecisionStatus(timestamp, pipelineResult = null) {
    const result = pipelineResult?.decisionIntelligence || DecisionIntelligenceService.evaluate(null)
    const hasSafeResult = Boolean(result && result.status)

    return createDiagnosticItem({
      id: 'decision-engine',
      label: 'Decision Engine',
      group: DIAGNOSTIC_GROUPS.DECISION,
      status: hasSafeResult ? DIAGNOSTIC_STATUS.READY : DIAGNOSTIC_STATUS.ERROR,
      summary: pipelineResult?.decisionIntelligence
        ? result.summary
        : hasSafeResult
          ? 'Decision layer responds safely to diagnostics input.'
          : 'Decision layer did not return a safe diagnostics response.',
      details: {
        status: result?.status || 'missing',
        provider: result?.provider || 'decision-intelligence-service',
        live: Boolean(pipelineResult?.decisionIntelligence),
        decisionCount: result?.decisionResult?.decisionCount || 0,
        priorityCount: result?.priorityResult?.priorityCount || 0,
        recommendationCount: result?.recommendationResult?.recommendationCount || 0,
      },
      checks: [
        createDiagnosticCheck({
          id: 'safe-empty-input',
          label: 'Safe empty input handling',
          passed: hasSafeResult,
        }),
      ],
      timestamp,
    })
  }

  evaluateNotificationStatus(timestamp, liveNotification = null) {
    const status = liveNotification || (typeof NotificationManager.getStatus === 'function'
      ? NotificationManager.getStatus()
      : this.createFallbackNotificationStatus())

    return createDiagnosticItem({
      id: 'notification-alerting',
      label: 'Notification & Alerting',
      group: DIAGNOSTIC_GROUPS.NOTIFICATION,
      status: DIAGNOSTIC_STATUS.READY,
      summary: liveNotification
        ? liveNotification.summary
        : 'Notification framework is available for robot, trusted-user and future wearable alert paths.',
      details: status,
      checks: [
        createDiagnosticCheck({
          id: 'internal-notifications',
          label: 'Internal notifications',
          passed: true,
        }),
        createDiagnosticCheck({
          id: 'trusted-contact-alerts',
          label: 'Trusted contact alerts',
          passed: Boolean(status.trustedContactAlertsReady || status.targets),
          summary: 'Planned external delivery path for family, carers and trusted contacts.',
        }),
        createDiagnosticCheck({
          id: 'watch-input',
          label: 'Watch input channel',
          passed: Boolean(status.watchInputReady),
          summary: 'Planned heart-rate and emergency-trigger input path.',
        }),
      ],
      timestamp,
    })
  }


  evaluateVoiceStatus(timestamp) {
    const status = VoiceDiagnosticsService.evaluate()

    return createDiagnosticItem({
      id: 'voice-intelligence-foundation',
      label: 'Voice Intelligence Foundation',
      group: DIAGNOSTIC_GROUPS.VOICE,
      status: status.status === 'ready' ? DIAGNOSTIC_STATUS.READY : DIAGNOSTIC_STATUS.DEGRADED,
      summary: status.summary,
      details: status,
      checks: [
        createDiagnosticCheck({
          id: 'voice-service-ready',
          label: 'Voice service ready',
          passed: Boolean(status.capabilities?.voiceService),
        }),
        createDiagnosticCheck({
          id: 'voice-command-registry-ready',
          label: 'Command registry ready',
          passed: Boolean(status.capabilities?.commandRegistry),
        }),
        createDiagnosticCheck({
          id: 'voice-intent-parser-ready',
          label: 'Intent parser ready',
          passed: Boolean(status.capabilities?.intentParser),
        }),
        createDiagnosticCheck({
          id: 'voice-wake-word-service-ready',
          label: 'Wake word service ready',
          passed: Boolean(status.capabilities?.wakeWordService),
        }),
        createDiagnosticCheck({
          id: 'voice-command-router-ready',
          label: 'Command router ready',
          passed: Boolean(status.capabilities?.commandRouter),
        }),
        createDiagnosticCheck({
          id: 'voice-response-service-ready',
          label: 'Voice response service ready',
          passed: Boolean(status.capabilities?.voiceResponseService),
          summary: 'Routed voice commands can now return deterministic visible UI responses.',
        }),
        createDiagnosticCheck({
          id: 'live-audio-deferred',
          label: 'Live audio intentionally deferred',
          passed: true,
          summary: 'Microphone capture, STT and TTS belong to later v0.14.x milestones.',
        }),
      ],
      timestamp,
    })
  }

  evaluateBaseStationStatus(timestamp) {
    return createDiagnosticItem({
      id: 'base-station',
      label: 'Optional Base Station',
      group: DIAGNOSTIC_GROUPS.PLATFORM,
      status: DIAGNOSTIC_STATUS.WAITING,
      summary: 'Base Station support is defined architecturally but not connected in this build.',
      details: {
        role: 'Optional supporting system',
        currentImplementation: 'Snapdragon X laptop',
        requiredForCoreRobotOperation: false,
      },
      checks: [
        createDiagnosticCheck({
          id: 'base-station-optional',
          label: 'Optional by design',
          passed: true,
        }),
        createDiagnosticCheck({
          id: 'base-station-connected',
          label: 'Base Station connected',
          passed: false,
        }),
      ],
      timestamp,
    })
  }

  evaluateCloudStatus(timestamp) {
    return createDiagnosticItem({
      id: 'optional-cloud-services',
      label: 'Optional Cloud Services',
      group: DIAGNOSTIC_GROUPS.PLATFORM,
      status: DIAGNOSTIC_STATUS.WAITING,
      summary: 'Cloud services are optional augmentation and are not required for local robot operation.',
      details: {
        requiredForCoreRobotOperation: false,
        localFirst: true,
      },
      checks: [
        createDiagnosticCheck({
          id: 'cloud-optional',
          label: 'Cloud optional',
          passed: true,
        }),
      ],
      timestamp,
    })
  }

  evaluateWearableStatus(timestamp) {
    return createDiagnosticItem({
      id: 'wearable-input',
      label: 'Wearable Input',
      group: DIAGNOSTIC_GROUPS.NOTIFICATION,
      status: DIAGNOSTIC_STATUS.WAITING,
      summary: 'Watch heart-rate and emergency-trigger input is planned for future alert correlation.',
      details: {
        currentImplementation: 'Galaxy Watch planned',
        heartRateInput: 'planned',
        emergencyTrigger: 'planned',
        medicalDiagnosis: false,
      },
      checks: [
        createDiagnosticCheck({
          id: 'watch-channel-defined',
          label: 'Watch channel defined',
          passed: true,
        }),
        createDiagnosticCheck({
          id: 'heart-rate-connected',
          label: 'Heart-rate data connected',
          passed: false,
        }),
      ],
      timestamp,
    })
  }

  createFallbackNotificationStatus() {
    return {
      status: 'available',
      internalNotificationsReady: true,
      trustedContactAlertsReady: false,
      watchInputReady: false,
    }
  }

  deriveOverallStatus(items, pipelineHealth = null) {
    const statuses = items.map((item) => item.status)
    if (pipelineHealth?.status) {
      statuses.push(pipelineHealth.status)
    }

    if (statuses.includes(DIAGNOSTIC_STATUS.ERROR)) {
      return DIAGNOSTIC_STATUS.ERROR
    }

    if (statuses.includes(DIAGNOSTIC_STATUS.DEGRADED)) {
      return DIAGNOSTIC_STATUS.DEGRADED
    }

    if (statuses.includes(DIAGNOSTIC_STATUS.OFFLINE)) {
      return DIAGNOSTIC_STATUS.DEGRADED
    }

    return DIAGNOSTIC_STATUS.READY
  }

  createCounts(items) {
    return items.reduce((counts, item) => {
      counts.total += 1
      counts[item.status] = (counts[item.status] || 0) + 1
      return counts
    }, { total: 0 })
  }

  createSummary(items) {
    const readyCount = items.filter((item) => getDiagnosticRank(item.status) >= getDiagnosticRank(DIAGNOSTIC_STATUS.READY)).length
    const waitingCount = items.filter((item) => item.status === DIAGNOSTIC_STATUS.WAITING).length

    return `Diagnostics and Voice Foundation active. ${readyCount}/${items.length} subsystem(s) ready or online. ${waitingCount} optional subsystem(s) waiting.`
  }


  createStabilityReport(items, pipelineResult = null) {
    const stabilityItem = items.find((item) => item.id === 'diagnostics-stabilisation')
    const failedChecks = items.flatMap((item) => {
      return item.checks
        .filter((check) => !check.passed)
        .map((check) => ({
          itemId: item.id,
          checkId: check.id,
          label: check.label,
          status: check.status,
        }))
    })

    return {
      version: 'v0.13.6',
      objective: 'Diagnostics Stabilisation',
      livePipelineSnapshotPresent: Boolean(pipelineResult),
      status: stabilityItem?.status || DIAGNOSTIC_STATUS.UNKNOWN,
      failedCheckCount: failedChecks.length,
      failedChecks,
    }
  }

  groupItems(items) {
    return items.reduce((groups, item) => {
      if (!groups[item.group]) {
        groups[item.group] = []
      }

      groups[item.group].push(item)
      return groups
    }, {})
  }
}

export default new DiagnosticsManager()
