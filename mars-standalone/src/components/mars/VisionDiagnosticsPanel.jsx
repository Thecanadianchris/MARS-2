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
 * v0.12.2
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

  const decisionIntelligence = visionResult?.decisionIntelligence || null

  const context = visionResult?.context || decisionIntelligence?.context || null
  const decision = visionResult?.decision || decisionIntelligence?.decision || null
  const priority = visionResult?.priority || decisionIntelligence?.priority || null
  const recommendation =
    visionResult?.recommendation || decisionIntelligence?.recommendation || null

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-950 p-5 shadow-lg">
      <div className="mb-5">
        <h2 className="text-xl font-bold text-white">
          Vision Diagnostics
        </h2>
        <p className="mt-1 text-sm text-slate-400">
          Live developer view of the MARS perception and decision stack.
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

      <div className="mt-6">
        <h3 className="mb-3 text-lg font-semibold text-white">
          Decision Intelligence
        </h3>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <VisionDiagnosticsCard
            title="Context"
            status={context ? 'active' : 'inactive'}
            value={context?.label || context?.type || context?.status || 'Waiting'}
            summary={context?.summary || 'Awaiting live context output.'}
          />

          <VisionDiagnosticsCard
            title="Decision"
            status={decision ? 'active' : 'inactive'}
            value={decision?.label || decision?.type || decision?.status || 'Waiting'}
            summary={decision?.summary || 'Awaiting live decision output.'}
          />

          <VisionDiagnosticsCard
            title="Priority"
            status={priority ? 'active' : 'inactive'}
            value={
              priority?.label ||
              priority?.level ||
              priority?.type ||
              priority?.status ||
              'Waiting'
            }
            summary={priority?.summary || 'Awaiting live priority output.'}
          />

          <VisionDiagnosticsCard
            title="Recommendation"
            status={recommendation ? 'active' : 'inactive'}
            value={
              recommendation?.label ||
              recommendation?.action ||
              recommendation?.type ||
              recommendation?.status ||
              'Waiting'
            }
            summary={
              recommendation?.summary ||
              recommendation?.message ||
              'Awaiting live recommendation output.'
            }
          />
        </div>
      </div>
    </section>
  )
}