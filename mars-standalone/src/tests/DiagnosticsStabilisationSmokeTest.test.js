/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Smoke Test:
 * DiagnosticsStabilisationSmokeTest
 *
 * Purpose:
 * Verifies v0.13.6 central pipeline health reporting and
 * diagnostics stabilisation outputs.
 *
 * Version:
 * v0.13.6
 * Date Code:
 * 060726
 * ==========================================================
 */

import { describe, expect, it } from 'vitest'
import VisionPipeline from '../services/vision/VisionPipeline.js'
import { DiagnosticsManager, DIAGNOSTIC_STATUS } from '../services/diagnostics/index.js'
import PipelineHealthService, { PIPELINE_STAGES } from '../services/pipelineHealth/PipelineHealthService.js'
import LivePipelineStore from '../services/livePipeline/LivePipelineStore.js'

describe('Diagnostics Stabilisation Smoke Test', () => {
  it('creates a central pipeline health summary while waiting for live data', () => {
    LivePipelineStore.clear()

    const health = PipelineHealthService.evaluate()

    expect(health).toBeDefined()
    expect(health.version).toBe('v0.13.6')
    expect(health.objective).toBe('Diagnostics Stabilisation')
    expect(health.status).toBe(DIAGNOSTIC_STATUS.WAITING)
    expect(health.live).toBe(false)
    expect(health.stages.length).toBe(PIPELINE_STAGES.length)
    expect(health.metrics.stageCount).toBe(PIPELINE_STAGES.length)
    expect(health.capabilityState.state).toBe('waiting')
  })

  it('adds pipeline health and capability state to diagnostics snapshots', async () => {
    const result = await VisionPipeline.processFrame({
      width: 640,
      height: 480,
      timestamp: Date.now(),
      dataUrl: null,
    })

    const snapshot = DiagnosticsManager.runDiagnostics({ pipelineResult: result })
    const pipelineHealthItem = snapshot.items.find((item) => item.id === 'pipeline-health-summary')

    expect(snapshot.pipelineHealth).toBeDefined()
    expect(snapshot.pipelineHealth.stages.length).toBe(PIPELINE_STAGES.length)
    expect(snapshot.pipelineHealth.metrics.frameCount).toBeGreaterThan(0)
    expect(snapshot.capabilityState).toBeDefined()
    expect(snapshot.capabilityState.state).toBe('live')
    expect(pipelineHealthItem).toBeDefined()
    expect(pipelineHealthItem.status).not.toBe(DIAGNOSTIC_STATUS.ERROR)
  })

  it('reports required stage names in a stable order', async () => {
    const result = await VisionPipeline.processFrame({
      width: 320,
      height: 240,
      timestamp: Date.now(),
      dataUrl: null,
    })

    const health = PipelineHealthService.evaluate({ pipelineResult: result })
    const stageNames = health.stages.map((stage) => stage.name)

    expect(stageNames).toEqual([
      'Vision',
      'Identity',
      'Behaviour',
      'Decision',
      'Notification',
      'Diagnostics',
    ])
  })
})
