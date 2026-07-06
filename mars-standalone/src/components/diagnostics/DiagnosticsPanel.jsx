/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Component:
 * DiagnosticsPanel
 *
 * Purpose:
 * Main UI panel for the MARS v0.13.6 Diagnostics Stabilisation
 * Framework.
 *
 * Version:
 * v0.13.6
 *
 * Date Code:
 * 040726
 * ==========================================================
 */

import { Activity, RefreshCw } from 'lucide-react'
import useDiagnostics from '@/hooks/useDiagnostics'
import StatusIndicator from './StatusIndicator'
import CapabilityStateBadge from '@/components/mars/CapabilityStateBadge'
import DiagnosticsSection from './DiagnosticsSection'

export default function DiagnosticsPanel() {
  const { snapshot, refresh } = useDiagnostics()
  const groups = snapshot?.groups || {}

  return (
    <div className="flex flex-col gap-4 p-4 overflow-y-auto">
      <div className="rounded-2xl border border-cyan-500/20 bg-slate-950/70 p-4 text-sm text-cyan-100 shadow-lg shadow-cyan-500/10">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-cyan-500/20 bg-cyan-500/10">
              <Activity size={19} className="text-cyan-300" />
            </div>

            <div>
              <h1 className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300">
                Diagnostics
              </h1>
              <p className="mt-1 text-xs leading-relaxed text-slate-400">
                v0.13.6 stabilisation status for the live pipeline, diagnostics store,
                identity, behaviour, decision, notification and optional support systems.
              </p>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            <CapabilityStateBadge state={snapshot?.capabilityState} />
            <StatusIndicator status={snapshot?.status} />
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-xs text-slate-300">
          {snapshot?.summary || 'Diagnostics snapshot unavailable.'}
        </div>


        <div className="mt-3 rounded-xl border border-amber-400/20 bg-amber-500/10 p-3 text-xs leading-relaxed text-amber-100">
          v0.13.6 Diagnostics Stabilisation active: live pipeline freshness, required fields and diagnostics snapshot history are checked before later Voice, Memory and Face Recognition milestones.
        </div>

        <div className="mt-4 grid grid-cols-4 gap-2 text-center text-xs">
          <Metric label="Total" value={snapshot?.counts?.total || 0} />
          <Metric label="Ready" value={(snapshot?.counts?.ready || 0) + (snapshot?.counts?.online || 0)} />
          <Metric label="Waiting" value={snapshot?.counts?.waiting || 0} />
          <Metric label="Failed Checks" value={snapshot?.stability?.failedCheckCount || 0} />
        </div>

        <PipelineHealthSummary pipelineHealth={snapshot?.pipelineHealth} />

        <button
          onClick={refresh}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-cyan-500/20 bg-cyan-500/10 px-3 py-2 text-xs font-semibold tracking-wide text-cyan-200 hover:bg-cyan-500/20"
        >
          <RefreshCw size={13} />
          REFRESH DIAGNOSTICS
        </button>
      </div>

      {Object.entries(groups).map(([groupName, items]) => (
        <DiagnosticsSection key={groupName} title={groupName} items={items} />
      ))}
    </div>
  )
}

function Metric({ label, value }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
      <div className="text-lg font-bold text-white">{value}</div>
      <div className="mt-1 uppercase tracking-widest text-slate-500">{label}</div>
    </div>
  )
}

function PipelineHealthSummary({ pipelineHealth }) {
  if (!pipelineHealth) {
    return null
  }

  return (
    <div className="mt-4 rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">
            Pipeline Health
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-slate-400">
            {pipelineHealth.summary}
          </p>
        </div>
        <StatusIndicator status={pipelineHealth.status} />
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
        <Metric label="Frames" value={pipelineHealth.metrics?.frameCount || 0} />
        <Metric label="Latency" value={`${pipelineHealth.metrics?.latencyMs || 0} ms`} />
        <Metric label="FPS" value={pipelineHealth.metrics?.fps || 0} />
      </div>

      <div className="mt-3 space-y-2">
        {(pipelineHealth.stages || []).map((stage) => (
          <div key={stage.name} className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs">
            <div>
              <div className="font-semibold text-slate-200">{stage.name}</div>
              <div className="mt-0.5 text-[11px] text-slate-500">
                {stage.message}
              </div>
            </div>
            <div className="text-right">
              <StatusIndicator status={stage.status} />
              <div className="mt-1 text-[11px] text-slate-500">
                {stage.processingTimeMs || 0} ms
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
