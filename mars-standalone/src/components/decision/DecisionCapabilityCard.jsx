/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Component:
 * DecisionCapabilityCard
 *
 * Purpose:
 * Displays decision capability readiness for v0.13.7 M2.4.
 *
 * Version:
 * v0.13.7
 * Date Code:
 * 040726
 * ==========================================================
 */

import React from 'react'
import { CheckCircle2, Clock3 } from 'lucide-react'

function getStatusClass(status) {
  if (status === 'ready') return 'border-emerald-400/35 bg-emerald-500/10 text-emerald-300'
  if (status === 'active') return 'border-cyan-400/35 bg-cyan-500/10 text-cyan-300'
  return 'border-amber-400/35 bg-amber-500/10 text-amber-300'
}

export default function DecisionCapabilityCard({ capability }) {
  const statusClass = getStatusClass(capability.status)
  const Icon = capability.status === 'planned' ? Clock3 : CheckCircle2

  return (
    <article className="rounded-xl border border-white/10 bg-black/20 p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex gap-3">
          <div className={`mt-0.5 flex h-7 w-7 items-center justify-center rounded-lg border ${statusClass}`}>
            <Icon size={14} />
          </div>
          <div>
            <h4 className="font-heading text-sm font-bold text-white">
              {capability.title}
            </h4>
            <p className="mt-1 text-[11px] leading-relaxed text-white/55">
              {capability.description}
            </p>
          </div>
        </div>

        <span className={`rounded-full border px-2 py-1 text-[9px] font-mono uppercase tracking-[0.12em] ${statusClass}`}>
          {capability.status}
        </span>
      </div>
    </article>
  )
}
