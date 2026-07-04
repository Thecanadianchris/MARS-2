/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Component:
 * BehaviourCapabilityCard
 *
 * Purpose:
 * Displays behaviour capability readiness.
 *
 * Version:
 * v0.13.6
 * Date Code:
 * 040726
 * ==========================================================
 */

import React from 'react'
import { CheckCircle2, Clock3, Radio } from 'lucide-react'

const STATUS_STYLES = {
  ready: 'border-emerald-400/30 bg-emerald-500/10 text-emerald-300',
  planned: 'border-yellow-400/30 bg-yellow-500/10 text-yellow-300',
  waiting: 'border-white/15 bg-white/[0.03] text-white/50'
}

const STATUS_ICONS = {
  ready: CheckCircle2,
  planned: Clock3,
  waiting: Radio
}

export default function BehaviourCapabilityCard({ capability }) {
  const status = capability?.status || 'waiting'
  const Icon = STATUS_ICONS[status] || Radio
  const style = STATUS_STYLES[status] || STATUS_STYLES.waiting

  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-black text-white">
            {capability?.title || 'Behaviour capability'}
          </p>
          <p className="mt-1 text-[10px] leading-relaxed text-white/50">
            {capability?.description || 'Capability status unavailable.'}
          </p>
        </div>

        <span className={`shrink-0 inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[9px] font-mono uppercase tracking-[0.12em] ${style}`}>
          <Icon size={10} />
          {status}
        </span>
      </div>
    </div>
  )
}
