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
 * v0.13.5
 *
 * Date Code:
 * 040726
 * ==========================================================
 */

import { ShieldCheck, UserRound } from 'lucide-react'

export default function IdentityStatusCard({ identityResult }) {
  const result = identityResult || {}
  const profile = result.profile || {}

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

        <StatePill state={result.state} />
      </div>

      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-xs uppercase tracking-widest text-slate-500">Current profile</div>
            <div className="mt-1 text-xl font-bold text-white">
              {profile.displayName || 'Unknown'}
            </div>
            <div className="mt-1 text-xs text-slate-400">
              {formatUserType(profile.userType || result.userType || 'unknown')}
            </div>
          </div>

          {result.protected && (
            <div className="flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 text-xs text-emerald-300">
              <ShieldCheck size={12} />
              Protected
            </div>
          )}
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
          <Metric label="Known" value={result.known ? 'Yes' : 'No'} />
          <Metric label="Trusted" value={result.trusted ? 'Yes' : 'No'} />
          <Metric label="Confidence" value={`${Math.round(result.confidence || 0)}%`} />
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-xs leading-relaxed text-slate-300">
        {result.summary || 'Identity result unavailable.'}
      </div>
    </div>
  )
}

function StatePill({ state }) {
  const safeState = state || 'unknown'
  const colour = getStateColour(safeState)

  return (
    <span className={`rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-widest ${colour}`}>
      {safeState.replaceAll('_', ' ')}
    </span>
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

function getStateColour(state) {
  if (state === 'protected') return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
  if (state === 'trusted' || state === 'known') return 'border-cyan-500/30 bg-cyan-500/10 text-cyan-300'
  if (state === 'unknown' || state === 'pending_profile') return 'border-amber-500/30 bg-amber-500/10 text-amber-300'
  if (state === 'blocked') return 'border-red-500/30 bg-red-500/10 text-red-300'

  return 'border-slate-500/30 bg-slate-500/10 text-slate-300'
}

function formatUserType(userType) {
  return String(userType || 'unknown').replaceAll('_', ' ')
}
