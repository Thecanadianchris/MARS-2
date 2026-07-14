/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Component:
 * IdentityStatusCard
 *
 * Purpose:
 * Displays the current safe Identity Foundation state.
 *
 * Version:
 * v0.13.7a
 * Date Code:
 * 040726
 * ==========================================================
 */

import { ShieldCheck, UserRound } from 'lucide-react'
import CapabilityStateBadge from '@/components/mars/CapabilityStateBadge'
import { isWaitingCapabilityState } from '@/services/capabilityState'
import { IDENTITY_STATES } from '@/services/identity/IdentityTypes'

const MATCHED_STATES = [
  IDENTITY_STATES.KNOWN,
  IDENTITY_STATES.TRUSTED,
  IDENTITY_STATES.PROTECTED,
]

export default function IdentityStatusCard({ identityResult, capabilityState }) {
  const result = identityResult || {}
  const profile = result.profile || {}
  const waiting = isWaitingCapabilityState(capabilityState)
  const isMatched = MATCHED_STATES.includes(result.state)

  // v0.16.1: say who MARS identified, or say plainly that it hasn't —
  // "Person unknown" for any live face that hasn't matched a profile
  // (SEARCHING/UNKNOWN/TRACKING/etc.), distinct from "No person" when
  // nobody is present at all.
  const displayName = waiting
    ? 'No recognised person'
    : result.state === IDENTITY_STATES.NO_PERSON
      ? 'No person'
      : isMatched
        ? profile.displayName || 'Unknown person'
        : 'Person unknown'
  const userType = waiting ? 'waiting for live identity input' : formatUserType(profile.userType || result.userType || 'unknown')

  return (
    <div className="rounded-2xl border border-cyan-500/20 bg-slate-950/70 p-4 text-sm text-cyan-100 shadow-lg shadow-cyan-500/10">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-cyan-500/20 bg-cyan-500/10">
            <UserRound size={19} className="text-cyan-300" />
          </div>

          <div>
            <h1 className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300">
              Identity
            </h1>
            <p className="mt-1 text-xs leading-relaxed text-slate-400">
              M2.2 Identity Panel: who MARS may be observing, without making decisions or diagnosis.
            </p>
          </div>
        </div>

        <CapabilityStateBadge state={capabilityState} />
      </div>

      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-xs uppercase tracking-widest text-slate-500">Current profile</div>
            <div className="mt-1 text-xl font-bold text-white">
              {displayName}
            </div>
            <div className="mt-1 text-xs text-slate-400">
              {userType}
            </div>
          </div>

          {!waiting && result.protected && (
            <div className="flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 text-xs text-emerald-300">
              <ShieldCheck size={12} />
              Protected
            </div>
          )}
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
          <Metric label="Known" value={!waiting && result.known ? 'Yes' : 'No'} />
          <Metric label="Trusted" value={!waiting && result.trusted ? 'Yes' : 'No'} />
          <Metric label="Confidence" value={`${waiting ? 0 : Math.round(result.confidence || 0)}%`} />
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-xs leading-relaxed text-slate-300">
        {capabilityState?.message || result.summary || 'Identity result unavailable.'}
      </div>
    </div>
  )
}

function Metric({ label, value }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
      <div className="text-sm font-bold text-white">{value}</div>
      <div className="mt-1 uppercase tracking-widest text-slate-500">{label}</div>
    </div>
  )
}

function formatUserType(userType) {
  return String(userType || 'unknown').replaceAll('_', ' ')
}
