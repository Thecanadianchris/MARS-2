/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Service:
 * PipelineHealthService
 *
 * Purpose:
 * Produces a stable, UI-safe health summary for the live MARS
 * processing pipeline. This keeps diagnostics panels from
 * reaching directly into service internals and gives future
 * Voice, Memory, Face Recognition and Robot Control modules a
 * consistent diagnostics contract.
 *
 * Version:
 * v0.13.6
 *
 * Date Code:
 * 060726
 * ==========================================================
 */

import LivePipelineStore from '@/services/livePipeline/LivePipelineStore'
import { DIAGNOSTIC_STATUS, getDiagnosticRank } from '@/services/diagnostics/DiagnosticsTypes'
import { CAPABILITY_STATE, createCapabilityState } from '@/services/capabilityState'

const PIPELINE_STAGES = Object.freeze([
  'Vision',
  'Identity',
  'Behaviour',
  'Decision',
  'Notification',
  'Diagnostics',
])

class PipelineHealthService {
  evaluate({ items = [], pipelineResult = null, notificationResult = null, timestamp = Date.now() } = {}) {
    const liveStatus = LivePipelineStore.getStatus(timestamp)
    const result = pipelineResult || LivePipelineStore.getLatestResult()
    const notification = notificationResult || LivePipelineStore.getLatestNotification()
    const stageMap = this.buildStageMap(items, result, notification, liveStatus, timestamp)
    const stages = PIPELINE_STAGES.map((stageName) => stageMap[stageName])
    const failedStages = stages.filter((stage) => this.isProblemStatus(stage.status))
    const waitingStages = stages.filter((stage) => stage.status === DIAGNOSTIC_STATUS.WAITING)
    const onlineStages = stages.filter((stage) => getDiagnosticRank(stage.status) >= getDiagnosticRank(DIAGNOSTIC_STATUS.READY))
    const status = this.derivePipelineStatus(stages, liveStatus)

    return {
      version: 'v0.13.6',
      objective: 'Diagnostics Stabilisation',
      status,
      live: Boolean(result) && !liveStatus.stale,
      capabilityState: Boolean(result) && !liveStatus.stale
        ? createCapabilityState({
            state: CAPABILITY_STATE.LIVE,
            label: 'Live',
            source: 'live-pipeline',
            confidence: result?.risk?.confidence || 0,
            message: 'Diagnostics are reading the current live pipeline.',
            lastUpdate: timestamp,
          })
        : createCapabilityState({
            state: CAPABILITY_STATE.WAITING,
            label: 'Waiting',
            source: 'live-pipeline',
            confidence: 0,
            message: 'Diagnostics are waiting for current live pipeline data.',
            lastUpdate: null,
          }),
      summary: this.createSummary({ stages, status, liveStatus }),
      metrics: {
        stageCount: stages.length,
        onlineStageCount: onlineStages.length,
        waitingStageCount: waitingStages.length,
        failedStageCount: failedStages.length,
        frameCount: liveStatus.processedFrameCount || 0,
        ageMs: liveStatus.ageMs,
        staleAfterMs: liveStatus.staleAfterMs,
        latencyMs: result?.performance?.latencyMs || 0,
        averageLatencyMs: result?.performance?.averageLatencyMs || 0,
        fps: result?.performance?.fps || 0,
      },
      stages,
      livePipeline: liveStatus,
      timestamp,
    }
  }

