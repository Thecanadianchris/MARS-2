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
 * Responsibilities:
 * - Start continuous camera frame monitoring
 * - Capture frames at a controlled interval
 * - Process frames through the Vision Pipeline
 * - Prevent overlapping asynchronous frame processing
 * - Report live results back to the UI
 * - Maintain continuous monitoring status
 *
 * Version:
 * v0.12.3
 *
 * Date Code:
 * 300626
 * ==========================================================
 */

import FrameCaptureService from './FrameCaptureService'
import VisionPipeline from './VisionPipeline'
import VisionService from './VisionService'

class ContinuousVisionMonitor {
  constructor() {
    this.timeoutId = null
    this.isRunning = false
    this.isProcessingFrame = false
    this.intervalMs = 1000
    this.lastFrameStartedAt = null
    this.lastFrameCompletedAt = null
    this.lastFrameDurationMs = null
    this.processedFrameCount = 0
    this.skippedFrameCount = 0
  }

  start(videoElement, onResult) {
    if (this.isRunning) {
      return
    }

    if (!videoElement) {
      throw new Error('ContinuousVisionMonitor requires a video element.')
    }

    this.isRunning = true
    this.isProcessingFrame = false
    this.lastFrameStartedAt = null
    this.lastFrameCompletedAt = null
    this.lastFrameDurationMs = null
    this.processedFrameCount = 0
    this.skippedFrameCount = 0

    VisionService.updateStatus({
      continuousMonitoringEnabled: true,
      activeMode: 'continuous_monitoring',
    })

    this.scheduleNextFrame(videoElement, onResult, 0)
  }

  scheduleNextFrame(videoElement, onResult, delayMs = this.intervalMs) {
    if (!this.isRunning) {
      return
    }

    this.timeoutId = window.setTimeout(() => {
      this.processFrame(videoElement, onResult)
    }, delayMs)
  }

  async processFrame(videoElement, onResult) {
    if (!this.isRunning) {
      return
    }

    if (this.isProcessingFrame) {
      this.skippedFrameCount += 1
      this.scheduleNextFrame(videoElement, onResult)
      return
    }

    this.isProcessingFrame = true
    this.lastFrameStartedAt = performance.now()

    try {
      const frame = FrameCaptureService.captureFrame(videoElement)
      const result = await VisionPipeline.processFrame(frame)

      this.lastFrameCompletedAt = performance.now()
      this.lastFrameDurationMs = Math.round(
        this.lastFrameCompletedAt - this.lastFrameStartedAt
      )
      this.processedFrameCount += 1

      VisionService.updateStatus({
        lastFrameAvailable: true,
        activeMode: 'continuous_monitoring',
      })

      if (typeof onResult === 'function') {
        onResult({
          ...result,
          monitor: this.getStatus(),
        })
      }
    } catch (error) {
      this.lastFrameCompletedAt = performance.now()
      this.lastFrameDurationMs = Math.round(
        this.lastFrameCompletedAt - this.lastFrameStartedAt
      )

      if (typeof onResult === 'function') {
        onResult({
          status: 'error',
          provider: 'CONTINUOUS_MONITOR',
          summary: error.message || 'Continuous monitoring failed.',
          monitor: this.getStatus(),
        })
      }
    } finally {
      this.isProcessingFrame = false
      this.scheduleNextFrame(videoElement, onResult)
    }
  }

  stop() {
    if (this.timeoutId) {
      window.clearTimeout(this.timeoutId)
      this.timeoutId = null
    }

    this.isRunning = false
    this.isProcessingFrame = false

    VisionService.updateStatus({
      continuousMonitoringEnabled: false,
      activeMode: 'camera_preview',
    })
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      isProcessingFrame: this.isProcessingFrame,
      intervalMs: this.intervalMs,
      lastFrameStartedAt: this.lastFrameStartedAt,
      lastFrameCompletedAt: this.lastFrameCompletedAt,
      lastFrameDurationMs: this.lastFrameDurationMs,
      processedFrameCount: this.processedFrameCount,
      skippedFrameCount: this.skippedFrameCount,
    }
  }
}

export default new ContinuousVisionMonitor()