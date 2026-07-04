/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Component:
 * DecisionPriorityCard
 *
 * Purpose:
 * Displays the highest ranked priority item for the MARS
 * Decision Intelligence panel.
 *
 * Version:
 * v0.13.7
 * Date Code:
 * 040726
 * ==========================================================
 */

import React from 'react'

function getScoreClass(score) {
  if (score >= 90) return 'text-rose-300'
  if (score >= 70) return 'text-amber-300'
  if (score >= 45) return 'text-cyan-300'
  return 'text-emerald-300'
}

export default function DecisionPriorityCard({ priority }) {
  if (!priority) {
    return (
      <article className="rounded-xl border border-white/10 bg-black/20 p-4">
        <p className="text-[10px] font-mono uppercase tracking-[0.16em] text-white/40">
          Highest Priority
        </p>
        <p className="mt-3 font-heading text-xl font-black text-white">
          None
        </p>
        <p className="mt-2 text-xs leading-relaxed text-white/55">
          No ranked priority item is currently active.
        </p>
      </article>
    )
  }

  const scoreClass = getScoreClass(priority.score)

  return (
    <article className="rounded-xl border border-white/10 bg-black/20 p-4">
      <p className="text-[10px] font-mono uppercase tracking-[0.16em] text-white/40">
        Highest Priority
      </p>

      <div className="mt-3 flex items-end justify-between gap-3">
        <div>
          <h4 className="font-heading text-lg font-black text-white">
            {priority.label}
          </h4>
          <p className="mt-1 text-xs leading-relaxed text-white/55">
            {priority.description}
          </p>
        </div>

        <span className={`font-heading text-3xl font-black ${scoreClass}`}>
          {priority.score}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 text-[10px] font-mono text-white/45">
        <div className="rounded-lg border border-white/10 bg-white/[0.03] p-2">
          Base {priority.factors?.baseScore ?? 0}
        </div>
        <div className="rounded-lg border border-white/10 bg-white/[0.03] p-2">
          Risk {priority.factors?.riskScore ?? 0}
        </div>
        <div className="rounded-lg border border-white/10 bg-white/[0.03] p-2">
          Identity {priority.factors?.personalScore ?? 0}
        </div>
        <div className="rounded-lg border border-white/10 bg-white/[0.03] p-2">
          Confidence {priority.factors?.confidenceScore ?? 0}
        </div>
      </div>
    </article>
  )
}
