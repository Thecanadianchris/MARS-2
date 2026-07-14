/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Component:
 * ConversationPanel
 *
 * Purpose:
 * UI diagnostics panel for the v0.14.2 Natural Conversation
 * Engine. Mirrors the VoicePanel pattern: validates sessions,
 * context, reference resolution, planning and deterministic
 * responses without wiring into live chat or live audio.
 *
 * Version:
 * v0.14.2
 * Date Code:
 * 110726
 * ==========================================================
 */

import { useState } from 'react'
import { MessageCircle, RotateCcw, Send, ShieldCheck, XCircle } from 'lucide-react'
import CapabilityStateBadge from '@/components/mars/CapabilityStateBadge'
import useConversationIntelligence from '@/hooks/useConversationIntelligence'

export default function ConversationPanel() {
  const { snapshot, lastResult, capabilityState, sendTurn, resetConversation } =
    useConversationIntelligence()
  const [message, setMessage] = useState('who do you see right now')

  const session = snapshot.session || {}
  const history = snapshot.history || {}
  const context = snapshot.context || {}
  const plan = lastResult?.plan || null
  const reference = lastResult?.reference || null
  const response = lastResult?.response || null

  const handleSend = () => {
    if (!message.trim()) return
    sendTurn(message)
  }

  return (
    <div className="flex flex-col gap-4 p-4 overflow-y-auto">
      <section className="rounded-2xl border border-cyan-500/20 bg-slate-950/70 p-4 text-sm text-cyan-100 shadow-lg shadow-cyan-500/10">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-cyan-500/20 bg-cyan-500/10">
              <MessageCircle size={19} className="text-cyan-300" />
            </div>
            <div>
              <h1 className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300">
                Natural Conversation Engine
              </h1>
              <p className="mt-1 text-xs leading-relaxed text-slate-400">
                v0.14.2 conversation sessions, context, reference resolution and planning.
              </p>
            </div>
          </div>

          <CapabilityStateBadge state={capabilityState} />
        </div>

        <div className="mt-3 rounded-xl border border-amber-400/20 bg-amber-500/10 p-3 text-xs leading-relaxed text-amber-100">
          Persistent memory, live audio and cross-capability execution are intentionally deferred. This panel exercises the conversation engine in isolation from live chat.
        </div>

        <div className="mt-4 grid grid-cols-4 gap-2 text-center text-xs">
          <Metric label="Session" value={session.conversationActive ? 'active' : 'idle'} />
          <Metric label="Turns" value={session.turnCount || 0} />
          <Metric label="History" value={history.historySize || 0} />
          <Metric label="Topic" value={context.activeTopic || '—'} />
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <div className="flex items-center gap-2 text-cyan-300">
          <Send size={16} />
          <h2 className="text-xs font-semibold uppercase tracking-[0.2em]">Conversation Turn</h2>
        </div>

        <textarea
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          className="mt-3 min-h-16 w-full rounded-xl border border-white/10 bg-slate-950/80 p-3 text-xs text-slate-100 outline-none focus:border-cyan-500/50"
          placeholder="Type a message such as: who do you see right now"
        />

        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={handleSend}
            className="rounded-xl border border-cyan-500/20 bg-cyan-500/10 px-3 py-2 text-xs font-semibold tracking-wide text-cyan-200 hover:bg-cyan-500/20"
          >
            SEND TURN
          </button>
          <button
            type="button"
            onClick={resetConversation}
            className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-semibold tracking-wide text-slate-300 hover:bg-white/[0.07]"
          >
            <RotateCcw size={13} />
            RESET
          </button>
        </div>

        {plan && (
          <div className="mt-3 rounded-xl border border-violet-400/20 bg-violet-500/10 p-3 text-xs text-violet-100">
            <div className="flex items-center justify-between gap-3">
              <span className="font-semibold">Plan: {plan.action}</span>
              <span className="rounded-full border border-violet-300/20 px-2 py-1 uppercase tracking-widest text-violet-200">
                {plan.capability}
              </span>
            </div>
            <p className="mt-2 leading-relaxed text-violet-100/80">{plan.summary}</p>
          </div>
        )}

        {reference && reference.referenceType !== 'none' && (
          <div className="mt-3 rounded-xl border border-white/10 bg-slate-950/70 p-3 text-xs text-slate-300">
            <div className="flex items-center justify-between gap-3">
              <span className="font-semibold text-white">Reference: {reference.referenceType}</span>
              <span className="rounded-full border border-white/10 px-2 py-1 uppercase tracking-widest text-slate-400">
                {reference.resolvedTarget || 'unresolved'}
              </span>
            </div>
            <p className="mt-2 leading-relaxed text-slate-400">{reference.summary}</p>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-4">
        <div className="flex items-center gap-2 text-cyan-300">
          <MessageCircle size={16} />
          <h2 className="text-xs font-semibold uppercase tracking-[0.2em]">Latest Conversation Response</h2>
        </div>

        {response ? (
          <div className="mt-3 rounded-xl border border-cyan-400/20 bg-slate-950/70 p-3 text-xs text-cyan-50">
            <div className="flex items-center justify-between gap-3">
              <span className="font-semibold text-white">{response.title}</span>
              <span className="rounded-full border border-cyan-300/20 px-2 py-1 uppercase tracking-widest text-cyan-200">
                {Math.round((response.confidence || 0) * 100)}%
              </span>
            </div>
            <p className="mt-2 leading-relaxed text-cyan-100/80">{response.summary}</p>
            {response.lines?.length > 0 && (
              <ul className="mt-3 space-y-1 text-slate-300">
                {response.lines.map((line) => (
                  <li key={line} className="rounded-lg border border-white/5 bg-white/[0.03] px-2 py-1">
                    {line}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : (
          <div className="mt-3 rounded-xl border border-white/10 bg-slate-950/60 p-3 text-xs leading-relaxed text-slate-400">
            No conversation turn has been sent yet. Type a message and press Send Turn.
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-4 text-xs leading-relaxed text-emerald-100">
        <div className="flex items-center gap-2 font-semibold uppercase tracking-[0.2em] text-emerald-300">
          <ShieldCheck size={15} />
          Safety Boundary
        </div>
        <p className="mt-2">
          The Natural Conversation Engine does not make medical diagnoses, does not execute robot hardware and does not write persistent memory.
        </p>
      </section>

      <section className="rounded-2xl border border-slate-400/20 bg-slate-500/10 p-4 text-xs leading-relaxed text-slate-300">
        <div className="flex items-center gap-2 font-semibold uppercase tracking-[0.2em] text-slate-200">
          <XCircle size={15} />
          Not Included in v0.14.2
        </div>
        <p className="mt-2">
          This panel is a diagnostics surface only. Live chat on the Chat tab has routed through this engine since v0.14.3 (via ChatConversationBridge); this tab just shows the engine's own session/context/plan state directly.
        </p>
      </section>
    </div>
  )
}

function Metric({ label, value }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
      <div className="text-sm font-bold text-white truncate">{value}</div>
      <div className="mt-1 uppercase tracking-widest text-slate-500">{label}</div>
    </div>
  )
}
