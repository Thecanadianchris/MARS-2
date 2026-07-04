/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Component:
 * DecisionPanel
 *
 * Purpose:
 * UI panel for v0.13.7 M2.4 Decision Intelligence.
 *
 * Decision Intelligence converts observation, identity and
 * behaviour context into priority and recommendation output.
 * It does not send alerts or execute actions.
 *
 * Version:
 * v0.13.7
 * Date Code:
 * 040726
 * ==========================================================
 */

import React from 'react'
import { BrainCircuit, GitBranch, RefreshCcw, ShieldCheck } from 'lucide-react'
import useDecisionIntelligence from '@/hooks/useDecisionIntelligence'
import DecisionCapabilityCard from './DecisionCapabilityCard'
import DecisionCandidateCard from './DecisionCandidateCard'
import DecisionMetricCard from './DecisionMetricCard'
import DecisionPriorityCard from './DecisionPriorityCard'

function getPanelBadge(status) {
  if (status === 'attention') return 'Attention'
  if (status === 'review') return 'Review'
  if (status === 'watch') return 'Watch'
  return 'Ready'
}

function getPanelBadgeClass(status) {
  if (status === 'attention') return 'border-rose-400/40 bg-rose-500/10 text-rose-300'
  if (status === 'review') return 'border-amber-400/40 bg-amber-500/10 text-amber-300'
  if (status === 'watch') return 'border-cyan-400/40 bg-cyan-500/10 text-cyan-300'
  return 'border-emerald-400/40 bg-emerald-500/10 text-emerald-300'
}

export default function DecisionPanel() {
  const decision = useDecisionIntelligence()
  const badgeClass = getPanelBadgeClass(decision.status)

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      <section className="rounded-2xl border border-cyan-400/20 bg-cyan-500/[0.04] p-4 shadow-[0_0_40px_rgba(34,211,238,0.05)]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <BrainCircuit size={17} className="text-cyan-300" />
              <h2 className="font-heading text-lg font-black tracking-[0.08em] text-cyan-300">
                DECISION
              </h2>
              <span className="text-[9px] font-mono text-cyan-500/60">
                {decision.version}
              </span>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-white/60">
              M2.4 Decision Intelligence converts identity and behaviour context into priority and recommended next action.
            </p>
          </div>

          <span className={`rounded-full border px-2 py-1 text-[9px] font-mono uppercase tracking-[0.14em] ${badgeClass}`}>
            {getPanelBadge(decision.status)}
          </span>
        </div>

        <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-3">
          <p className="text-[10px] font-mono uppercase tracking-[0.12em] text-white/40">
            Decision statement
          </p>
          <p className="mt-2 text-xs leading-relaxed text-white/70">
            {decision.diagnosticStatement}
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-[0.16em] text-cyan-300">
              Decision Simulation
            </p>
            <p className="mt-1 text-xs text-white/50">
              UI-safe simulator for decision output before live notification escalation.
            </p>
          </div>

          <button
            type="button"
            onClick={decision.refresh}
            className="inline-flex items-center gap-2 rounded-lg border border-cyan-400/25 bg-cyan-500/10 px-3 py-2 text-[10px] font-mono uppercase tracking-[0.12em] text-cyan-300 hover:bg-cyan-500/15"
          >
            <RefreshCcw size={12} />
            Refresh
          </button>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          {Object.values(decision.scenarios).map((scenarioId) => (
            <button
              key={scenarioId}
              type="button"
              onClick={() => decision.setScenario(scenarioId)}
              className={`rounded-lg border px-3 py-2 text-[10px] font-mono uppercase tracking-[0.12em] transition ${
                decision.scenario === scenarioId
                  ? 'border-cyan-400/50 bg-cyan-500/20 text-cyan-200'
                  : 'border-white/10 bg-black/20 text-white/50 hover:border-cyan-400/30 hover:text-white/80'
              }`}
            >
              {decision.scenarioLabels[scenarioId]}
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <div className="flex items-center gap-2">
          <GitBranch size={15} className="text-cyan-300" />
          <p className="text-[10px] font-mono uppercase tracking-[0.16em] text-cyan-300">
            Current Decision Output
          </p>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          {decision.metrics.map((metric) => (
            <DecisionMetricCard
              key={metric.id}
              label={metric.label}
              value={metric.value}
              detail={metric.detail}
              status={metric.status}
            />
          ))}
        </div>
      </section>

      <DecisionPriorityCard priority={decision.highestPriority} />

      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <p className="text-[10px] font-mono uppercase tracking-[0.16em] text-cyan-300">
          Recommendation Boundary
        </p>
        <div className="mt-3 rounded-xl border border-white/10 bg-black/20 p-4">
          <p className="font-heading text-lg font-black text-white">
            {decision.highestRecommendation?.label || 'No Action Required'}
          </p>
          <p className="mt-2 text-xs leading-relaxed text-white/60">
            {decision.highestRecommendation?.message || 'Decision Intelligence is observing only.'}
          </p>
          <div className="mt-4 grid grid-cols-2 gap-2 text-[10px] font-mono text-white/45">
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-2">
              Target: {decision.highestRecommendation?.executionTarget || 'none'}
            </div>
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-2">
              Auto execute: No
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <p className="text-[10px] font-mono uppercase tracking-[0.16em] text-cyan-300">
          Decision Candidates
        </p>
        <div className="mt-4 space-y-3">
          {decision.decisions.length === 0 ? (
            <div className="rounded-xl border border-white/10 bg-black/20 p-4 text-xs text-white/55">
              No decision candidates are currently active.
            </div>
          ) : (
            decision.decisions.map((candidate) => (
              <DecisionCandidateCard
                key={`${candidate.id}-${candidate.timestamp}`}
                decision={candidate}
              />
            ))
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <p className="text-[10px] font-mono uppercase tracking-[0.16em] text-cyan-300">
          Decision Capability Status
        </p>
        <div className="mt-4 space-y-3">
          {decision.capabilityStatus.map((capability) => (
            <DecisionCapabilityCard
              key={capability.id}
              capability={capability}
            />
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-black/20 p-4">
        <div className="flex items-center gap-2">
          <ShieldCheck size={14} className="text-cyan-300" />
          <p className="text-[10px] font-mono uppercase tracking-[0.16em] text-cyan-300">
            Safety Boundary
          </p>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-white/55">
          Decision Intelligence recommends the next assistive action only. It does not diagnose medical conditions and it does not send alerts. Notification and escalation remain the responsibility of M2.5 Notification & Alerting.
        </p>
      </section>
    </div>
  )
}
