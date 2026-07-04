/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Component:
 * DiagnosticsCard
 *
 * Purpose:
 * Displays a single subsystem diagnostics result.
 *
 * Version:
 * v0.13.4
 *
 * Date Code:
 * 040726
 * ==========================================================
 */

import StatusIndicator from './StatusIndicator'

export default function DiagnosticsCard({ item }) {
  if (!item) {
    return null
  }

  return (
    <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-white/90">{item.label}</h3>
          <p className="mt-1 text-xs leading-relaxed text-slate-400">{item.summary}</p>
        </div>

        <StatusIndicator status={item.status} />
      </div>

      {Array.isArray(item.checks) && item.checks.length > 0 && (
        <div className="mt-3 space-y-2 border-t border-white/10 pt-3">
          {item.checks.map((check) => (
            <div key={check.id} className="flex items-start justify-between gap-3 text-xs">
              <div>
                <div className="text-slate-300">{check.label}</div>
                {check.summary && (
                  <div className="mt-0.5 text-[11px] leading-relaxed text-slate-500">
                    {check.summary}
                  </div>
                )}
              </div>

              <span className={check.passed ? 'text-green-300' : 'text-slate-500'}>
                {check.passed ? 'pass' : 'waiting'}
              </span>
            </div>
          ))}
        </div>
      )}
    </article>
  )
}
