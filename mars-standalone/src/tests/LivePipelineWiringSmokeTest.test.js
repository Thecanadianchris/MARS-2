/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Smoke Test:
 * LivePipelineWiringSmokeTest
 *
 * Purpose:
 * Verifies v0.13.5 single-source live pipeline wiring from
 * VisionPipeline into LivePipelineStore and diagnostics.
 *
 * Version:
 * v0.13.5
 * Date Code:
 * 050726
 * ==========================================================
 */

import { describe, expect, it } from 'vitest'
import VisionPipeline from '../services/vision/VisionPipeline.js'
import { DiagnosticsManager } from '../services/diagnostics/index.js'
import LivePipelineStore from '../services/livePipeline/LivePipelineStore.js'

describe('Live Pipeline Wiring Smoke Test', () => {
  it('stores VisionPipeline output as the live pipeline source of truth', async () => {
    LivePipelineStore.clear()

    const result = await VisionPipeline.processFrame({
      width: 640,
      height: 480,
      timestamp: Date.now(),
      dataUrl: null,
    })

    const stored = LivePipelineStore.getLatestResult()

    expect(result.status).toBe('success')
    expect(stored).toBeDefined()
    expect(stored.livePipeline.version).toBe('v0.13.5')
    expect(stored.identity).toBeDefined()
    expect(stored.behaviourHistory).toBeDefined()
    expect(stored.decisionIntelligence).toBeDefined()
    expect(stored.notificationEngine).toBeDefined()
  })

  it('surfaces live pipeline state through diagnostics', async () => {
    const result = await VisionPipeline.processFrame({
      width: 640,
      height: 480,
      timestamp: Date.now(),
      dataUrl: null,
    })

    const snapshot = DiagnosticsManager.runDiagnostics({ pipelineResult: result })
    const livePipeline = snapshot.items.find((item) => item.id === 'live-pipeline-wiring')
    const behaviour = snapshot.items.find((item) => item.id === 'behaviour-live-intelligence')

    expect(livePipeline).toBeDefined()
    expect(livePipeline.status).toBe('online')
    expect(behaviour).toBeDefined()
    expect(behaviour.status).toBe('ready')
  })
})
