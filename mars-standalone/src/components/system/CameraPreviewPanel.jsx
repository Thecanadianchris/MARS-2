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
 * v0.11.4
 *
 * Date Code:
 * 290626
 * ==========================================================
 */

import { useMemo, useRef, useState } from 'react'
import CameraService from '@/services/vision/CameraService'
import VisionService from '@/services/vision/VisionService'
import FrameCaptureService from '@/services/vision/FrameCaptureService'
import VisionPipeline from '@/services/vision/VisionPipeline'
import ContinuousVisionMonitor from '@/services/vision/ContinuousVisionMonitor'

export default function CameraPreviewPanel() {
  const videoRef = useRef(null)
  const lastResultTimeRef = useRef(null)

  const [cameraState, setCameraState] = useState({
    active: false,
    monitoring: false,
    error: null,
  })

  const [pipelineResult, setPipelineResult] = useState(null)
  const [diagnostics, setDiagnostics] = useState({
    framesProcessed: 0,
    lastUpdateTime: null,
    averageIntervalMs: 0,
  })

  const diagnosticSummary = useMemo(() => {
    const confidence = pipelineResult?.risk?.confidence ?? 0
    const riskLevel = pipelineResult?.risk?.level ?? 0
    const observationCount =
      pipelineResult?.observationStream?.observationCount ?? 0

    return {
      confidence,
      riskLevel,
      observationCount,
      systemState: cameraState.monitoring
        ? 'monitoring'
        : cameraState.active
          ? 'camera active'
          : 'idle',
      lastUpdate: diagnostics.lastUpdateTime
        ? new Date(diagnostics.lastUpdateTime).toLocaleTimeString()
        : 'none',
    }
  }, [cameraState.active, cameraState.monitoring, diagnostics, pipelineResult])

  const updatePipelineResult = (result) => {
    const now = Date.now()
    const previousTime = lastResultTimeRef.current
    const intervalMs = previousTime ? now - previousTime : 0

    lastResultTimeRef.current = now

    setPipelineResult(result)

    setDiagnostics((current) => ({
      framesProcessed: current.framesProcessed + 1,
      lastUpdateTime: now,
      averageIntervalMs:
        current.framesProcessed === 0
          ? intervalMs
          : Math.round(
              (current.averageIntervalMs * current.framesProcessed + intervalMs) /
                (current.framesProcessed + 1)
            ),
    }))
  }

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
    lastResultTimeRef.current = null

    setDiagnostics({
      framesProcessed: 0,
      lastUpdateTime: null,
      averageIntervalMs: 0,
    })
  }

  const handleCaptureFrame = async () => {
    try {
      const frame = FrameCaptureService.captureFrame(videoRef.current)
      const result = await VisionPipeline.processFrame(frame)

      VisionService.updateStatus({
        lastFrameAvailable: true,
        activeMode: 'frame_captured',
      })

      updatePipelineResult(result)
    } catch (error) {
      updatePipelineResult({
        status: 'error',
        provider: 'LOCAL_PIPELINE',
        summary: error.message || 'Frame capture failed.',
      })
    }
  }

  const handleStartMonitoring = () => {
    try {
      ContinuousVisionMonitor.start(videoRef.current, (result) => {
        updatePipelineResult(result)
      })

      VisionService.updateStatus({
        continuousMonitoringEnabled: true,
        activeMode: 'continuous_monitoring',
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

    VisionService.updateStatus({
      continuousMonitoringEnabled: false,
      activeMode: cameraState.active ? 'camera_preview' : 'idle',
    })

    setCameraState((current) => ({
      ...current,
      monitoring: false,
      error: null,
    }))
  }

  return (
    <div className="rounded-2xl border border-cyan-500/20 bg-slate-950/70 p-4 text-sm text-cyan-100 shadow-lg shadow-cyan-500/10">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold tracking-widest text-cyan-300">
            CAMERA PREVIEW
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Live perception stack and developer diagnostics.
          </p>
        </div>

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

      <div className="mt-3 grid grid-cols-2 gap-2">
        <DiagnosticCard
          label="System"
          value={diagnosticSummary.systemState}
        />
        <DiagnosticCard
          label="Frames"
          value={diagnostics.framesProcessed}
        />
        <DiagnosticCard
          label="Observations"
          value={diagnosticSummary.observationCount}
        />
        <DiagnosticCard
          label="Confidence"
          value={`${diagnosticSummary.confidence}%`}
        />
        <DiagnosticCard
          label="Risk"
          value={`${diagnosticSummary.riskLevel}/10`}
        />
        <DiagnosticCard
          label="Last Update"
          value={diagnosticSummary.lastUpdate}
        />
      </div>

      {pipelineResult && (
        <div className="mt-3 rounded-xl border border-cyan-500/10 bg-cyan-500/5 p-3 text-xs text-cyan-100">
          <div className="mb-2 flex items-center justify-between gap-3">
            <div className="font-semibold tracking-wide text-cyan-300">
              VISION PIPELINE RESULT
            </div>

            <span className="rounded-full bg-cyan-500/10 px-2 py-0.5 text-[10px] uppercase tracking-widest text-cyan-300">
              {pipelineResult.status || 'unknown'}
            </span>
          </div>

          <ResultSection title="Core">
            <ResultRow label="Status" value={pipelineResult.status || 'unknown'} />
            <ResultRow label="Provider" value={pipelineResult.provider || 'unknown'} />
            <ResultRow
              label="Average Interval"
              value={
                diagnostics.averageIntervalMs
                  ? `${diagnostics.averageIntervalMs} ms`
                  : 'waiting'
              }
            />

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
          </ResultSection>

          {pipelineResult.detections && (
            <ResultSection title="Detections">
              <ResultRow label="People" value={pipelineResult.detections.people} />
              <ResultRow label="Faces" value={pipelineResult.detections.faces} />
              <ResultRow label="Objects" value={pipelineResult.detections.objects} />
              <ResultRow label="Pose" value={pipelineResult.detections.pose} />
            </ResultSection>
          )}

          {pipelineResult.movement && (
            <ResultSection title="Movement Analysis">
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
            </ResultSection>
          )}

          {pipelineResult.behaviourHistory && (
            <ResultSection title="Behaviour History">
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
            </ResultSection>
          )}

          {pipelineResult.behaviourPattern && (
            <ResultSection title="Behaviour Pattern">
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
            </ResultSection>
          )}

          {pipelineResult.activityRecognition && (
            <ResultSection title="Activity Recognition">
              <ResultRow
                label="Activity"
                value={pipelineResult.activityRecognition.activityDisplay}
              />
              <ResultRow
                label="Activity Direction"
                value={pipelineResult.activityRecognition.direction || 'unknown'}
              />
              <ResultRow
                label="Activity Confidence"
                value={`${pipelineResult.activityRecognition.confidence}%`}
              />
            </ResultSection>
          )}

          {pipelineResult.faceFoundation && (
            <ResultSection title="Face Foundation">
              <ResultRow
                label="Face Foundation"
                value={
                  pipelineResult.faceFoundation.faceDetected
                    ? 'detected'
                    : 'not detected'
                }
              />
              <ResultRow
                label="Head Orientation"
                value={pipelineResult.faceFoundation.head?.orientation || 'unknown'}
              />
              <ResultRow
                label="Head Pitch"
                value={pipelineResult.faceFoundation.head?.pitch || 'unknown'}
              />
              <ResultRow
                label="Head Yaw"
                value={pipelineResult.faceFoundation.head?.yaw || 'unknown'}
              />
              <ResultRow
                label="Head Roll"
                value={pipelineResult.faceFoundation.head?.roll || 'unknown'}
              />
              <ResultRow
                label="Pitch Score"
                value={pipelineResult.faceFoundation.head?.pitchScore ?? 0}
              />
              <ResultRow
                label="Yaw Score"
                value={pipelineResult.faceFoundation.head?.yawScore ?? 0}
              />
              <ResultRow
                label="Roll Score"
                value={pipelineResult.faceFoundation.head?.rollScore ?? 0}
              />
              <ResultRow
                label="Head Confidence"
                value={`${pipelineResult.faceFoundation.confidence}%`}
              />
              <ResultRow
                label="Observations"
                value={
                  pipelineResult.faceFoundation.observations
                    ?.map((observation) => observation.label)
                    .join(', ') || 'none'
                }
              />
            </ResultSection>
          )}

          {pipelineResult.observationStream && (
            <ResultSection title="Observation Stream">
              <ResultRow
                label="Observation Count"
                value={pipelineResult.observationStream.observationCount}
              />
              <ResultRow
                label="Observation Stream"
                value={
                  pipelineResult.observationStream.labels?.join(', ') || 'none'
                }
              />
            </ResultSection>
          )}

          {pipelineResult.personalObservation && (
            <ResultSection title="Personal Observation">
              <ResultRow
                label="Personal Profile"
                value={
                  pipelineResult.personalObservation.profile?.displayName ||
                  'unknown'
                }
              />
              <ResultRow
                label="Personal Markers"
                value={pipelineResult.personalObservation.activeMarkerCount}
              />
              <ResultRow
                label="Personal Priority"
                value={pipelineResult.personalObservation.highestPriority}
              />
              <ResultRow
                label="Marker Details"
                value={
                  pipelineResult.personalObservation.markers
                    ?.map(
                      (marker) =>
                        `${marker.label}: ${
                          marker.active
                            ? 'active'
                            : marker.currentlyObserved
                              ? `${marker.durationSeconds}/${marker.requiredSeconds}s`
                              : 'inactive'
                        }`
                    )
                    .join(', ') || 'none'
                }
              />
            </ResultSection>
          )}

          {pipelineResult.risk && (
            <ResultSection title="Risk">
              <ResultRow label="Risk" value={`${pipelineResult.risk.level} / 10`} />
              <ResultRow label="Risk State" value={pipelineResult.risk.label} />
              <ResultRow
                label="Confidence"
                value={`${pipelineResult.risk.confidence}%`}
              />
            </ResultSection>
          )}

          <div className="mt-3 border-t border-cyan-500/10 pt-3 text-cyan-200/80">
            {pipelineResult.summary || 'No summary available.'}
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

function DiagnosticCard({ label, value }) {
  return (
    <div className="rounded-xl border border-cyan-500/10 bg-cyan-500/[0.04] p-2">
      <div className="text-[10px] uppercase tracking-widest text-slate-500">
        {label}
      </div>
      <div className="mt-1 truncate text-xs font-semibold text-cyan-200">
        {value ?? 'unknown'}
      </div>
    </div>
  )
}

function ResultSection({ title, children }) {
  return (
    <div className="mt-3 border-t border-cyan-500/10 pt-3">
      <div className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-cyan-400/80">
        {title}
      </div>
      <div className="space-y-1">{children}</div>
    </div>
  )
}

function ResultRow({ label, value }) {
  return (
    <div className="flex justify-between gap-4 py-0.5">
      <span className="text-slate-400">{label}</span>
      <span className="max-w-[65%] text-right font-medium text-cyan-200">
        {value ?? 'unknown'}
      </span>
    </div>
  )
}