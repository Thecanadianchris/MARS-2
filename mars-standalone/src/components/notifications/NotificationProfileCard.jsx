/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Component:
 * NotificationProfileCard
 *
 * Purpose:
 * Displays a user notification profile.
 *
 * Version:
 * v0.13.9
 * Date Code:
 * 040726
 * ==========================================================
 */

import React from 'react'
import NotificationPriorityBadge from './NotificationPriorityBadge'

export default function NotificationProfileCard({ profile, selected = false, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect?.(profile?.id)}
      className={`w-full rounded-xl border p-3 text-left transition ${
        selected
          ? 'border-sky-400/45 bg-sky-500/10'
          : 'border-white/10 bg-black/20 hover:border-cyan-400/25'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h4 className="font-heading text-sm font-bold text-white">
            {profile?.label || 'Notification Profile'}
          </h4>
          <p className="mt-1 text-[11px] leading-relaxed text-white/55">
            {profile?.description || 'Profile description unavailable.'}
          </p>
        </div>

        <NotificationPriorityBadge priority={profile?.minimumPriority} />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-[10px] font-mono text-white/45">
        <div className="rounded-lg border border-white/10 bg-white/[0.03] p-2">
          Type: {profile?.type || 'unknown'}
        </div>
        <div className="rounded-lg border border-white/10 bg-white/[0.03] p-2">
          Escalation: {profile?.escalation || 'none'}
        </div>
      </div>
    </button>
  )
}
