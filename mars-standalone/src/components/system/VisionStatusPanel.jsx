/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Component:
 * VisionStatusPanel
 *
 * Purpose:
 * Displays current MARS Vision status.
 *
 * Version:
 * v0.10.0
 *
 * Date Code:
 * 270626
 * ==========================================================
 */

import { useState } from 'react'
import VisionService from '@/services/vision/VisionService'

export default function VisionStatusPanel() {
  const [status, setStatus] = useState(VisionService.getStatus())

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

  return (
    <div className="rounded-2xl border border-cyan-500/20 bg-slate-950/70 p-4 text-sm text-cyan-100 shadow-lg shadow-cyan-500/10">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold tracking-widest text-cyan-300">
          MARS VISION
        </h2>

        <span className="rounded-full bg-cyan-500/10 px-2 py-1 text-xs text-cyan-300">
          {status.activeMode}
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