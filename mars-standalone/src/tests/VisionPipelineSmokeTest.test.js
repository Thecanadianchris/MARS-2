/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Test:
 * VisionPipelineSmokeTest
 *
 * Purpose:
 * Vitest smoke test for the complete Vision Pipeline.
 *
 * Version:
 * v0.12.4
 *
 * Date Code:
 * 010726
 * ==========================================================
 */

import { describe, expect, it } from 'vitest'
import VisionPipeline from '../services/vision/VisionPipeline.js'

describe('VisionPipeline Smoke Test', () => {
  it('handles missing frame input safely', async () => {
    const result = await VisionPipeline.processFrame(null)

    expect(result).toBeDefined()
    expect(result.status).toBe('error')
    expect(result.summary).toBeTypeOf('string')
  })

  it('processes a basic frame and returns the expected pipeline structure', async () => {
    const mockFrame = {
      width: 640,
      height: 480,
      timestamp: Date.now(),
      dataUrl: null,
    }

    const result = await VisionPipeline.processFrame(mockFrame)

    expect(result).toBeDefined()
    expect(result.status).toBe('success')

    expect(result.pose).toBeDefined()
    expect(result.poseSummary).toBeDefined()
    expect(result.bodyState).toBeDefined()
    expect(result.movement).toBeDefined()
    expect(result.behaviourHistory).toBeDefined()
    expect(result.behaviourPattern).toBeDefined()
    expect(result.activityRecognition).toBeDefined()
    expect(result.faceFoundation).toBeDefined()
    expect(result.observationStream).toBeDefined()
    expect(result.personalObservation).toBeDefined()
    expect(result.decisionIntelligence).toBeDefined()
    expect(result.performance).toBeDefined()
    expect(result.risk).toBeDefined()

    expect(result.performance.latencyMs).toBeTypeOf('number')
    expect(result.performance.fps).toBeTypeOf('number')
    expect(result.performance.processedFrameCount).toBeTypeOf('number')
  })
})