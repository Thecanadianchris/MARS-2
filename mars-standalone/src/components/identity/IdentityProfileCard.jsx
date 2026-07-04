/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Component:
 * IdentityProfileCard
 *
 * Purpose:
 * Displays a safe local identity profile summary.
 *
 * Version:
 * v0.13.5
 *
 * Date Code:
 * 040726
 * ==========================================================
 */

import { Shield, UserCheck, UserRound } from 'lucide-react'

export default function IdentityProfileCard({ profile, active = false }) {
  const safeProfile = profile || {}

  return (
    <div className={`rounded-2xl border p-3 text-sm ${
      active
        ? 'border-cyan-500/30 bg-cyan-500/10 text-cyan-100'
        : 'border-white/10 bg-white/[0.03] text-slate-200'
    }`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04]">
            <UserRound size={16} className={active ? 'text-cyan-300' : 'text-slate-400'} />
          </div>

          <div>
            <div className="font-semibold text-white">{safeProfile.displayName || 'Unknown'}</div>
            <div className="mt-0.5 text-xs uppercase tracking-widest text-slate-500">
              {formatUserType(safeProfile.userType)}
            </div>
          </div>
        </div>

        <div className="flex gap-1">
          {safeProfile.trusted && (
            <Badge icon={<UserCheck size={11} />} label="Trusted" colour="cyan" />
          )}
          {safeProfile.protected && (
            <Badge icon={<Shield size={11} />} label="Protected" colour="emerald" />
          )}
        </div>
      </div>

      {safeProfile.notes && (
        <p className="mt-3 text-xs leading-relaxed text-slate-400">{safeProfile.notes}</p>
      )}
    </div>
  )
}

function Badge({ icon, label, colour }) {
  const className = colour === 'emerald'
    ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300'
    : 'border-cyan-500/20 bg-cyan-500/10 text-cyan-300'

  return (
    <span className={`flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] ${className}`}>
      {icon}
      {label}
    </span>
  )
}

function formatUserType(userType = 'unknown') {
  return String(userType).replaceAll('_', ' ')
}