  buildStageMap(items, result, notification, liveStatus, timestamp) {
    const itemById = items.reduce((map, item) => {
      map[item.id] = item
      return map
    }, {})

    return {
      Vision: this.createStage({
        name: 'Vision',
        item: itemById['vision-system'],
        active: Boolean(result),
        processingTimeMs: result?.performance?.latencyMs || 0,
        lastUpdate: result?.timestamp || liveStatus.lastUpdatedAt,
        message: result ? 'Vision pipeline has produced live output.' : 'Waiting for first live vision frame.',
        timestamp,
      }),
      Identity: this.createStage({
        name: 'Identity',
        item: itemById['identity-foundation'],
        active: Boolean(result?.identity),
        processingTimeMs: result?.pipelineMetrics?.identityMs || 0,
        lastUpdate: result?.timestamp || liveStatus.lastUpdatedAt,
        message: result?.identity?.summary || 'Waiting for identity output.',
        timestamp,
      }),
      Behaviour: this.createStage({
        name: 'Behaviour',
        item: itemById['behaviour-live-intelligence'],
        active: Boolean(result?.behaviourHistory || result?.behaviourPattern),
        processingTimeMs: result?.pipelineMetrics?.behaviourMs || 0,
        lastUpdate: result?.timestamp || liveStatus.lastUpdatedAt,
        message: result?.behaviourPattern?.summary || 'Waiting for behaviour output.',
        timestamp,
      }),
      Decision: this.createStage({
        name: 'Decision',
        item: itemById['decision-engine'],
        active: Boolean(result?.decisionIntelligence),
        processingTimeMs: result?.pipelineMetrics?.decisionMs || 0,
        lastUpdate: result?.timestamp || liveStatus.lastUpdatedAt,
        message: result?.decisionIntelligence?.summary || 'Waiting for decision output.',
        timestamp,
      }),
      Notification: this.createStage({
        name: 'Notification',
        item: itemById['notification-alerting'],
        active: Boolean(notification || result?.notificationEngine),
        processingTimeMs: result?.pipelineMetrics?.notificationMs || 0,
        lastUpdate: result?.timestamp || liveStatus.lastUpdatedAt,
        message: notification?.summary || result?.notificationEngine?.summary || 'Notification layer idle or waiting.',
        timestamp,
      }),
      Diagnostics: this.createStage({
        name: 'Diagnostics',
        item: itemById['diagnostics-stabilisation'],
        active: Boolean(itemById['diagnostics-stabilisation']),
        processingTimeMs: 0,
        lastUpdate: timestamp,
        message: itemById['diagnostics-stabilisation']?.summary || 'Diagnostics framework is running.',
        timestamp,
      }),
    }
  }

  createStage({ name, item, active, processingTimeMs, lastUpdate, message, timestamp }) {
    const status = item?.status || (active ? DIAGNOSTIC_STATUS.READY : DIAGNOSTIC_STATUS.WAITING)

    return {
      name,
      status,
      active: Boolean(active),
      lastUpdate: lastUpdate || null,
      ageMs: lastUpdate ? Math.max(0, timestamp - lastUpdate) : null,
      processingTimeMs: Number.isFinite(processingTimeMs) ? processingTimeMs : 0,
      message,
      checkCount: item?.checks?.length || 0,
      failedCheckCount: item?.checks?.filter((check) => !check.passed).length || 0,
    }
  }

  derivePipelineStatus(stages, liveStatus) {
    if (stages.some((stage) => stage.status === DIAGNOSTIC_STATUS.ERROR)) {
      return DIAGNOSTIC_STATUS.ERROR
    }

    if (liveStatus.stale || stages.some((stage) => stage.status === DIAGNOSTIC_STATUS.DEGRADED)) {
      return DIAGNOSTIC_STATUS.DEGRADED
    }

    if (!liveStatus.active || stages.some((stage) => stage.status === DIAGNOSTIC_STATUS.WAITING)) {
      return DIAGNOSTIC_STATUS.WAITING
    }

    return DIAGNOSTIC_STATUS.ONLINE
  }

  isProblemStatus(status) {
    return [DIAGNOSTIC_STATUS.ERROR, DIAGNOSTIC_STATUS.OFFLINE, DIAGNOSTIC_STATUS.DEGRADED].includes(status)
  }

  createSummary({ stages, status, liveStatus }) {
    const readyCount = stages.filter((stage) => getDiagnosticRank(stage.status) >= getDiagnosticRank(DIAGNOSTIC_STATUS.READY)).length

    if (!liveStatus.active) {
      return `Pipeline health waiting. ${readyCount}/${stages.length} stage(s) ready before first live frame.`
    }

    if (liveStatus.stale) {
      return `Pipeline health degraded. Latest live frame is stale (${liveStatus.ageMs} ms old).`
    }

    return `Pipeline health ${status}. ${readyCount}/${stages.length} stage(s) ready or online.`
  }
}

export { PIPELINE_STAGES }
export default new PipelineHealthService()
