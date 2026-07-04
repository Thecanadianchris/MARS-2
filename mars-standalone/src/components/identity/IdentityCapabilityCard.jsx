/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Component:
 * IdentityCapabilityCard
 *
 * Purpose:
 * Shows implemented and planned Identity capability status.
 *
 * Version:
 * v0.13.5
 *
 * Date Code:
 * 040726
 * ==========================================================
 */

import { CheckCircle2, Clock3 } from 'lucide-react'

export default function IdentityCapabilityCard({ capability }) {
  const item = capability || {}
  const ready = Boolean(item.ready)

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-sm">
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 flex h-7 w-7 items-center justify-center rounded-xl border ${
          ready
            ? 'border-cyan-500/20 bg-cyan-500/10 text-cyan-300'
            : 'border-amber-500/20 bg-amber-500/10 text-amber-300'
        }`}>
          {ready ? <CheckCircle2 size={15} /> : <Clock3 size={15} />}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-semibold text-white">{item.label}</h3>
            <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] uppercase tracking-widest ${
              ready
                ? 'bg-cyan-500/10 text-cyan-300'
                : 'bg-amber-500/10 text-amber-300'
            }`}>
              {ready ? 'Ready' : item.planned ? 'Planned' : 'Waiting'}
            </span>
          </div>

          <p className="mt-1 text-xs leading-relaxed text-slate-400">{item.summary}</p>
        </div>
      </div>
    </div>
  )
}
