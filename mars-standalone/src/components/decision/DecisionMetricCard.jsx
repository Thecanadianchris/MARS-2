/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Component:
 * DecisionMetricCard
 *
 * Purpose:
 * Compact UI card for the v0.13.7 M2.4 Decision
 * Intelligence panel.
 *
 * Version:
 * v0.13.7
 * Date Code:
 * 040726
 * ==========================================================
 */

import React from 'react'

const STATUS_CLASSES = Object.freeze({
  ready: 'border-emerald-400/35 bg-emerald-500/10 text-emerald-200',
  watch: 'border-cyan-400/35 bg-cyan-500/10 text-cyan-200',
  review: 'border-amber-400/35 bg-amber-500/10 text-amber-200',
  attention: 'border-rose-400/35 bg-rose-500/10 text-rose-200',
  blocked: 'border-white/15 bg-white/[0.04] text-white/60'
})

export default function DecisionMetricCard({ label, value, detail, status = 'ready' }) {
  const statusClass = STATUS_CLASSES[status] || STATUS_CLASSES.ready

  return (
    <article className={`rounded-xl border p-3 ${statusClass}`}>
      <p className="text-[10px] font-mono uppercase tracking-[0.14em] opacity-70">
        {label}
      </p>
      <p className="mt-2 font-heading text-xl font-black tracking-tight text-white">
        {value}
      </p>
      <p className="mt-2 text-[11px] leading-relaxed text-white/60">
        {detail}
      </p>
    </article>
  )
}
