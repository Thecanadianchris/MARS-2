/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Component:
 * BehaviourProfileCard
 *
 * Purpose:
 * Shows the behaviour profile currently being evaluated.
 * Supports EP-012 waiting/simulation state and v0.13.8
 * user-extensible behaviour profiles.
 *
 * Version:
 * v0.13.8
 * Date Code:
 * 040726
 * ==========================================================
 */

import React from 'react'
import { BookOpen, Shield, UserRound } from 'lucide-react'

export default function BehaviourProfileCard({
  profile,
  protectedPolicy,
  capabilityState,
  matchedBehaviourProfile,
  behaviourProfiles = []
}) {
  const waiting = Boolean(capabilityState?.isWaiting)
  const displayName = waiting ? 'Waiting for behaviour profile' : profile?.displayName || 'Unknown person'
  const protectedUser = !waiting && Boolean(profile?.protectedUser)
  const priority = waiting ? 'waiting' : protectedPolicy?.priority || 'normal'
  const matchedProfile = matchedBehaviourProfile?.matched ? matchedBehaviourProfile.profile : null

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
            {waiting
              ? 'No live identity or observation context is available yet.'
              : 'Local behaviour profile used for current observation context.'}
          </p>
        </div>

        <div className={`flex items-center gap-1 rounded-full border px-2 py-1 text-[9px] font-mono uppercase tracking-[0.12em] ${
          waiting
            ? 'border-amber-400/40 bg-amber-500/10 text-amber-300'
            : protectedUser
              ? 'border-amber-400/40 bg-amber-500/10 text-amber-300'
              : 'border-cyan-400/30 bg-cyan-500/10 text-cyan-300'
        }`}>
          {waiting ? <BookOpen size={11} /> : protectedUser ? <Shield size={11} /> : <UserRound size={11} />}
          {waiting ? 'Waiting' : protectedUser ? 'Protected' : 'Standard'}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <div className="rounded-xl border border-white/10 bg-black/20 p-3">
          <p className="text-[9px] font-mono uppercase text-white/40">Priority</p>
          <p className="mt-1 text-sm font-black text-white capitalize">{priority}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/20 p-3">
          <p className="text-[9px] font-mono uppercase text-white/40">History</p>
          <p className="mt-1 text-sm font-black text-white">{waiting ? 0 : profile?.observationHistory?.length || 0}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/20 p-3">
          <p className="text-[9px] font-mono uppercase text-white/40">Mode</p>
          <p className="mt-1 text-sm font-black text-white">{waiting ? 'Waiting' : capabilityState?.label || 'Local'}</p>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-3">
        <p className="text-[10px] font-mono uppercase tracking-[0.12em] text-white/40">
          Matched Behaviour Label
        </p>
        <p className="mt-2 text-sm font-black text-white">
          {matchedProfile?.label || 'No behaviour profile matched'}
        </p>
        <p className="mt-1 text-xs leading-relaxed text-white/55">
          {matchedProfile?.description || 'Users will be able to add labels such as laying in bed, lying on sofa, pacing or individually learned warning signs.'}
        </p>
      </div>

      <div className="mt-4 rounded-xl border border-cyan-400/15 bg-cyan-500/[0.04] p-3">
        <p className="text-[10px] font-mono uppercase tracking-[0.12em] text-cyan-300">
          Behaviour Library
        </p>
        <p className="mt-1 text-xs text-white/55">
          {behaviourProfiles.length} local behaviour profile(s) available for future user editing and learning.
        </p>
      </div>
    </section>
  )
}
