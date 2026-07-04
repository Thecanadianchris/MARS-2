/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Component:
 * DiagnosticsSection
 *
 * Purpose:
 * Groups diagnostics cards by capability area.
 *
 * Version:
 * v0.13.4
 *
 * Date Code:
 * 040726
 * ==========================================================
 */

import DiagnosticsCard from './DiagnosticsCard'

export default function DiagnosticsSection({ title, items = [] }) {
  if (!items.length) {
    return null
  }

  return (
    <section className="space-y-3">
      <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300/80">
        {title}
      </h2>

      <div className="space-y-3">
        {items.map((item) => (
          <DiagnosticsCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  )
}
