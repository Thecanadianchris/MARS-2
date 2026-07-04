/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Component:
 * BehaviourPanel
 *
 * Purpose:
 * UI panel for v0.13.6 M2.3 Behaviour Intelligence.
 *
 * Behaviour describes observed activity patterns only.
 * Decision and Notification layers interpret those observations
 * later in the MARS pipeline.
 *
 * Version:
 * v0.13.6
 * Date Code:
 * 040726
 * ==========================================================
 */

import React from 'react'
import { Activity, Brain, RefreshCcw } from 'lucide-react'
import useBehaviourIntelligence from '@/hooks/useBehaviourIntelligence'
import BehaviourCapabilityCard from './BehaviourCapabilityCard'
import BehaviourProfileCard from './BehaviourProfileCard'
import BehaviourStatusCard from './BehaviourStatusCard'

function getPanelBadge(status) {
  if (status === 'attention') {
    return 'Attention'
  }

  if (status === 'review') {
    return 'Review'
  }

  if (status === 'watch') {
    return 'Watch'
  }

  return 'Ready'
}

function getPanelBadgeClass(status) {
  if (status === 'attention') {
    return 'border-rose-400/40 bg-rose-500/10 text-rose-300'
  }

  if (status === 'review') {
    return 'border-amber-400/40 bg-amber-500/10 text-amber-300'
  }

  if (status === 'watch') {
    return 'border-cyan-400/40 bg-cyan-500/10 text-cyan-300'
  }

  return 'border-emerald-400/40 bg-emerald-500/10 text-emerald-300'
}

export default function BehaviourPanel() {
  const behaviour = useBehaviourIntelligence()
  const badgeClass = getPanelBadgeClass(behaviour.status)

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      <section className="rounded-2xl border border-cyan-400/20 bg-cyan-500/[0.04] p-4 shadow-[0_0_40px_rgba(34,211,238,0.05)]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Activity size={17} className="text-cyan-300" />
              <h2 className="font-heading text-lg font-black tracking-[0.08em] text-cyan-300">
                BEHAVIOUR
              </h2>
              <span className="text-[9px] font-mono text-cyan-400/60">
                {behaviour.version}
              </span>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-white/60">
              M2.3 Behaviour Intelligence describes body position, head direction, movement and inactivity signs.
            </p>
          </div>

          <span className={`rounded-full border px-2 py-1 text-[9px] font-mono uppercase tracking-[0.14em] ${badgeClass}`}>
            {getPanelBadge(behaviour.status)}
          </span>
        </div>

        <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-3">
          <p className="text-[10px] font-mono uppercase tracking-[0.12em] text-white/40">
            Behaviour statement
          </p>
          <p className="mt-2 text-xs leading-relaxed text-white/70">
            {behaviour.diagnosticStatement}
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-[0.16em] text-cyan-300">
              Behaviour Simulation
            </p>
            <p className="mt-1 text-xs text-white/50">
              UI-safe simulator for behaviour foundation without live decision escalation.
            </p>
          </div>

          <button
            type="button"
            onClick={behaviour.refresh}
            className="inline-flex items-center gap-2 rounded-lg border border-cyan-400/25 bg-cyan-500/10 px-3 py-2 text-[10px] font-mono uppercase tracking-[0.12em] text-cyan-300 hover:bg-cyan-500/15"
          >
            <RefreshCcw size={12} />
            Refresh
          </button>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          {Object.values(behaviour.scenarios).map((scenarioId) => (
            <button
              key={scenarioId}
              type="button"
              onClick={() => behaviour.setScenario(scenarioId)}
              className={`rounded-lg border px-3 py-2 text-[10px] font-mono uppercase tracking-[0.12em] transition ${
                behaviour.scenario === scenarioId
                  ? 'border-cyan-400/50 bg-cyan-500/20 text-cyan-200'
                  : 'border-white/10 bg-black/20 text-white/50 hover:border-cyan-400/30 hover:text-white/80'
              }`}
            >
              {behaviour.scenarioLabels[scenarioId]}
            </button>
          ))}
        </div>
      </section>

      <BehaviourProfileCard
        profile={behaviour.profile}
        protectedPolicy={behaviour.protectedPolicy}
      />

      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <div className="flex items-center gap-2">
          <Brain size={15} className="text-cyan-300" />
          <p className="text-[10px] font-mono uppercase tracking-[0.16em] text-cyan-300">
            Current Behaviour Observation
          </p>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          {behaviour.timeline.map((item) => (
            <BehaviourStatusCard
              key={item.id}
              label={item.label}
              value={item.value}
              detail={item.detail}
              status={item.id === 'concern-level' ? behaviour.status : 'ready'}
            />
          ))}
        </div>

        <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-3">
          <p className="text-[10px] font-mono uppercase tracking-[0.12em] text-white/40">
            Decision hint
          </p>
          <p className="mt-2 text-xs leading-relaxed text-white/70">
            Action: <span className="font-bold text-white capitalize">{behaviour.decisionHint?.recommendedAction || 'observe'}</span>
            {' · '}
            Concern: <span className="font-bold text-white capitalize">{behaviour.risk?.concernLevel || 'none'}</span>
            {' · '}
            Notify authorised user: <span className="font-bold text-white">{behaviour.decisionHint?.notifyAuthorisedUser ? 'Yes' : 'No'}</span>
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <p className="text-[10px] font-mono uppercase tracking-[0.16em] text-cyan-300">
          Behaviour Capability Status
        </p>
        <div className="mt-4 space-y-3">
          {behaviour.capabilityStatus.map((capability) => (
            <BehaviourCapabilityCard
              key={capability.id}
              capability={capability}
            />
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-black/20 p-4">
        <p className="text-[10px] font-mono uppercase tracking-[0.16em] text-cyan-300">
          Safety Boundary
        </p>
        <p className="mt-2 text-xs leading-relaxed text-white/55">
          Behaviour Intelligence records neutral observation patterns for assistive alerting. It does not diagnose seizures, dementia, illness or any medical condition.
        </p>
      </section>
    </div>
  )
}
