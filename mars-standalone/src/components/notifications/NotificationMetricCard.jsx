/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Component:
 * NotificationMetricCard
 *
 * Purpose:
 * Compact metric card for M2.5 Notification & Alerting.
 *
 * Version:
 * v0.13.9
 * Date Code:
 * 040726
 * ==========================================================
 */

import React from 'react'

const STATUS_STYLES = Object.freeze({
  ready: 'border-emerald-400/35 bg-emerald-500/10 text-emerald-200',
  active: 'border-cyan-400/35 bg-cyan-500/10 text-cyan-200',
  waiting: 'border-white/15 bg-white/[0.03] text-white/60'
})

export default function NotificationMetricCard({ metric }) {
  const status = metric?.status || 'waiting'
  const style = STATUS_STYLES[status] || STATUS_STYLES.waiting

  return (
    <article className={`rounded-xl border p-3 ${style}`}>
      <p className="text-[10px] font-mono uppercase tracking-[0.14em] opacity-70">
        {metric?.label || 'Metric'}
      </p>
      <p className="mt-2 font-heading text-xl font-black tracking-tight text-white">
        {metric?.value || '—'}
      </p>
      <p className="mt-2 text-[11px] leading-relaxed text-white/60">
        {metric?.detail || 'Metric unavailable.'}
      </p>
    </article>
  )
}
