/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Component:
 * NotificationPanel
 *
 * Purpose:
 * UI panel for v0.13.9 M2.5 Notification & Alerting.
 *
 * Notification consumes Decision Intelligence output. It does
 * not decide, diagnose or directly deliver external alerts in
 * this milestone.
 *
 * Version:
 * v0.13.9
 * Date Code:
 * 040726
 * ==========================================================
 */

import React from 'react'
import { BellRing, RadioTower, RefreshCcw, ShieldCheck } from 'lucide-react'
import useNotificationEngine from '@/hooks/useNotificationEngine'
import CapabilityStateBadge from '@/components/mars/CapabilityStateBadge'
import NotificationHistoryCard from './NotificationHistoryCard'
import NotificationMetricCard from './NotificationMetricCard'
import NotificationPriorityBadge from './NotificationPriorityBadge'
import NotificationProfileCard from './NotificationProfileCard'
import NotificationTargetCard from './NotificationTargetCard'

function getPanelBadgeClass(state) {
  if (state === 'waiting') return 'border-amber-400/40 bg-amber-500/10 text-amber-300'
  return 'border-sky-400/40 bg-sky-500/10 text-sky-300'
}

export default function NotificationPanel() {
  const notification = useNotificationEngine()
  const activeTargets = new Set(notification.notification?.targets || [])
  const badgeClass = getPanelBadgeClass(notification.capabilityState?.state)

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      <section className="rounded-2xl border border-cyan-400/20 bg-cyan-500/[0.04] p-4 shadow-[0_0_40px_rgba(34,211,238,0.05)]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <BellRing size={17} className="text-cyan-300" />
              <h2 className="font-heading text-lg font-black tracking-[0.08em] text-cyan-300">
                NOTIFICATION
              </h2>
              <span className="text-[9px] font-mono text-cyan-500/60">
                {notification.version}
              </span>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-white/60">
              M2.5 Notification & Alerting routes Decision Intelligence output to approved notification destinations.
            </p>
          </div>

          <span className={`rounded-full border px-2 py-1 text-[9px] font-mono uppercase tracking-[0.14em] ${badgeClass}`}>
            {notification.capabilityState?.label || 'Waiting'}
          </span>
        </div>

        <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-3">
          <p className="text-[10px] font-mono uppercase tracking-[0.12em] text-white/40">
            Notification statement
          </p>
          <p className="mt-2 text-xs leading-relaxed text-white/70">
            {notification.diagnosticStatement}
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-[0.16em] text-cyan-300">
              Data State
            </p>
            <p className="mt-1 text-xs text-white/50">
              Notification cannot invent alerts. It waits for Decision Intelligence or clearly labels simulation.
            </p>
          </div>
          <CapabilityStateBadge state={notification.capabilityState} />
        </div>

        <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-3">
          <p className="text-xs leading-relaxed text-white/60">
            {notification.capabilityState?.message || 'Waiting for notification data.'}
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-[0.16em] text-cyan-300">
              Notification Simulation
            </p>
            <p className="mt-1 text-xs text-white/50">
              Developer-only scenarios. Simulation does not contact real users.
            </p>
          </div>

          <button
            type="button"
            onClick={notification.refresh}
            className="inline-flex items-center gap-2 rounded-lg border border-cyan-400/25 bg-cyan-500/10 px-3 py-2 text-[10px] font-mono uppercase tracking-[0.12em] text-cyan-300 hover:bg-cyan-500/15"
          >
            <RefreshCcw size={12} />
            Refresh
          </button>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          {Object.values(notification.scenarios).map((scenarioId) => (
            <button
              key={scenarioId}
              type="button"
              onClick={() => notification.setScenario(scenarioId)}
              className={`rounded-lg border px-3 py-2 text-[10px] font-mono uppercase tracking-[0.12em] transition ${
                notification.scenario === scenarioId
                  ? scenarioId === notification.scenarios.WAITING
                    ? 'border-amber-400/50 bg-amber-500/20 text-amber-200'
                    : 'border-sky-400/50 bg-sky-500/20 text-sky-200'
                  : 'border-white/10 bg-black/20 text-white/50 hover:border-cyan-400/30 hover:text-white/80'
              }`}
            >
              {notification.scenarioLabels[scenarioId]}
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <div className="flex items-center gap-2">
          <RadioTower size={15} className="text-cyan-300" />
          <p className="text-[10px] font-mono uppercase tracking-[0.16em] text-cyan-300">
            Current Notification Output
          </p>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          {notification.metrics.map((metric) => (
            <NotificationMetricCard key={metric.id} metric={metric} />
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <p className="text-[10px] font-mono uppercase tracking-[0.16em] text-cyan-300">
          Active Notification
        </p>

        <div className="mt-3 rounded-xl border border-white/10 bg-black/20 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-heading text-lg font-black text-white">
                {notification.notification?.title || 'No Live Notification Available'}
              </p>
              <p className="mt-2 text-xs leading-relaxed text-white/60">
                {notification.notification?.message || 'Notification & Alerting is waiting for Decision Intelligence output.'}
              </p>
            </div>
            {notification.notification && (
              <NotificationPriorityBadge
                priority={notification.notification.priority}
                label={notification.notification.priorityLabel}
              />
            )}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <p className="text-[10px] font-mono uppercase tracking-[0.16em] text-cyan-300">
          Notification Profiles
        </p>
        <div className="mt-4 space-y-3">
          {notification.profiles.map((profile) => (
            <NotificationProfileCard
              key={profile.id}
              profile={profile}
              selected={notification.profileId === profile.id}
              onSelect={notification.setProfileId}
            />
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <p className="text-[10px] font-mono uppercase tracking-[0.16em] text-cyan-300">
          Notification Targets
        </p>
        <div className="mt-4 space-y-3">
          {notification.targets.map((target) => (
            <NotificationTargetCard
              key={target.id}
              target={target}
              active={activeTargets.has(target.id)}
            />
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <p className="text-[10px] font-mono uppercase tracking-[0.16em] text-cyan-300">
          Notification History
        </p>
        <div className="mt-4 space-y-3">
          {notification.history.length === 0 && (
            <div className="rounded-xl border border-white/10 bg-black/20 p-3 text-xs text-white/55">
              No notification history for this session.
            </div>
          )}
          {notification.history.map((item) => (
            <NotificationHistoryCard key={item.id} item={item} />
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-black/20 p-4">
        <div className="flex items-center gap-2">
          <ShieldCheck size={15} className="text-cyan-300" />
          <p className="text-[10px] font-mono uppercase tracking-[0.16em] text-cyan-300">
            Safety Boundary
          </p>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-white/55">
          {notification.safetyBoundary}
        </p>
      </section>
    </div>
  )
}
