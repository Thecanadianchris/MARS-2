/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Component:
 * NotificationPriorityBadge
 *
 * Purpose:
 * Displays MARS notification priority labels.
 *
 * Version:
 * v0.13.9
 * Date Code:
 * 040726
 * ==========================================================
 */

import React from 'react'
import { normaliseNotificationPriority } from '@/services/notifications'

const PRIORITY_STYLES = Object.freeze({
  information: 'border-emerald-400/40 bg-emerald-500/10 text-emerald-300',
  observation: 'border-cyan-400/40 bg-cyan-500/10 text-cyan-300',
  attention: 'border-amber-400/40 bg-amber-500/10 text-amber-300',
  assist: 'border-orange-400/40 bg-orange-500/10 text-orange-300',
  critical: 'border-rose-400/40 bg-rose-500/10 text-rose-300'
})

export default function NotificationPriorityBadge({ priority = 'information', label }) {
  const safePriority = normaliseNotificationPriority(priority)
  const style = PRIORITY_STYLES[safePriority] || PRIORITY_STYLES.information

  return (
    <span className={`rounded-full border px-2 py-1 text-[9px] font-mono uppercase tracking-[0.12em] ${style}`}>
      {label || safePriority}
    </span>
  )
}
