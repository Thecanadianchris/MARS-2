/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Component:
 * CameraPreviewPanel
 *
 * Purpose:
 * Displays a live camera preview, captures frames and runs
 * continuous monitoring through the MARS Vision Pipeline.
 *
 * Version:
 * v0.10.8
 *
 * Date Code:
 * 280626
 * ==========================================================
 */

import { useRef, useState } from 'react'
import CameraService from '@/services/vision/CameraService'
import VisionService from '@/services/vision/VisionService'
import FrameCaptureService from '@/services/vision/FrameCaptureService'
import VisionPipeline from '@/services/vision/VisionPipeline'
import ContinuousVisionMonitor from '@/services/vision/ContinuousVisionMonitor'

export default function CameraPreviewPanel() {
  const videoRef = useRef(null)

  const [cameraState, setCameraState] = useState({
    active: false,
    monitoring: false,
    error: null,
  })

  const [pipelineResult, setPipelineResult] = useState(null)

  const handleStartCamera = async () => {
    try {
      const cameraStatus = await CameraService.startCamera(videoRef.current)

      VisionService.updateStatus({
        cameraAvailable: cameraStatus.cameraAvailable,
        cameraActive: cameraStatus.cameraActive,
        lastFrameAvailable: false,
        activeMode: 'camera_preview',
      })

      setCameraState({
        active: true,
        monitoring: false,
        error: null,
      })
    } catch (error) {
      VisionService.updateStatus({
        cameraAvailable: false,
        cameraActive: false,
        lastFrameAvailable: false,
        activeMode: 'camera_error',
      })

      setCameraState({
        active: false,
        monitoring: false,
        error: error.message || 'Camera failed to start.',
      })
    }
  }

  const handleStopCamera = () => {
    ContinuousVisionMonitor.stop()
    VisionPipeline.reset()
    CameraService.stopCamera()

    VisionService.updateStatus({
      cameraActive: false,
      lastFrameAvailable: false,
      continuousMonitoringEnabled: false,
      activeMode: 'idle',
    })

    setCameraState({
      active: false,
      monitoring: false,
      error: null,
    })

    setPipelineResult(null)
  }

  const handleCaptureFrame = async () => {
    try {
      const frame = FrameCaptureService.captureFrame(videoRef.current)
      const result = await VisionPipeline.processFrame(frame)

      VisionService.updateStatus({
        lastFrameAvailable: true,
        activeMode: 'frame_captured',
      })

      setPipelineResult(result)
    } catch (error) {
      setPipelineResult({
        status: 'error',
        provider: 'LOCAL_PIPELINE',
        summary: error.message || 'Frame capture failed.',
      })
    }
  }

  const handleStartMonitoring = () => {
    try {
      ContinuousVisionMonitor.start(videoRef.current, (result) => {
        setPipelineResult(result)
      })

      setCameraState((current) => ({
        ...current,
        monitoring: true,
        error: null,
      }))
    } catch (error) {
      setCameraState((current) => ({
        ...current,
        monitoring: false,
        error: error.message || 'Continuous monitoring failed to start.',
      }))
    }
  }

  const handleStopMonitoring = () => {
    ContinuousVisionMonitor.stop()

    setCameraState((current) => ({
      ...current,
      monitoring: false,
      error: null,
    }))
  }

  return (
    <div className="rounded-2xl border border-cyan-500/20 bg-slate-950/70 p-4 text-sm text-cyan-100 shadow-lg shadow-cyan-500/10">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold tracking-widest text-cyan-300">
          CAMERA PREVIEW
        </h2>

        <span className="rounded-full bg-cyan-500/10 px-2 py-1 text-xs text-cyan-300">
          {cameraState.monitoring
            ? 'monitoring'
            : cameraState.active
              ? 'active'
              : 'idle'}
        </span>
      </div>

      <div className="overflow-hidden rounded-2xl border border-cyan-500/10 bg-black">
        <video
          ref={videoRef}
          className="aspect-video w-full object-cover"
          playsInline
          muted
        />
      </div>

      {cameraState.error && (
        <div className="mt-3 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-200">
          {cameraState.error}
        </div>
      )}

      {pipelineResult && (
        <div className="mt-3 rounded-xl border border-cyan-500/10 bg-cyan-500/5 p-3 text-xs text-cyan-100">
          <div className="mb-2 font-semibold tracking-wide text-cyan-300">
            VISION PIPELINE RESULT
          </div>

          <ResultRow label="Status" value={pipelineResult.status || 'unknown'} />
          <ResultRow label="Provider" value={pipelineResult.provider || 'unknown'} />

          {pipelineResult.frame && (
            <ResultRow
              label="Frame"
              value={`${pipelineResult.frame.width} x ${pipelineResult.frame.height}`}
            />
          )}

          {pipelineResult.performance && (
            <>
              <ResultRow label="FPS" value={pipelineResult.performance.fps} />
              <ResultRow
                label="Latency"
                value={`${pipelineResult.performance.latencyMs} ms`}
              />
            </>
          )}

          {pipelineResult.detections && (
            <>
              <ResultRow label="People" value={pipelineResult.detections.people} />
              <ResultRow label="Faces" value={pipelineResult.detections.faces} />
              <ResultRow label="Objects" value={pipelineResult.detections.objects} />
              <ResultRow label="Pose" value={pipelineResult.detections.pose} />
            </>
          )}

          {pipelineResult.movement && (
            <>
              <ResultRow
                label="Movement"
                value={pipelineResult.movement.movement}
              />
              <ResultRow
                label="Direction"
                value={pipelineResult.movement.direction || 'unknown'}
              />
              <ResultRow
                label="Movement Delta"
                value={pipelineResult.movement.delta ?? 0}
              />
              <ResultRow
                label="Posture"
                value={pipelineResult.movement.posture}
              />
              <ResultRow
                label="Movement Confidence"
                value={`${pipelineResult.movement.confidence}%`}
              />
            </>
          )}

          {pipelineResult.behaviourHistory && (
            <>
              <ResultRow
                label="Behaviour"
                value={
                  pipelineResult.behaviourHistory.behaviourDisplay ||
                  pipelineResult.behaviourHistory.behaviourState
                }
              />
              <ResultRow
                label="History Samples"
                value={pipelineResult.behaviourHistory.sampleCount}
              />
              <ResultRow
                label="Visible Ratio"
                value={`${Math.round(
                  pipelineResult.behaviourHistory.ratios.visibility * 100
                )}%`}
              />
              <ResultRow
                label="Lying Time"
                value={`${Math.round(
                  pipelineResult.behaviourHistory.durations.lyingMs / 1000
                )}s`}
              />
              <ResultRow
                label="Moving Time"
                value={`${Math.round(
                  pipelineResult.behaviourHistory.durations.movingMs / 1000
                )}s`}
              />
              <ResultRow
                label="Stationary Time"
                value={`${Math.round(
                  pipelineResult.behaviourHistory.durations.stationaryMs / 1000
                )}s`}
              />
            </>
          )}

          {pipelineResult.behaviourPattern && (
            <>
              <ResultRow
                label="Pattern"
                value={pipelineResult.behaviourPattern.patternDisplay}
              />
              <ResultRow
                label="Transition"
                value={pipelineResult.behaviourPattern.transitionDisplay}
              />
              <ResultRow
                label="Pattern Confidence"
                value={`${pipelineResult.behaviourPattern.confidence}%`}
              />
            </>
          )}

          {pipelineResult.risk && (
            <>
              <ResultRow label="Risk" value={`${pipelineResult.risk.level} / 10`} />
              <ResultRow label="Risk State" value={pipelineResult.risk.label} />
              <ResultRow
                label="Confidence"
                value={`${pipelineResult.risk.confidence}%`}
              />
            </>
          )}

          <div className="mt-3 border-t border-cyan-500/10 pt-3 text-cyan-200/80">
            {pipelineResult.summary}
          </div>
        </div>
      )}

      <div className="mt-4 grid grid-cols-1 gap-2">
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={handleStartCamera}
            disabled={cameraState.active}
            className="rounded-xl border border-green-500/20 bg-green-500/10 px-3 py-2 text-xs font-semibold tracking-wide text-green-200 hover:bg-green-500/20 disabled:cursor-not-allowed disabled:opacity-40"
          >
            START CAMERA
          </button>

          <button
            onClick={handleStopCamera}
            disabled={!cameraState.active}
            className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs font-semibold tracking-wide text-red-200 hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-40"
          >
            STOP CAMERA
          </button>
        </div>

        <button
          onClick={handleCaptureFrame}
          disabled={!cameraState.active}
          className="rounded-xl border border-cyan-500/20 bg-cyan-500/10 px-3 py-2 text-xs font-semibold tracking-wide text-cyan-200 hover:bg-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-40"
        >
          CAPTURE FRAME
        </button>

        {!cameraState.monitoring ? (
          <button
            onClick={handleStartMonitoring}
            disabled={!cameraState.active}
            className="rounded-xl border border-green-500/20 bg-green-500/10 px-3 py-2 text-xs font-semibold tracking-wide text-green-200 hover:bg-green-500/20 disabled:cursor-not-allowed disabled:opacity-40"
          >
            START MONITORING
          </button>
        ) : (
          <button
            onClick={handleStopMonitoring}
            className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs font-semibold tracking-wide text-red-200 hover:bg-red-500/20"
          >
            STOP MONITORING
          </button>
        )}
      </div>
    </div>
  )
}

function ResultRow({ label, value }) {
  return (
    <div className="flex justify-between gap-4 py-0.5">
      <span className="text-slate-400">{label}</span>
      <span className="text-right font-medium text-cyan-200">{value}</span>
    </div>
  )
}