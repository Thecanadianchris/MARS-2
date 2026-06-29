/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Component:
 * VisionDiagnosticsPanel
 *
 * Purpose:
 * Developer diagnostics dashboard for the MARS Vision stack.
 *
 * Version:
 * v0.11.3
 *
 * Date Code:
 * 290626
 * ==========================================================
 */

import React from 'react'
import VisionDiagnosticsCard from './VisionDiagnosticsCard'
import useVisionDiagnostics from '@/hooks/useVisionDiagnostics'

export default function VisionDiagnosticsPanel({
  visionResult = null,
  observation = null,
  personalObservation = null,
  frameStatus = null,
}) {
  const diagnostics = useVisionDiagnostics({
    visionResult,
    observation,
    personalObservation,
    frameStatus,
  })

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-950 p-5 shadow-lg">
      <div className="mb-5">
        <h2 className="text-xl font-bold text-white">
          Vision Diagnostics
        </h2>
        <p className="mt-1 text-sm text-slate-400">
          Live developer view of the MARS perception stack.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <VisionDiagnosticsCard title="Camera" {...diagnostics.camera} />
        <VisionDiagnosticsCard title="Person" {...diagnostics.person} />
        <VisionDiagnosticsCard title="Body State" {...diagnostics.body} />
        <VisionDiagnosticsCard title="Movement" {...diagnostics.movement} />
        <VisionDiagnosticsCard title="Activity" {...diagnostics.activity} />
        <VisionDiagnosticsCard title="Face" {...diagnostics.face} />
        <VisionDiagnosticsCard title="Observation" {...diagnostics.observation} />
        <VisionDiagnosticsCard
          title="Personal Observation"
          {...diagnostics.personalObservation}
        />
      </div>
    </section>
  )
}