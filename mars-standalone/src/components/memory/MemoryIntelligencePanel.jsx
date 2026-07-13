/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Component:
 * MemoryIntelligencePanel
 *
 * Purpose:
 * Honest diagnostics surface for the v0.15 Memory Intelligence
 * Foundation. Mirrors the Conversation/Voice panel pattern:
 * shows the real persistent store (entry count, categories,
 * migration status, backing) read straight from
 * MemoryIntelligenceService — the same store ChatPanel's
 * remember/recall commands and the Notes tab use.
 *
 * Version:
 * v0.15
 * Date Code:
 * 120726
 * ==========================================================
 */

import { Brain, Clock, Database, RefreshCw, ShieldCheck, Trash2, User } from 'lucide-react'
import useMemoryIntelligence from '@/hooks/useMemoryIntelligence'

export default function MemoryIntelligencePanel() {
  const { status, persons, workingMemory, longTerm, refresh, clearAll } = useMemoryIntelligence()

  const categoryEntries = Object.entries(status.categoryCounts || {})
  const workingStatus = workingMemory?.status || {}
  const workingItems = workingMemory?.items || []
  const lt = longTerm || {}

  return (
    <div className="flex flex-col gap-4 p-4 overflow-y-auto">
      <section className="rounded-2xl border border-cyan-500/20 bg-slate-950/70 p-4 text-sm text-cyan-100 shadow-lg shadow-cyan-500/10">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-cyan-500/20 bg-cyan-500/10">
              <Brain size={19} className="text-cyan-300" />
            </div>
            <div>
              <h1 className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300">
                Memory Intelligence
              </h1>
              <p className="mt-1 text-xs leading-relaxed text-slate-400">
                v0.15 persistent memory foundation. This is the live store behind the Notes tab and MARS's remember/recall commands.
              </p>
            </div>
          </div>

          <span
            className={`rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-widest ${
              status.persistentMemory
                ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200'
                : 'border-slate-400/30 bg-slate-500/10 text-slate-300'
            }`}
          >
            {status.persistentMemory ? 'Active' : 'Idle'}
          </span>
        </div>

        <div className="mt-4 grid grid-cols-4 gap-2 text-center text-xs">
          <Metric label="People" value={status.personCount} />
          <Metric label="Facts" value={status.entryCount} />
          <Metric label="Backed" value={status.storageBacked ? 'disk' : 'memory'} />
          <Metric label="Version" value={status.version} />
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={refresh}
            className="flex items-center justify-center gap-2 rounded-xl border border-cyan-500/20 bg-cyan-500/10 px-3 py-2 text-xs font-semibold tracking-wide text-cyan-200 hover:bg-cyan-500/20"
          >
            <RefreshCw size={13} />
            REFRESH
          </button>
          <button
            type="button"
            onClick={clearAll}
            className="flex items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-semibold tracking-wide text-red-200 hover:bg-red-500/20"
          >
            <Trash2 size={13} />
            CLEAR ALL
          </button>
        </div>

        <div className="mt-3 flex items-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-500/[0.06] px-3 py-2 text-[11px] text-emerald-100">
          <ShieldCheck size={13} className="text-emerald-300 shrink-0" />
          <span>
            Retention: <span className="font-semibold text-white">{lt.protectedCount ?? 0}</span> facts protected
            {lt.safetyCount ? <> (incl. <span className="font-semibold text-rose-200">{lt.safetyCount} safety</span>)</> : null},
            {' '}<span className="font-semibold text-white">{lt.eligibleToForget ?? 0}</span> eligible to forget.
          </span>
        </div>
      </section>

      {categoryEntries.length > 0 && (
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <div className="flex items-center gap-2 text-cyan-300">
            <Database size={16} />
            <h2 className="text-xs font-semibold uppercase tracking-[0.2em]">Categories</h2>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {categoryEntries.map(([category, count]) => (
              <span
                key={category}
                className="rounded-full border border-white/10 bg-slate-950/60 px-3 py-1 text-xs text-slate-300"
              >
                {category}: <span className="font-semibold text-white">{count}</span>
              </span>
            ))}
          </div>
        </section>
      )}

      <section className="rounded-2xl border border-violet-400/20 bg-violet-500/[0.06] p-4">
        <div className="flex items-center justify-between gap-3 text-violet-200">
          <div className="flex items-center gap-2">
            <Clock size={16} />
            <h2 className="text-xs font-semibold uppercase tracking-[0.2em]">Working Memory (session)</h2>
          </div>
          <span className="rounded-full border border-violet-300/20 px-2 py-0.5 text-[10px] uppercase tracking-widest text-violet-200">
            {workingStatus.personId || 'no active person'}
          </span>
        </div>

        <p className="mt-2 text-[11px] leading-relaxed text-slate-400">
          v0.15.2 short-term set — seeded from the active person's long-term facts on session start; items can be promoted back to long-term. Clears with the conversation session.
        </p>

        <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
          <Metric label="Seeded" value={workingStatus.seededCount ?? 0} />
          <Metric label="Items" value={workingStatus.itemCount ?? 0} />
          <Metric label="Promoted" value={workingStatus.promotedCount ?? 0} />
        </div>

        {workingItems.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {workingItems.map((item) => (
              <span
                key={item.key}
                className="rounded-full border border-violet-300/20 bg-slate-950/50 px-3 py-1 text-[11px] text-slate-300"
              >
                {item.key}: <span className="text-white">{String(item.value)}</span>
                <span className="ml-1 text-slate-500">({item.origin})</span>
              </span>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <div className="flex items-center gap-2 text-cyan-300">
          <Brain size={16} />
          <h2 className="text-xs font-semibold uppercase tracking-[0.2em]">Stored Memory by Person</h2>
        </div>

        {persons.length === 0 ? (
          <div className="mt-3 rounded-xl border border-white/10 bg-slate-950/60 p-3 text-xs leading-relaxed text-slate-400">
            Nothing stored yet. Try "remember my birthday is June 5th" (owner) or "remember Finley's medication is 8pm" (per person) on the Chat tab.
          </div>
        ) : (
          <div className="mt-3 space-y-4">
            {persons.map((person) => (
              <div key={person.personId}>
                <div className="mb-2 flex items-center gap-2">
                  <User size={13} className="text-cyan-300" />
                  <span className="text-xs font-semibold uppercase tracking-widest text-cyan-300">
                    {person.personId}
                  </span>
                  {person.personId === status.defaultPersonId && (
                    <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] uppercase tracking-widest text-slate-400">
                      owner
                    </span>
                  )}
                </div>

                <div className="space-y-2">
                  {[...person.entries].sort(safetyFirst).map((entry) => (
                    <div
                      key={entry.key}
                      className={`rounded-xl border p-3 text-xs ${
                        entry.category === 'safety'
                          ? 'border-rose-400/30 bg-rose-500/[0.07]'
                          : 'border-cyan-500/20 bg-cyan-500/5'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className={`font-semibold ${entry.category === 'safety' ? 'text-rose-200' : 'text-cyan-300'}`}>
                          {entry.key}
                        </span>
                        <span className={categoryChipClass(entry.category)}>
                          {entry.category}
                        </span>
                      </div>
                      <div className="mt-1 text-white">{String(entry.value)}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-4 text-xs leading-relaxed text-emerald-100">
        <div className="flex items-center gap-2 font-semibold uppercase tracking-[0.2em] text-emerald-300">
          <ShieldCheck size={15} />
          Safety Boundary
        </div>
        <p className="mt-2">
          Memory stores user-provided facts and preferences only. It does not infer, and never stores medical assessments or diagnoses. Engine-driven writes and short/long-term reasoning arrive in v0.15.1–v0.15.3.
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

// Safety facts sort to the top of each person's list.
function safetyFirst(a, b) {
  const rank = (entry) => (entry.category === 'safety' ? 0 : 1)
  return rank(a) - rank(b)
}

function categoryChipClass(category) {
  const base = 'rounded-full border px-2 py-0.5 uppercase tracking-widest'
  return category === 'safety'
    ? `${base} border-rose-400/40 bg-rose-500/10 text-rose-200`
    : `${base} border-white/10 text-slate-400`
}
