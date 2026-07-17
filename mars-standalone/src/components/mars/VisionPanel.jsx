/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Component:
 * VisionPanel
 *
 * Purpose:
 * Live camera bridge and developer diagnostics view for the
 * MARS Vision stack.
 *
 * Version:
 * v0.13.5
 *
 * Date Code:
 * 050726
 * ==========================================================
 */

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Camera, CameraOff, RefreshCcw, ScanEye } from 'lucide-react'
import VisionDiagnosticsPanel from './VisionDiagnosticsPanel'
import VisionFaceOverlay from './VisionFaceOverlay'
import ContinuousVisionMonitor from '@/services/vision/ContinuousVisionMonitor'
import VisionService from '@/services/vision/VisionService'
import CameraStreamStore from '@/services/vision/CameraStreamStore'
import { DiagnosticsManager } from '@/services/diagnostics'

export default function VisionPanel() {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)

  const [active, setActive] = useState(false)
  const [error, setError] = useState('')
  const [cameraFacing, setCameraFacing] = useState('environment')
  const [description, setDescription] = useState('')
  const [snapshot, setSnapshot] = useState('')
  const [lastCaptureTime, setLastCaptureTime] = useState(null)
  const [livePipelineResult, setLivePipelineResult] = useState(null)
  const [livePipelineError, setLivePipelineError] = useState('')

  const stopCamera = () => {
    ContinuousVisionMonitor.stop()

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }

    CameraStreamStore.clearStream()

    if (videoRef.current) {
      videoRef.current.srcObject = null
    }

    VisionService.updateStatus({
      cameraActive: false,
      cameraAvailable: false,
      activeMode: 'idle',
      continuousMonitoringEnabled: false,
    })

    setActive(false)
  }

  const startCamera = async () => {
    setError('')
    setDescription('')

    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Camera access is not supported in this browser.')
      return
    }

    try {
      stopCamera()

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: cameraFacing,
        },
        audio: false,
      })

      streamRef.current = stream
      CameraStreamStore.setStream(stream)

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }

      VisionService.updateStatus({
        cameraAvailable: true,
        cameraActive: true,
        activeMode: 'camera_preview',
      })

      setActive(true)
      startLivePipeline()
    } catch (err) {
      console.error('Camera error:', err)

      if (err.name === 'NotAllowedError') {
        setError('Camera permission was blocked. Allow camera access in the browser.')
      } else if (err.name === 'NotFoundError') {
        setError('No camera was found on this device.')
      } else {
        setError('Camera could not be started.')
      }

      VisionService.updateStatus({
        cameraActive: false,
        cameraAvailable: false,
        activeMode: 'camera_error',
      })

      setActive(false)
    }
  }

  const startLivePipeline = () => {
    if (!videoRef.current) {
      return
    }

    setLivePipelineError('')

    try {
      ContinuousVisionMonitor.start(videoRef.current, (result) => {
        if (result?.status === 'error') {
          setLivePipelineError(result.summary || 'Live pipeline processing failed.')
        } else {
          setLivePipelineError('')
        }

        setLivePipelineResult(result)
        DiagnosticsManager.runDiagnostics({
          pipelineResult: result,
          identityResult: result?.identity,
          notificationResult: result?.notificationEngine,
        })
      })
    } catch (err) {
      setLivePipelineError(err.message || 'Live pipeline could not be started.')
    }
  }

  const switchCamera = () => {
    setCameraFacing((current) =>
      current === 'environment' ? 'user' : 'environment'
    )
  }

  const describeScene = () => {
    setError('')

    if (!active || !videoRef.current || !canvasRef.current) {
      setError('Start the camera before describing the scene.')
      return
    }

    const video = videoRef.current
    const canvas = canvasRef.current

    if (!video.videoWidth || !video.videoHeight) {
      setError('Camera is still loading. Try again in a moment.')
      return
    }

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    const context = canvas.getContext('2d')
    context.drawImage(video, 0, 0, canvas.width, canvas.height)

    const imageData = canvas.toDataURL('image/jpeg', 0.85)
    const captureTime = Date.now()

    setSnapshot(imageData)
    setLastCaptureTime(captureTime)

    setDescription(
      'Snapshot captured. MARS Vision has a camera frame ready for analysis. In the next upgrade, this image will be sent to a vision AI model so MARS can describe people, objects, rooms, labels and hazards.'
    )
  }

  const visionResult = useMemo(() => {
    if (livePipelineResult) {
      return livePipelineResult
    }

    return {
      personDetected: Boolean(snapshot),
      bodyState: snapshot ? 'unknown' : 'unknown',
      movement: active ? 'camera_active' : 'unknown',
      activity: snapshot ? 'frame_captured' : 'unknown',
      faceState: 'foundation_ready',
      confidence: snapshot ? 0.65 : 0,
      timestamp: lastCaptureTime,
    }
  }, [active, snapshot, lastCaptureTime, livePipelineResult])

  const observation = useMemo(() => {
    if (livePipelineResult?.observationStream) {
      return {
        type: livePipelineResult.observationStream.primaryObservation || 'live_pipeline_observation',
        personPresent: Boolean(livePipelineResult.detections?.people),
        bodyState:
          livePipelineResult.bodyState?.posture ||
          livePipelineResult.poseSummary?.posture ||
          'unknown',
        movement: livePipelineResult.movement?.state || 'unknown',
        activity: livePipelineResult.activityRecognition?.activity || 'unknown',
        faceState: livePipelineResult.faceFoundation?.state || 'foundation_ready',
        confidence: (livePipelineResult.risk?.confidence || 0) / 100,
        timestamp: livePipelineResult.timestamp,
      }
    }

    if (!snapshot) {
      return null
    }

    return {
      type: 'camera_frame_captured',
      personPresent: true,
      bodyState: 'unknown',
      movement: active ? 'camera_active' : 'unknown',
      activity: 'frame_captured',
      faceState: 'foundation_ready',
      confidence: 0.65,
      timestamp: lastCaptureTime,
    }
  }, [active, snapshot, lastCaptureTime, livePipelineResult])

  const personalObservation = useMemo(() => {
    if (livePipelineResult?.personalObservation) {
      return livePipelineResult.personalObservation
    }

    if (!description) {
      return null
    }

    return {
      summary: 'MARS has captured a camera frame and prepared it for vision analysis.',
      description,
      timestamp: lastCaptureTime,
    }
  }, [description, lastCaptureTime, livePipelineResult])

  useEffect(() => {
    if (active) {
      startCamera()
    }
  }, [cameraFacing])

  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [])

  // v0.16.9: lets a control outside this component (the Identity
  // tab's Enroll button) turn the camera on without switching tabs
  // first. Registered through a ref so the handler CameraStreamStore
  // calls is always this render's startCamera, never a stale one,
  // without needing to re-register on every render.
  const startCameraRef = useRef(startCamera)
  startCameraRef.current = startCamera

  useEffect(() => {
    CameraStreamStore.setStartHandler(() => startCameraRef.current())
    return () => CameraStreamStore.setStartHandler(null)
  }, [])

  return (
    <div className="flex-1 flex flex-col overflow-hidden p-4">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-cyan-400">MARS Vision</h2>
        <p className="text-sm text-white/40 mt-1">
          Live camera bridge for MARS Mk1.
        </p>
      </div>

      <div className="relative flex-1 rounded-2xl overflow-hidden border border-cyan-500/20 bg-black/40 min-h-[320px]">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          playsInline
          muted
        />

        <canvas ref={canvasRef} className="hidden" />

        {active && (
          <VisionFaceOverlay
            videoRef={videoRef}
            facesRoster={livePipelineResult?.facesRoster || []}
            identityRoster={livePipelineResult?.identityRoster || []}
            identityHeld={Boolean(livePipelineResult?.identity?.identityHeld)}
            lockedDisplayName={livePipelineResult?.identity?.profile?.displayName || null}
          />
        )}

        {!active && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white/40">
            <CameraOff size={42} className="mb-3 text-white/20" />
            <div>Camera offline</div>
          </div>
        )}

        {active && (
          <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-cyan-500/20 border border-cyan-500/30 text-xs text-cyan-300">
            LIVE
          </div>
        )}
      </div>

      {error && (
        <div className="mt-3 rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {livePipelineError && (
        <div className="mt-3 rounded-xl bg-amber-500/10 border border-amber-500/30 px-4 py-3 text-sm text-amber-200">
          {livePipelineError}
        </div>
      )}

      {livePipelineResult && (
        <div className="mt-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-xs text-emerald-100">
          <div className="font-semibold text-emerald-300">Live Pipeline Online</div>
          <div className="mt-1 text-emerald-100/80">
            Frame {livePipelineResult.performance?.processedFrameCount || 0} · Risk {livePipelineResult.risk?.level ?? 0}/10 · {livePipelineResult.risk?.label || 'unknown'}
          </div>
        </div>
      )}

      <div className="mt-4 space-y-3">
        <button
          onClick={describeScene}
          disabled={!active}
          className="w-full rounded-xl bg-cyan-500/10 border border-cyan-500/30 py-3 text-cyan-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-cyan-500/20"
        >
          <div className="flex items-center justify-center gap-2">
            <ScanEye size={18} />
            Describe Scene
          </div>
        </button>

        <div className="flex gap-3">
          <button
            onClick={active ? stopCamera : startCamera}
            className={`flex-1 rounded-xl px-4 py-3 border transition ${
              active
                ? 'bg-red-500/10 border-red-500/30 text-red-300'
                : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              {active ? <CameraOff size={18} /> : <Camera size={18} />}
              {active ? 'Stop Camera' : 'Start Camera'}
            </div>
          </button>

          <button
            onClick={switchCamera}
            className="w-14 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-center text-white/50 hover:text-cyan-300"
          >
            <RefreshCcw size={18} />
          </button>
        </div>
      </div>

      {description && (
        <div className="mt-4 rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-4 text-sm text-white/80">
          <div className="font-semibold text-cyan-300 mb-2">
            MARS Observation
          </div>
          {description}
        </div>
      )}

      {snapshot && (
        <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <div className="text-xs text-white/40 mb-2">Last captured frame</div>
          <img
            src={snapshot}
            alt="MARS captured camera frame"
            className="rounded-lg border border-white/10"
          />
        </div>
      )}

      <div className="mt-4">
        <VisionDiagnosticsPanel
          visionResult={visionResult}
          observation={observation}
          personalObservation={personalObservation}
          frameStatus={{
            cameraReady: active,
            message: livePipelineResult
              ? 'Camera stream feeding live pipeline'
              : active
                ? 'Camera stream available; waiting for live pipeline frame'
                : 'Camera stream not ready',
          }}
        />
      </div>
    </div>
  )
}