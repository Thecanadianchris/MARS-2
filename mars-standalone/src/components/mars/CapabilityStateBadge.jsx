/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Component:
 * CapabilityStateBadge
 *
 * Purpose:
 * Shared LIVE / WAITING / SIMULATION badge for capability
 * panels.
 *
 * Version:
 * v0.13.7a
 * Date Code:
 * 040726
 * ==========================================================
 */

import React from 'react'
import { CAPABILITY_STATE, normaliseCapabilityState } from '@/services/capabilityState'

const BADGE_STYLES = Object.freeze({
  [CAPABILITY_STATE.LIVE]: 'border-emerald-400/40 bg-emerald-500/10 text-emerald-300',
  [CAPABILITY_STATE.WAITING]: 'border-amber-400/40 bg-amber-500/10 text-amber-300',
  [CAPABILITY_STATE.SIMULATION]: 'border-sky-400/40 bg-sky-500/10 text-sky-300'
})

const BADGE_LABELS = Object.freeze({
  [CAPABILITY_STATE.LIVE]: 'Live',
  [CAPABILITY_STATE.WAITING]: 'Waiting',
  [CAPABILITY_STATE.SIMULATION]: 'Simulation'
})

export default function CapabilityStateBadge({ state, label, className = '' }) {
  const safeState = normaliseCapabilityState(state?.state || state)
  const badgeLabel = label || state?.label || BADGE_LABELS[safeState]

  return (
    <span className={`rounded-full border px-2 py-1 text-[9px] font-mono uppercase tracking-[0.14em] ${BADGE_STYLES[safeState]} ${className}`}>
      {badgeLabel}
    </span>
  )
}
