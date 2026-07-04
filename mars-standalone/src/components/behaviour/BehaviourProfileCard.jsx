/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Component:
 * BehaviourProfileCard
 *
 * Purpose:
 * Shows the behaviour profile currently being evaluated.
 *
 * Version:
 * v0.13.6
 * Date Code:
 * 040726
 * ==========================================================
 */

import React from 'react'
import { Shield, UserRound } from 'lucide-react'

export default function BehaviourProfileCard({ profile, protectedPolicy }) {
  const displayName = profile?.displayName || 'Unknown person'
  const protectedUser = Boolean(profile?.protectedUser)
  const priority = protectedPolicy?.priority || 'normal'

  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-[0.16em] text-cyan-300">
            Behaviour Profile
          </p>
          <h3 className="mt-2 text-xl font-black text-white">
            {displayName}
          </h3>
          <p className="mt-1 text-xs text-white/55">
            Local behaviour profile used for current observation context.
          </p>
        </div>

        <div className={`flex items-center gap-1 rounded-full border px-2 py-1 text-[9px] font-mono uppercase tracking-[0.12em] ${
          protectedUser
            ? 'border-amber-400/40 bg-amber-500/10 text-amber-300'
            : 'border-cyan-400/30 bg-cyan-500/10 text-cyan-300'
        }`}>
          {protectedUser ? <Shield size={11} /> : <UserRound size={11} />}
          {protectedUser ? 'Protected' : 'Standard'}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <div className="rounded-xl border border-white/10 bg-black/20 p-3">
          <p className="text-[9px] font-mono uppercase text-white/40">Priority</p>
          <p className="mt-1 text-sm font-black text-white capitalize">{priority}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/20 p-3">
          <p className="text-[9px] font-mono uppercase text-white/40">History</p>
          <p className="mt-1 text-sm font-black text-white">{profile?.observationHistory?.length || 0}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/20 p-3">
          <p className="text-[9px] font-mono uppercase text-white/40">Mode</p>
          <p className="mt-1 text-sm font-black text-white">Local</p>
        </div>
      </div>
    </section>
  )
}
