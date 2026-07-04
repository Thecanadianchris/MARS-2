/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Component:
 * IdentityPanel
 *
 * Purpose:
 * Main UI panel for the MARS v0.13.5 M2.2 Identity Panel.
 *
 * Version:
 * v0.13.5
 *
 * Date Code:
 * 040726
 * ==========================================================
 */

import { RefreshCw, UserRoundSearch } from 'lucide-react'
import useIdentityFoundation from '@/hooks/useIdentityFoundation'
import IdentityCapabilityCard from './IdentityCapabilityCard'
import IdentityProfileCard from './IdentityProfileCard'
import IdentityStatusCard from './IdentityStatusCard'

export default function IdentityPanel() {
  const {
    scenario,
    scenarios,
    profiles,
    pendingProfiles,
    identityResult,
    diagnostics,
    capabilities,
    selectScenario,
    refresh,
  } = useIdentityFoundation()

  return (
    <div className="flex flex-col gap-4 p-4 overflow-y-auto">
      <IdentityStatusCard identityResult={identityResult} />

      <section className="rounded-2xl border border-white/10 bg-slate-950/70 p-4 text-sm text-slate-200">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-300">
              Identity Simulation
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-slate-400">
              UI-safe scenarios for testing Identity Foundation without biometric recognition.
            </p>
          </div>

          <button
            onClick={refresh}
            className="flex items-center gap-2 rounded-xl border border-cyan-500/20 bg-cyan-500/10 px-3 py-2 text-xs font-semibold tracking-wide text-cyan-200 hover:bg-cyan-500/20"
          >
            <RefreshCw size={13} />
            REFRESH
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <ScenarioButton label="No person" active={scenario === scenarios.NO_PERSON} onClick={() => selectScenario(scenarios.NO_PERSON)} />
          <ScenarioButton label="Unknown" active={scenario === scenarios.UNKNOWN_PERSON} onClick={() => selectScenario(scenarios.UNKNOWN_PERSON)} />
          <ScenarioButton label="Christian" active={scenario === scenarios.CHRISTIAN} onClick={() => selectScenario(scenarios.CHRISTIAN)} />
          <ScenarioButton label="Ann" active={scenario === scenarios.ANN} onClick={() => selectScenario(scenarios.ANN)} />
          <ScenarioButton label="Finley" active={scenario === scenarios.FINLEY} onClick={() => selectScenario(scenarios.FINLEY)} wide />
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-slate-950/70 p-4 text-sm text-slate-200">
        <div className="mb-3 flex items-center gap-2">
          <UserRoundSearch size={16} className="text-cyan-300" />
          <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-300">
            Local Profiles
          </h2>
        </div>

        <div className="space-y-3">
          {profiles.map((profile) => (
            <IdentityProfileCard
              key={profile.id}
              profile={profile}
              active={identityResult?.profile?.id === profile.id}
            />
          ))}
        </div>

        {pendingProfiles.length > 0 && (
          <div className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-200">
            {pendingProfiles.length} pending profile(s) require trusted user confirmation.
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-white/10 bg-slate-950/70 p-4 text-sm text-slate-200">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-cyan-300">
          Identity Capability Status
        </h2>

        <div className="space-y-3">
          {capabilities.map((capability) => (
            <IdentityCapabilityCard key={capability.id} capability={capability} />
          ))}
        </div>

        <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-xs leading-relaxed text-slate-300">
          {diagnostics.summary}
        </div>
      </section>
    </div>
  )
}

function ScenarioButton({ label, active, onClick, wide = false }) {
  return (
    <button
      onClick={onClick}
      className={`${wide ? 'col-span-2' : ''} rounded-xl border px-3 py-2 text-xs font-semibold uppercase tracking-wider transition ${
        active
          ? 'border-cyan-500/30 bg-cyan-500/20 text-cyan-200'
          : 'border-white/10 bg-white/[0.03] text-slate-400 hover:border-cyan-500/20 hover:text-cyan-200'
      }`}
    >
      {label}
    </button>
  )
}
