/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Component:
 * AIStatusPanel
 *
 * Purpose:
 * Displays current MARS AI routing status.
 *
 * Version:
 * v0.9.2
 *
 * Date Code:
 * 270626
 * ==========================================================
 */

import { useState } from 'react'
import AIStatusService from '@/services/ai/AIStatusService'
import LocalAIDecisionService from '@/services/ai/LocalAIDecisionService'

export default function AIStatusPanel() {
  const [status, setStatus] = useState(AIStatusService.getStatus())
  const [lastResponse, setLastResponse] = useState(null)

  const handleTestRoute = async () => {
    const result = await LocalAIDecisionService.process({
      capability: 'status',
      allowCloud: false,
      payload: {
        source: 'AIStatusPanel',
      },
    })

    const updatedStatus = AIStatusService.updateStatus({
      activeProvider: result.provider,
      activeCapability: result.capability,
    })

    setStatus(updatedStatus)
    setLastResponse(result)
  }

  return (
    <div className="rounded-2xl border border-cyan-500/20 bg-slate-950/70 p-4 text-sm text-cyan-100 shadow-lg shadow-cyan-500/10">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold tracking-widest text-cyan-300">
          MARS INTELLIGENCE
        </h2>

        <span className="rounded-full bg-cyan-500/10 px-2 py-1 text-xs text-cyan-300">
          {status.mode}
        </span>
      </div>

      <div className="space-y-2">
        <StatusRow
          label="Local Device"
          active={status.localDevice}
          current={status.activeProvider === 'LOCAL_DEVICE'}
        />

        <StatusRow
          label="Home AI Server"
          active={status.homeServer}
          current={status.activeProvider === 'HOME_AI_SERVER'}
        />

        <StatusRow
          label="Cloud AI"
          active={status.cloudAI}
          current={status.activeProvider === 'CLOUD_AI'}
        />
      </div>

      <div className="mt-4 border-t border-cyan-500/10 pt-3">
        <div className="flex justify-between">
          <span className="text-slate-400">Active</span>
          <span className="font-medium text-cyan-200">
            {formatProvider(status.activeProvider)}
          </span>
        </div>

        <div className="mt-1 flex justify-between">
          <span className="text-slate-400">Capability</span>
          <span className="font-medium text-cyan-200">
            {status.activeCapability}
          </span>
        </div>

        {lastResponse && (
          <div className="mt-3 rounded-xl border border-cyan-500/10 bg-cyan-500/5 p-3 text-xs text-cyan-100">
            {lastResponse.response}
          </div>
        )}

        <button
          onClick={handleTestRoute}
          className="mt-3 w-full rounded-xl border border-cyan-500/20 bg-cyan-500/10 px-3 py-2 text-xs font-semibold tracking-wide text-cyan-200 hover:bg-cyan-500/20"
        >
          TEST AI ROUTE
        </button>
      </div>
    </div>
  )
}

function StatusRow({ label, active, current }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span
          className={`h-2.5 w-2.5 rounded-full ${
            active ? 'bg-cyan-400' : 'bg-slate-600'
          }`}
        />
        <span>{label}</span>
      </div>

      {current && (
        <span className="rounded-full bg-cyan-500/10 px-2 py-0.5 text-xs text-cyan-300">
          active
        </span>
      )}
    </div>
  )
}

function formatProvider(provider) {
  const names = {
    LOCAL_DEVICE: 'Local Device',
    HOME_AI_SERVER: 'Home AI Server',
    CLOUD_AI: 'Cloud AI',
    NONE: 'None',
  }

  return names[provider] || provider
}