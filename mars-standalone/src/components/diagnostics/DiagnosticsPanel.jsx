/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Component:
 * DiagnosticsPanel
 *
 * Purpose:
 * Main UI panel for the MARS v0.13.4 M2.1 Diagnostics
 * Framework.
 *
 * Version:
 * v0.13.4
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
                M2.1 framework status for robot-local intelligence, identity,
                decision, notification and optional support systems.
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
          EP-012 Live Data Integrity active: diagnostics reports real subsystem state and does not present waiting capabilities as live observations.
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
          <Metric label="Total" value={snapshot?.counts?.total || 0} />
          <Metric label="Ready" value={(snapshot?.counts?.ready || 0) + (snapshot?.counts?.online || 0)} />
          <Metric label="Waiting" value={snapshot?.counts?.waiting || 0} />
        </div>

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
