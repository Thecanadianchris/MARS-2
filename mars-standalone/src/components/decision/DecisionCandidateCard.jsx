/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Component:
 * DecisionCandidateCard
 *
 * Purpose:
 * Displays one neutral decision candidate produced by the
 * MARS Decision Intelligence Layer.
 *
 * Version:
 * v0.13.7
 * Date Code:
 * 040726
 * ==========================================================
 */

import React from 'react'

function getPriorityClass(priority) {
  if (priority === 'critical') return 'border-rose-400/40 bg-rose-500/10 text-rose-300'
  if (priority === 'high') return 'border-amber-400/40 bg-amber-500/10 text-amber-300'
  if (priority === 'medium') return 'border-cyan-400/40 bg-cyan-500/10 text-cyan-300'
  return 'border-emerald-400/40 bg-emerald-500/10 text-emerald-300'
}

export default function DecisionCandidateCard({ decision }) {
  const priorityClass = getPriorityClass(decision.priority)

  return (
    <article className="rounded-xl border border-white/10 bg-black/20 p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h4 className="font-heading text-sm font-bold text-white">
            {decision.id}
          </h4>
          <p className="mt-1 text-[10px] font-mono uppercase tracking-[0.12em] text-white/35">
            {decision.category}
          </p>
        </div>

        <span className={`rounded-full border px-2 py-1 text-[9px] font-mono uppercase tracking-[0.12em] ${priorityClass}`}>
          {decision.priority}
        </span>
      </div>

      <p className="mt-3 text-xs leading-relaxed text-white/65">
        {decision.description}
      </p>

      <div className="mt-3 flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2">
        <span className="text-[10px] font-mono uppercase tracking-[0.12em] text-white/35">
          Confidence
        </span>
        <span className="text-xs font-bold text-white">
          {Math.round(decision.confidence || 0)}%
        </span>
      </div>
    </article>
  )
}
