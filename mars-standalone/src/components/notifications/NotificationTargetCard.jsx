/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Component:
 * NotificationTargetCard
 *
 * Purpose:
 * Displays one notification destination.
 *
 * Version:
 * v0.13.9
 * Date Code:
 * 040726
 * ==========================================================
 */

import React from 'react'
import { Bell, Clock3, Radio } from 'lucide-react'

const STATUS_STYLES = Object.freeze({
  active: 'border-emerald-400/35 bg-emerald-500/10 text-emerald-300',
  local_only: 'border-cyan-400/35 bg-cyan-500/10 text-cyan-300',
  planned: 'border-amber-400/35 bg-amber-500/10 text-amber-300',
  optional: 'border-white/15 bg-white/[0.03] text-white/55'
})

const STATUS_ICONS = Object.freeze({
  active: Bell,
  local_only: Radio,
  planned: Clock3,
  optional: Clock3
})

export default function NotificationTargetCard({ target, active = false }) {
  const status = target?.status || 'optional'
  const style = active
    ? 'border-sky-400/40 bg-sky-500/10 text-sky-200'
    : STATUS_STYLES[status] || STATUS_STYLES.optional
  const Icon = STATUS_ICONS[status] || Clock3

  return (
    <article className="rounded-xl border border-white/10 bg-black/20 p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h4 className="font-heading text-sm font-bold text-white">
            {target?.label || 'Notification Target'}
          </h4>
          <p className="mt-1 text-[11px] leading-relaxed text-white/55">
            {target?.description || 'Target description unavailable.'}
          </p>
        </div>

        <span className={`shrink-0 inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[9px] font-mono uppercase tracking-[0.12em] ${style}`}>
          <Icon size={10} />
          {active ? 'selected' : status.replace('_', ' ')}
        </span>
      </div>
    </article>
  )
}
