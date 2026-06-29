/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Component:
 * VisionDiagnosticsCard
 *
 * Purpose:
 * Reusable display card for Vision Diagnostics data.
 *
 * Version:
 * v0.11.3
 *
 * Date Code:
 * 290626
 * ==========================================================
 */

import React from 'react'

export default function VisionDiagnosticsCard({
  title,
  value,
  subtitle,
  status = 'neutral',
}) {
  const statusClass = {
    neutral: 'border-slate-700 bg-slate-900',
    good: 'border-green-500 bg-green-950/30',
    warning: 'border-yellow-500 bg-yellow-950/30',
    error: 'border-red-500 bg-red-950/30',
    info: 'border-blue-500 bg-blue-950/30',
  }

  return (
    <div
      className={`rounded-xl border p-4 shadow-sm ${
        statusClass[status] || statusClass.neutral
      }`}
    >
      <div className="text-sm text-slate-400">{title}</div>

      <div className="mt-2 text-xl font-semibold text-white">
        {value ?? 'Unknown'}
      </div>

      {subtitle && (
        <div className="mt-1 text-xs text-slate-500">
          {subtitle}
        </div>
      )}
    </div>
  )
}