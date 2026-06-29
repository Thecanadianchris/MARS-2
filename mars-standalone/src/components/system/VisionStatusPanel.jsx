/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Component:
 * VisionStatusPanel
 *
 * Purpose:
 * Displays current MARS Vision status and developer diagnostics.
 *
 * Version:
 * v0.11.4
 *
 * Date Code:
 * 290626
 * ==========================================================
 */

import { useEffect, useState } from 'react'
import VisionService from '@/services/vision/VisionService'

export default function VisionStatusPanel() {
  const [status, setStatus] = useState(VisionService.getStatus())

  const refreshStatus = () => {
    setStatus({ ...VisionService.getStatus() })
  }

  const handleInitialise = async () => {
    const updatedStatus = await VisionService.initialise()
    setStatus({ ...updatedStatus })
  }

  const handleEnableMonitoring = () => {
    const updatedStatus = VisionService.enableContinuousMonitoring()
    setStatus({ ...updatedStatus })
  }

  const handleDisableMonitoring = () => {
    const updatedStatus = VisionService.disableContinuousMonitoring()
    setStatus({ ...updatedStatus })
  }

  useEffect(() => {
    const interval = window.setInterval(() => {
      refreshStatus()
    }, 1000)

    return () => {
      window.clearInterval(interval)
    }
  }, [])

  return (
    <div className="rounded-2xl border border-cyan-500/20 bg-slate-950/70 p-4 text-sm text-cyan-100 shadow-lg shadow-cyan-500/10">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold tracking-widest text-cyan-300">
            MARS VISION
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Vision stack status and diagnostic controls.
          </p>
        </div>

        <span className="rounded-full bg-cyan-500/10 px-2 py-1 text-xs text-cyan-300">
          {status.activeMode || 'unknown'}
        </span>
      </div>

      <div className="space-y-2">
        <StatusRow label="Camera Available" active={status.cameraAvailable} />
        <StatusRow label="Camera Active" active={status.cameraActive} />
        <StatusRow label="Frame Available" active={status.lastFrameAvailable} />
        <StatusRow label="Local Processing" active={status.localProcessingEnabled} />
        <StatusRow label="Cloud Vision" active={status.cloudVisionEnabled} />
        <StatusRow label="Continuous Monitoring" active={status.continuousMonitoringEnabled} />
      </div>

      <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-3">
        <div className="mb-2 text-xs font-semibold tracking-widest text-cyan-300">
          DIAGNOSTICS
        </div>

        <div className="space-y-2">
          <DiagnosticRow
            label="Pipeline State"
            value={status.pipelineState || derivePipelineState(status)}
          />
          <DiagnosticRow
            label="Processing Mode"
            value={status.localProcessingEnabled ? 'local' : 'disabled'}
          />
          <DiagnosticRow
            label="Monitoring State"
            value={status.continuousMonitoringEnabled ? 'enabled' : 'disabled'}
          />
          <DiagnosticRow
            label="Cloud Provider"
            value={status.cloudVisionEnabled ? 'available' : 'not active'}
          />
          <DiagnosticRow
            label="Last Frame"
            value={status.lastFrameAvailable ? 'available' : 'none'}
          />
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-3">
        <div className="mb-2 text-xs font-semibold tracking-widest text-cyan-300">
          ENGINE READINESS
        </div>

        <div className="space-y-2">
          <ReadinessRow
            label="Camera Service"
            ready={Boolean(status.cameraAvailable)}
          />
          <ReadinessRow
            label="Frame Capture Service"
            ready={Boolean(status.cameraActive || status.lastFrameAvailable)}
          />
          <ReadinessRow
            label="Vision Pipeline"
            ready={Boolean(status.localProcessingEnabled)}
          />
          <ReadinessRow
            label="Continuous Monitor"
            ready={Boolean(status.continuousMonitoringEnabled)}
          />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-2">
        <button
          onClick={handleInitialise}
          className="rounded-xl border border-cyan-500/20 bg-cyan-500/10 px-3 py-2 text-xs font-semibold tracking-wide text-cyan-200 hover:bg-cyan-500/20"
        >
          INITIALISE VISION
        </button>

        {!status.continuousMonitoringEnabled ? (
          <button
            onClick={handleEnableMonitoring}
            className="rounded-xl border border-green-500/20 bg-green-500/10 px-3 py-2 text-xs font-semibold tracking-wide text-green-200 hover:bg-green-500/20"
          >
            ENABLE MONITORING
          </button>
        ) : (
          <button
            onClick={handleDisableMonitoring}
            className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs font-semibold tracking-wide text-red-200 hover:bg-red-500/20"
          >
            DISABLE MONITORING
          </button>
        )}
      </div>
    </div>
  )
}

function StatusRow({ label, active }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span
          className={`h-2.5 w-2.5 rounded-full ${
            active ? 'bg-cyan-400' : 'bg-slate-600'
          }`}
        />
        <span>{label}</span>
      </div>

      <span className="text-xs text-slate-400">
        {active ? 'online' : 'offline'}
      </span>
    </div>
  )
}

function DiagnosticRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-slate-400">{label}</span>
      <span className="text-right text-cyan-200">{value || 'unknown'}</span>
    </div>
  )
}

function ReadinessRow({ label, ready }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-slate-400">{label}</span>
      <span
        className={`rounded-full px-2 py-0.5 text-xs ${
          ready
            ? 'bg-green-500/10 text-green-300'
            : 'bg-slate-500/10 text-slate-400'
        }`}
      >
        {ready ? 'ready' : 'waiting'}
      </span>
    </div>
  )
}

function derivePipelineState(status) {
  if (!status.cameraAvailable) {
    return 'camera unavailable'
  }

  if (!status.cameraActive) {
    return 'camera inactive'
  }

  if (!status.localProcessingEnabled) {
    return 'local processing disabled'
  }

  if (status.continuousMonitoringEnabled) {
    return 'monitoring'
  }

  return 'ready'
}