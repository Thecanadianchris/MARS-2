/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Component:
 * NotificationHistoryCard
 *
 * Purpose:
 * Displays one queued notification history item.
 *
 * Version:
 * v0.13.9
 * Date Code:
 * 040726
 * ==========================================================
 */

import React from 'react'
import NotificationPriorityBadge from './NotificationPriorityBadge'

export default function NotificationHistoryCard({ item }) {
  return (
    <article className="rounded-xl border border-white/10 bg-black/20 p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h4 className="font-heading text-sm font-bold text-white">
            {item?.title || 'MARS notification'}
          </h4>
          <p className="mt-1 text-[10px] font-mono uppercase tracking-[0.12em] text-white/35">
            {item?.status || 'queued'} · {item?.id || 'pending'}
          </p>
        </div>

        <NotificationPriorityBadge priority={item?.priority} label={item?.priorityLabel} />
      </div>

      <p className="mt-3 text-xs leading-relaxed text-white/60">
        {item?.message || 'No notification message available.'}
      </p>
    </article>
  )
}
