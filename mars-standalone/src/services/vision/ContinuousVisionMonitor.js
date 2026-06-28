/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Module:
 * ContinuousVisionMonitor
 *
 * Purpose:
 * Runs repeated frame capture and processing for continuous
 * MARS vision monitoring.
 *
 * Version:
 * v0.10.1
 *
 * Date Code:
 * 270626
 * ==========================================================
 */

import FrameCaptureService from './FrameCaptureService'
import VisionPipeline from './VisionPipeline'
import VisionService from './VisionService'

class ContinuousVisionMonitor {
  constructor() {
    this.intervalId = null
    this.isRunning = false
    this.intervalMs = 1000
  }

  start(videoElement, onResult) {
    if (this.isRunning) {
      return
    }

    if (!videoElement) {
      throw new Error('ContinuousVisionMonitor requires a video element.')
    }

    this.isRunning = true

    VisionService.updateStatus({
      continuousMonitoringEnabled: true,
      activeMode: 'continuous_monitoring',
    })

    this.intervalId = window.setInterval(async () => {
      try {
        const frame = FrameCaptureService.captureFrame(videoElement)
        const result = await VisionPipeline.processFrame(frame)

        VisionService.updateStatus({
          lastFrameAvailable: true,
          activeMode: 'continuous_monitoring',
        })

        if (typeof onResult === 'function') {
          onResult(result)
        }
      } catch (error) {
        if (typeof onResult === 'function') {
          onResult({
            status: 'error',
            provider: 'CONTINUOUS_MONITOR',
            summary: error.message || 'Continuous monitoring failed.',
          })
        }
      }
    }, this.intervalMs)
  }

  stop() {
    if (this.intervalId) {
      window.clearInterval(this.intervalId)
      this.intervalId = null
    }

    this.isRunning = false

    VisionService.updateStatus({
      continuousMonitoringEnabled: false,
      activeMode: 'camera_preview',
    })
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      intervalMs: this.intervalMs,
    }
  }
}

export default new ContinuousVisionMonitor()