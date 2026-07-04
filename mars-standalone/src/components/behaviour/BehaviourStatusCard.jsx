/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Component:
 * BehaviourStatusCard
 *
 * Purpose:
 * Displays one live behaviour observation signal.
 *
 * Version:
 * v0.13.6
 * Date Code:
 * 040726
 * ==========================================================
 */

import React from 'react'

const STATUS_STYLES = {
  ready: 'border-emerald-400/40 bg-emerald-500/10 text-emerald-300',
  watch: 'border-cyan-400/40 bg-cyan-500/10 text-cyan-300',
  review: 'border-amber-400/40 bg-amber-500/10 text-amber-300',
  attention: 'border-rose-400/40 bg-rose-500/10 text-rose-300',
  planned: 'border-yellow-400/40 bg-yellow-500/10 text-yellow-300',
  waiting: 'border-white/15 bg-white/[0.03] text-white/50'
}

function normalise(value) {
  if (value === undefined || value === null || value === '') {
    return 'unknown'
  }

  return String(value).replaceAll('_', ' ')
}

export default function BehaviourStatusCard({ label, value, detail, status = 'ready' }) {
  const style = STATUS_STYLES[status] || STATUS_STYLES.waiting

  return (
    <div className={`rounded-xl border p-3 ${style}`}>
      <p className="text-[10px] font-mono uppercase tracking-[0.12em] opacity-80">
        {label}
      </p>
      <p className="mt-2 text-lg font-black text-white capitalize leading-tight">
        {normalise(value)}
      </p>
      <p className="mt-2 text-[10px] leading-relaxed text-white/55">
        {detail}
      </p>
    </div>
  )
}
