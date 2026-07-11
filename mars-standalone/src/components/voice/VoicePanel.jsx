/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Component:
 * VoicePanel
 *
 * Purpose:
 * UI panel for v0.14.1.1 Voice Response Layer. This
 * panel validates simulated voice activation, command parsing,
 * route diagnostics and deterministic visible responses. Live
 * audio is intentionally deferred.
 *
 * Version:
 * v0.14.1.1
 * Date Code:
 * 060726
 * ==========================================================
 */

import { useState } from 'react'
import { AudioLines, MessageSquareText, Mic, Power, RefreshCw, Route, ShieldCheck, Volume2, XCircle } from 'lucide-react'
import CapabilityStateBadge from '@/components/mars/CapabilityStateBadge'
import useVoiceIntelligence from '@/hooks/useVoiceIntelligence'

export default function VoicePanel() {
  const {
    snapshot,
    lastResult,
    lastResponse,
    refresh,
    activateVoice,
    parseTranscript,
    routeCommand,
    clearHistory,
    resetActivation,
  } = useVoiceIntelligence()
  const [transcript, setTranscript] = useState('wake mars')
  const [commandText, setCommandText] = useState('system status')

  const wakeState = snapshot.wakeWordService?.state || 'sleeping'
  const lastRoute = snapshot.lastRoute || lastResult?.route || null

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
                v0.14.1.1 wake word simulation, command routing and visible responses.
              </p>
            </div>
          </div>

          <CapabilityStateBadge state={snapshot.capabilityState} />
        </div>

        <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-xs leading-relaxed text-slate-300">
          {snapshot.summary}
        </div>

        <div className="mt-3 rounded-xl border border-amber-400/20 bg-amber-500/10 p-3 text-xs leading-relaxed text-amber-100">
          Live microphone capture, STT, TTS, Android audio and natural conversation are intentionally deferred. The wake and response layers are simulated for architecture validation.
        </div>

        <div className="mt-4 grid grid-cols-4 gap-2 text-center text-xs">
          <Metric label="Wake" value={wakeState} />
          <Metric label="Commands" value={snapshot.commandRegistry.commandCount} />
          <Metric label="Routes" value={snapshot.commandRouter.routeCount} />
          <Metric label="Responses" value={snapshot.responseCount || 0} />
        </div>

        <div className="mt-3 rounded-xl border border-cyan-500/20 bg-cyan-500/10 p-3 text-xs leading-relaxed text-cyan-100">
          <span className="font-semibold uppercase tracking-widest text-cyan-300">Activation State:</span>{' '}
          {wakeState === 'listening'
            ? 'MARS is listening. Enter a command and press Route Command.'
            : 'MARS is sleeping. Press Wake MARS before routing commands.'}
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <div className="flex items-center gap-2 text-cyan-300">
          <AudioLines size={16} />
          <h2 className="text-xs font-semibold uppercase tracking-[0.2em]">Browser Audio Capability</h2>
        </div>

        <p className="mt-2 text-xs leading-relaxed text-slate-400">
          Real Web Speech API support detected in this browser. This is separate from the simulated command routing below — the Chat tab uses this capability directly for live microphone input and spoken output.
        </p>

        <div className="mt-3 grid grid-cols-2 gap-2 text-center text-xs">
          <div className={`rounded-xl border p-3 ${snapshot.browserSpeechCapability?.speechToText ? 'border-emerald-400/20 bg-emerald-500/10 text-emerald-200' : 'border-red-400/20 bg-red-500/10 text-red-200'}`}>
            <div className="text-sm font-bold">{snapshot.browserSpeechCapability?.speechToText ? 'Supported' : 'Unavailable'}</div>
            <div className="mt-1 uppercase tracking-widest opacity-70">Speech-to-Text</div>
          </div>
          <div className={`rounded-xl border p-3 ${snapshot.browserSpeechCapability?.textToSpeech ? 'border-emerald-400/20 bg-emerald-500/10 text-emerald-200' : 'border-red-400/20 bg-red-500/10 text-red-200'}`}>
            <div className="text-sm font-bold">{snapshot.browserSpeechCapability?.textToSpeech ? 'Supported' : 'Unavailable'}</div>
            <div className="mt-1 uppercase tracking-widest opacity-70">Text-to-Speech</div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <div className="flex items-center gap-2 text-cyan-300">
          <Power size={16} />
          <h2 className="text-xs font-semibold uppercase tracking-[0.2em]">Voice Activation Layer</h2>
        </div>

        <p className="mt-2 text-xs leading-relaxed text-slate-400">
          Press Wake MARS or type a wake phrase to activate command routing without using a microphone.
        </p>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={activateVoice}
            className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-3 py-2 text-xs font-semibold tracking-wide text-emerald-200 hover:bg-emerald-500/20"
          >
            WAKE MARS
          </button>
          <button
            type="button"
            onClick={resetActivation}
            className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-semibold tracking-wide text-slate-300 hover:bg-white/[0.07]"
          >
            SLEEP
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <div className="flex items-center gap-2 text-cyan-300">
          <Route size={16} />
          <h2 className="text-xs font-semibold uppercase tracking-[0.2em]">Wake Phrase & Command Router</h2>
        </div>

        <textarea
          value={transcript}
          onChange={(event) => setTranscript(event.target.value)}
          className="mt-3 min-h-16 w-full rounded-xl border border-white/10 bg-slate-950/80 p-3 text-xs text-slate-100 outline-none focus:border-cyan-500/50"
          placeholder="Type a wake phrase such as: wake mars"
        />

        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => parseTranscript(transcript)}
            className="rounded-xl border border-cyan-500/20 bg-cyan-500/10 px-3 py-2 text-xs font-semibold tracking-wide text-cyan-200 hover:bg-cyan-500/20"
          >
            PARSE WAKE / INTENT
          </button>
          <button
            type="button"
            onClick={clearHistory}
            className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-semibold tracking-wide text-slate-300 hover:bg-white/[0.07]"
          >
            CLEAR
          </button>
        </div>

        <textarea
          value={commandText}
          onChange={(event) => setCommandText(event.target.value)}
          className="mt-3 min-h-16 w-full rounded-xl border border-white/10 bg-slate-950/80 p-3 text-xs text-slate-100 outline-none focus:border-cyan-500/50"
          placeholder="Type a command such as: system status"
        />

        <button
          type="button"
          onClick={() => routeCommand(commandText)}
          className="mt-3 w-full rounded-xl border border-violet-400/20 bg-violet-500/10 px-3 py-2 text-xs font-semibold tracking-wide text-violet-200 hover:bg-violet-500/20"
        >
          ROUTE COMMAND
        </button>

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

        {lastRoute && (
          <div className="mt-3 rounded-xl border border-violet-400/20 bg-violet-500/10 p-3 text-xs text-violet-100">
            <div className="flex items-center justify-between gap-3">
              <span className="font-semibold">Route: {lastRoute.target}</span>
              <span className="rounded-full border border-violet-300/20 px-2 py-1 uppercase tracking-widest text-violet-200">
                {lastRoute.status}
              </span>
            </div>
            <p className="mt-2 leading-relaxed text-violet-100/80">{lastRoute.summary}</p>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-4">
        <div className="flex items-center gap-2 text-cyan-300">
          <MessageSquareText size={16} />
          <h2 className="text-xs font-semibold uppercase tracking-[0.2em]">Latest Voice Response</h2>
        </div>

        {lastResponse ? (
          <div className="mt-3 rounded-xl border border-cyan-400/20 bg-slate-950/70 p-3 text-xs text-cyan-50">
            <div className="flex items-center justify-between gap-3">
              <span className="font-semibold text-white">{lastResponse.title}</span>
              <span className="rounded-full border border-cyan-300/20 px-2 py-1 uppercase tracking-widest text-cyan-200">
                {lastResponse.status}
              </span>
            </div>
            <p className="mt-2 leading-relaxed text-cyan-100/80">{lastResponse.summary}</p>
            {lastResponse.lines?.length > 0 && (
              <ul className="mt-3 space-y-1 text-slate-300">
                {lastResponse.lines.map((line) => (
                  <li key={line} className="rounded-lg border border-white/5 bg-white/[0.03] px-2 py-1">
                    {line}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : (
          <div className="mt-3 rounded-xl border border-white/10 bg-slate-950/60 p-3 text-xs leading-relaxed text-slate-400">
            No voice response has been generated yet. Wake MARS, route a command, then the response will appear here.
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-cyan-300">
            <Volume2 size={16} />
            <h2 className="text-xs font-semibold uppercase tracking-[0.2em]">Registered Commands</h2>
          </div>
          <button type="button" onClick={refresh} className="text-slate-400 hover:text-cyan-300">
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

      <section className="rounded-2xl border border-slate-400/20 bg-slate-500/10 p-4 text-xs leading-relaxed text-slate-300">
        <div className="flex items-center gap-2 font-semibold uppercase tracking-[0.2em] text-slate-200">
          <XCircle size={15} />
          Not Included in v0.14.1
        </div>
        <p className="mt-2">Live microphone capture, STT, TTS, Android audio and natural conversation remain future milestones. v0.14.1.1 responses are deterministic status messages, not AI conversation.</p>
      </section>
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
