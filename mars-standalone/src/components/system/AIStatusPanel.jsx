/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Component:
 * AIStatusPanel
 *
 * Purpose:
 * Honest diagnostics + control for the v0.14.4 AI Reasoning
 * Layer. Shows real per-tier availability (Local S22 stub,
 * Home Ollama probe, Cloud key state), lets the cloud provider
 * be selected (Claude / ChatGPT / Gemini / Other manual
 * endpoint) with one runtime-entered API key per provider, and
 * runs a live test through the full escalation chain with its
 * trail displayed.
 *
 * Version:
 * v0.14.4
 * Date Code:
 * 110726
 * ==========================================================
 */

import { useEffect, useState } from 'react'
import AIReasoningService from '@/services/ai/AIReasoningService'
import AIProviderConfig, { CLOUD_PROVIDERS, getProviderMeta } from '@/services/ai/AIProviderConfig'

const TEST_PROMPT =
  'Reply with one short sentence confirming the MARS AI reasoning chain is online.'

export default function AIStatusPanel() {
  const [tiers, setTiers] = useState([])
  const [probing, setProbing] = useState(false)
  const [cloudProvider, setCloudProvider] = useState(AIProviderConfig.getCloudProvider())
  const [keyDraft, setKeyDraft] = useState('')
  const [maskedKey, setMaskedKey] = useState(AIProviderConfig.getMaskedCloudKey())
  const [modelDraft, setModelDraft] = useState(AIProviderConfig.getCloudModel())
  const [baseUrlDraft, setBaseUrlDraft] = useState(AIProviderConfig.getConfig().customBaseUrl)
  const [testResult, setTestResult] = useState(null)
  const [testing, setTesting] = useState(false)

  const refreshTiers = async () => {
    setProbing(true)

    try {
      const snapshot = await AIReasoningService.probeAll()
      setTiers(snapshot.tiers)
    } finally {
      setProbing(false)
    }
  }

  useEffect(() => {
    refreshTiers()
  }, [])

  const syncCloudState = () => {
    setMaskedKey(AIProviderConfig.getMaskedCloudKey())
    setModelDraft(AIProviderConfig.getCloudModel())
    setBaseUrlDraft(AIProviderConfig.getConfig().customBaseUrl)
    setKeyDraft('')
  }

  const handleProviderChange = (e) => {
    const id = e.target.value

    AIProviderConfig.setCloudProvider(id)
    setCloudProvider(id)
    syncCloudState()
    refreshTiers()
  }

  const saveKey = () => {
    const key = keyDraft.trim()

    if (!key) return

    AIProviderConfig.setCloudApiKey(key)
    syncCloudState()
    refreshTiers()
  }

  const clearKey = () => {
    AIProviderConfig.clearCloudApiKey()
    syncCloudState()
    refreshTiers()
  }

  const saveModel = () => {
    AIProviderConfig.setCloudModel(modelDraft.trim())
    refreshTiers()
  }

  const saveBaseUrl = () => {
    AIProviderConfig.setConfig({ customBaseUrl: baseUrlDraft.trim() })
    refreshTiers()
  }

  const runTest = async () => {
    setTesting(true)
    setTestResult(null)

    try {
      const result = await AIReasoningService.reason({ prompt: TEST_PROMPT })
      setTestResult(result)
    } finally {
      setTesting(false)
    }

    refreshTiers()
  }

  const providerMeta = getProviderMeta(cloudProvider)

  return (
    <div className="rounded-2xl border border-cyan-500/20 bg-slate-950/70 p-4 text-sm text-cyan-100 shadow-lg shadow-cyan-500/10">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold tracking-widest text-cyan-300">
          MARS INTELLIGENCE
        </h2>

        <span className="rounded-full bg-cyan-500/10 px-2 py-1 text-xs text-cyan-300">
          local-first · v0.14.4
        </span>
      </div>

      <div className="space-y-3">
        {tiers.map((tier) => (
          <TierRow key={tier.tier} tier={tier} activeProvider={testResult?.provider} />
        ))}

        {tiers.length === 0 && (
          <div className="text-xs text-slate-400">Probing AI tiers…</div>
        )}
      </div>

      <div className="mt-4 border-t border-cyan-500/10 pt-3">
        <div className="mb-2 text-xs font-semibold tracking-wide text-cyan-300">
          CLOUD PROVIDER
        </div>

        <select
          value={cloudProvider}
          onChange={handleProviderChange}
          className="w-full rounded-lg border border-cyan-500/20 bg-slate-900/80 px-2 py-1.5 text-xs text-cyan-100 focus:outline-none"
        >
          {CLOUD_PROVIDERS.map((p) => (
            <option key={p.id} value={p.id} className="bg-slate-900">
              {p.label}
            </option>
          ))}
        </select>

        {cloudProvider === 'other' && (
          <div className="mt-2 flex items-center gap-2">
            <input
              type="text"
              value={baseUrlDraft}
              onChange={(e) => setBaseUrlDraft(e.target.value)}
              onBlur={saveBaseUrl}
              placeholder="https://your-endpoint/v1 (OpenAI-compatible)"
              className="w-full rounded-lg border border-cyan-500/20 bg-slate-900/80 px-2 py-1.5 text-xs text-cyan-100 placeholder:text-slate-500 focus:outline-none"
            />
          </div>
        )}

        <div className="mt-2 flex items-center gap-2">
          <input
            type="text"
            value={modelDraft}
            onChange={(e) => setModelDraft(e.target.value)}
            onBlur={saveModel}
            placeholder="model name"
            className="w-full rounded-lg border border-cyan-500/20 bg-slate-900/80 px-2 py-1.5 text-xs text-cyan-100 placeholder:text-slate-500 focus:outline-none"
          />
          <span className="whitespace-nowrap text-[10px] text-slate-500">model</span>
        </div>

        <div className="mt-2">
          {maskedKey ? (
            <div className="flex items-center justify-between gap-2">
              <span className="truncate font-mono text-xs text-cyan-200">{maskedKey}</span>
              <button
                onClick={clearKey}
                className="rounded-lg border border-red-500/20 bg-red-500/10 px-2 py-1 text-xs text-red-300 hover:bg-red-500/20"
              >
                Clear
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <input
                type="password"
                value={keyDraft}
                onChange={(e) => setKeyDraft(e.target.value)}
                placeholder={providerMeta.keyPlaceholder}
                className="w-full rounded-lg border border-cyan-500/20 bg-slate-900/80 px-2 py-1.5 text-xs text-cyan-100 placeholder:text-slate-500 focus:outline-none"
              />
              <button
                onClick={saveKey}
                disabled={!keyDraft.trim()}
                className="rounded-lg border border-cyan-500/20 bg-cyan-500/10 px-3 py-1.5 text-xs font-semibold text-cyan-200 hover:bg-cyan-500/20 disabled:opacity-40"
              >
                Save
              </button>
            </div>
          )}
        </div>

        <p className="mt-2 text-[11px] leading-snug text-slate-500">
          One key per provider, stored in this browser's localStorage only — never the repo
          or bundle. Optional: put VITE_CLOUD_AI_KEY in a gitignored .env.local to skip
          pasting entirely.
        </p>
      </div>

      <div className="mt-3 border-t border-cyan-500/10 pt-3">
        <button
          onClick={runTest}
          disabled={testing || probing}
          className="w-full rounded-xl border border-cyan-500/20 bg-cyan-500/10 px-3 py-2 text-xs font-semibold tracking-wide text-cyan-200 hover:bg-cyan-500/20 disabled:opacity-40"
        >
          {testing ? 'TESTING AI ROUTE…' : 'TEST AI ROUTE'}
        </button>

        <button
          onClick={refreshTiers}
          disabled={probing || testing}
          className="mt-2 w-full rounded-xl border border-cyan-500/10 bg-slate-900/60 px-3 py-1.5 text-[11px] tracking-wide text-slate-400 hover:text-cyan-200 disabled:opacity-40"
        >
          {probing ? 'PROBING…' : 'REFRESH TIER STATUS'}
        </button>

        {testResult && (
          <div className="mt-3 rounded-xl border border-cyan-500/10 bg-cyan-500/5 p-3 text-xs text-cyan-100">
            <div className="mb-1 flex justify-between text-[11px] text-slate-400">
              <span>Answered by</span>
              <span className="font-medium text-cyan-300">
                {formatProvider(testResult.provider)}
                {testResult.model ? ` · ${testResult.model}` : ''}
              </span>
            </div>

            {testResult.response ? (
              <p>{testResult.response}</p>
            ) : (
              <p className="text-amber-300/90">{testResult.detail}</p>
            )}

            {Array.isArray(testResult.trail) && testResult.trail.length > 0 && (
              <div className="mt-2 space-y-0.5 border-t border-cyan-500/10 pt-2 text-[11px] text-slate-400">
                {testResult.trail.map((step, i) => (
                  <div key={i} className="flex justify-between gap-2">
                    <span>{formatProvider(step.tier)}</span>
                    <span
                      className={
                        step.outcome === 'success' ? 'text-cyan-300' : 'text-slate-500'
                      }
                    >
                      {step.outcome}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function TierRow({ tier, activeProvider }) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className={`h-2.5 w-2.5 rounded-full ${
              tier.available ? 'bg-cyan-400' : 'bg-slate-600'
            }`}
          />
          <span>{tier.label}</span>
        </div>

        {activeProvider === tier.tier && (
          <span className="rounded-full bg-cyan-500/10 px-2 py-0.5 text-xs text-cyan-300">
            answered
          </span>
        )}
      </div>

      <p className="ml-4.5 mt-0.5 pl-4 text-[11px] leading-snug text-slate-500">
        {tier.detail}
      </p>
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
