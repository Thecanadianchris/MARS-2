/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Component:
 * VoicePanel
 *
 * Purpose:
 * UI panel for v0.14.0 Voice Intelligence Foundation. This
 * panel displays architecture status, registered commands and
 * manual transcript parsing only. Live audio is intentionally
 * deferred to later voice milestones.
 *
 * Version:
 * v0.14.0
 * Date Code:
 * 060726
 * ==========================================================
 */

import { useState } from 'react'
import { Mic, RefreshCw, Route, ShieldCheck, Volume2 } from 'lucide-react'
import CapabilityStateBadge from '@/components/mars/CapabilityStateBadge'
import useVoiceIntelligence from '@/hooks/useVoiceIntelligence'

export default function VoicePanel() {
  const { snapshot, lastResult, refresh, parseTranscript, clearHistory } = useVoiceIntelligence()
  const [transcript, setTranscript] = useState('voice status')

  const handleParse = () => {
    parseTranscript(transcript)
  }

  return (
    <div className="flex flex-col gap-4 p-4 overflow-y-auto">
      <section className="rounded-2xl border border-cyan-500/20 bg-slate-950/70 p-4 text-sm text-cyan-100 shadow-lg shadow-cyan-500/10">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-cyan-500/20 bg-cyan-500/10">
              <Mic size={19} className="text-cyan-300" />
            </div>
            <div>
              <h1 className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300">
                Voice Intelligence
              </h1>
              <p className="mt-1 text-xs leading-relaxed text-slate-400">
                v0.14.0 foundation layer for command registration, intent parsing and voice diagnostics.
              </p>
            </div>
          </div>

          <CapabilityStateBadge state={snapshot.capabilityState} />
        </div>

        <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-xs leading-relaxed text-slate-300">
          {snapshot.summary}
        </div>

        <div className="mt-3 rounded-xl border border-amber-400/20 bg-amber-500/10 p-3 text-xs leading-relaxed text-amber-100">
          Live microphone capture, wake word detection, STT, TTS and Android audio are intentionally deferred.
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
          <Metric label="Commands" value={snapshot.commandRegistry.commandCount} />
          <Metric label="Active" value={snapshot.commandRegistry.activeCount} />
          <Metric label="Deferred" value={snapshot.deferredFeatures.length} />
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <div className="flex items-center gap-2 text-cyan-300">
          <Route size={16} />
          <h2 className="text-xs font-semibold uppercase tracking-[0.2em]">Manual Transcript Parser</h2>
        </div>

        <p className="mt-2 text-xs leading-relaxed text-slate-400">
          This verifies the Voice Intent Parser without pretending that live audio is connected.
        </p>

        <textarea
          value={transcript}
          onChange={(event) => setTranscript(event.target.value)}
          className="mt-3 min-h-20 w-full rounded-xl border border-white/10 bg-slate-950/80 p-3 text-xs text-slate-100 outline-none focus:border-cyan-500/50"
          placeholder="Type a transcript such as: voice status"
        />

        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            onClick={handleParse}
            className="rounded-xl border border-cyan-500/20 bg-cyan-500/10 px-3 py-2 text-xs font-semibold tracking-wide text-cyan-200 hover:bg-cyan-500/20"
          >
            PARSE INTENT
          </button>
          <button
            onClick={clearHistory}
            className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-semibold tracking-wide text-slate-300 hover:bg-white/[0.07]"
          >
            CLEAR
          </button>
        </div>

        {lastResult && (
          <div className="mt-3 rounded-xl border border-white/10 bg-slate-950/70 p-3 text-xs text-slate-300">
            <div className="flex items-center justify-between gap-3">
              <span className="font-semibold text-white">{lastResult.intent || 'No intent'}</span>
              <span className="rounded-full border border-white/10 px-2 py-1 uppercase tracking-widest text-slate-400">
                {lastResult.status}
              </span>
            </div>
            <p className="mt-2 leading-relaxed text-slate-400">{lastResult.summary}</p>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-cyan-300">
            <Volume2 size={16} />
            <h2 className="text-xs font-semibold uppercase tracking-[0.2em]">Registered Commands</h2>
          </div>
          <button onClick={refresh} className="text-slate-400 hover:text-cyan-300">
            <RefreshCw size={14} />
          </button>
        </div>

        <div className="mt-3 space-y-2">
          {snapshot.commands.map((command) => (
            <div key={command.id} className="rounded-xl border border-white/10 bg-slate-950/50 p-3 text-xs">
              <div className="flex items-center justify-between gap-3">
                <div className="font-semibold text-slate-100">{command.phrase}</div>
                <span className="rounded-full border border-white/10 px-2 py-1 uppercase tracking-widest text-slate-400">
                  {command.status}
                </span>
              </div>
              <p className="mt-1 leading-relaxed text-slate-500">{command.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-4 text-xs leading-relaxed text-emerald-100">
        <div className="flex items-center gap-2 font-semibold uppercase tracking-[0.2em] text-emerald-300">
          <ShieldCheck size={15} />
          Safety Boundary
        </div>
        <p className="mt-2">{snapshot.safetyBoundary}</p>
      </section>
    </div>
  )
}

function Metric({ label, value }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
      <div className="text-lg font-bold text-white">{value}</div>
      <div className="mt-1 uppercase tracking-widest text-slate-500">{label}</div>
    </div>
  )
}
