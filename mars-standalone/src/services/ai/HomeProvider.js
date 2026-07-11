/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Module:
 * HomeProvider
 *
 * Purpose:
 * Tier 2 of the MARS AI escalation chain: the base station
 * laptop (Snapdragon X) running a local LLM via Ollama's HTTP
 * API (default http://localhost:11434). Handles easy questions
 * quickly and privately before anything escalates to the cloud.
 *
 * Behaviour is honest: availability comes from a real probe of
 * the Ollama endpoint (/api/tags), never a hardcoded flag. If
 * Ollama is not installed or not running, this tier truthfully
 * reports unreachable and the chain escalates to Cloud.
 *
 * The legacy capability-routing interface (canHandle/process,
 * used by LocalAIDecisionService since v0.9.1) is preserved
 * unchanged.
 *
 * Version:
 * v0.14.4 (real Ollama client; legacy interface from v0.9.2)
 * Date Code:
 * 110726
 * ==========================================================
 */

import AIProviderConfig from './AIProviderConfig'

const PROBE_TIMEOUT_MS = 1500
const GENERATE_TIMEOUT_MS = 60000 // CPU inference on the base station can be slow, especially cold
const PROBE_TTL_MS = 5000

async function fetchWithTimeout(url, options = {}, timeoutMs) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    return await fetch(url, { ...options, signal: controller.signal })
  } finally {
    clearTimeout(timer)
  }
}

class HomeProvider {
  constructor() {
    this.name = 'HOME_AI_SERVER'
    this.lastProbe = null
    this.lastProbeAt = 0
  }

  resetProbeCache() {
    this.lastProbe = null
    this.lastProbeAt = 0
  }

  // ---- v0.14.4 reasoning tier (real Ollama client) ----

  async probe({ force = false } = {}) {
    const now = Date.now()

    if (!force && this.lastProbe && now - this.lastProbeAt < PROBE_TTL_MS) {
      return this.lastProbe
    }

    const { ollamaBaseUrl } = AIProviderConfig.getConfig()

    let result

    try {
      const res = await fetchWithTimeout(`${ollamaBaseUrl}/api/tags`, {}, PROBE_TIMEOUT_MS)

      if (!res.ok) {
        result = {
          reachable: false,
          models: [],
          detail: `Ollama endpoint responded with HTTP ${res.status}.`,
        }
      } else {
        const data = await res.json()
        const models = (data?.models || []).map((m) => m?.name).filter(Boolean)

        result = {
          reachable: true,
          models,
          detail:
            models.length > 0
              ? `Ollama reachable at ${ollamaBaseUrl} — ${models.length} model(s) installed.`
              : `Ollama reachable at ${ollamaBaseUrl}, but no models are installed yet (run: ollama pull <model>).`,
        }
      }
    } catch {
      result = {
        reachable: false,
        models: [],
        detail: `Ollama not reachable at ${ollamaBaseUrl}. Is it installed and running on the base station?`,
      }
    }

    this.lastProbe = result
    this.lastProbeAt = now
    return result
  }

  resolveModel(models = []) {
    const { ollamaModel } = AIProviderConfig.getConfig()
    return ollamaModel || models[0] || null
  }

  async reason({ prompt, system } = {}) {
    if (!prompt) {
      return { provider: this.name, status: 'error', response: null, detail: 'No prompt supplied.' }
    }

    const probe = await this.probe()

    if (!probe.reachable) {
      return { provider: this.name, status: 'unavailable', response: null, detail: probe.detail }
    }

    const model = this.resolveModel(probe.models)

    if (!model) {
      return { provider: this.name, status: 'unavailable', response: null, detail: probe.detail }
    }

    const { ollamaBaseUrl } = AIProviderConfig.getConfig()
    const startedAt = Date.now()

    try {
      // think:false suppresses chain-of-thought on thinking models (e.g.
      // qwen3.x) — without it, CPU inference spends the whole timeout
      // "thinking" before the actual reply. Ollama rejects the flag with
      // HTTP 400 on non-thinking models, so retry once without it.
      let res = await fetchWithTimeout(
        `${ollamaBaseUrl}/api/generate`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ model, prompt, system, stream: false, think: false }),
        },
        GENERATE_TIMEOUT_MS
      )

      if (res.status === 400) {
        res = await fetchWithTimeout(
          `${ollamaBaseUrl}/api/generate`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ model, prompt, system, stream: false }),
          },
          GENERATE_TIMEOUT_MS
        )
      }

      if (!res.ok) {
        return {
          provider: this.name,
          status: 'error',
          response: null,
          detail: `Ollama generate failed with HTTP ${res.status}.`,
        }
      }

      const data = await res.json()
      const text = typeof data?.response === 'string' ? data.response.trim() : ''

      if (!text) {
        return {
          provider: this.name,
          status: 'error',
          response: null,
          detail: 'Ollama returned an empty response.',
        }
      }

      return {
        provider: this.name,
        status: 'success',
        response: text,
        model,
        durationMs: Date.now() - startedAt,
      }
    } catch (err) {
      return {
        provider: this.name,
        status: 'error',
        response: null,
        detail: err?.name === 'AbortError' ? 'Ollama generate timed out.' : 'Ollama generate request failed.',
      }
    }
  }

  async getReasoningStatus() {
    const probe = await this.probe()

    return {
      tier: this.name,
      label: 'Home AI Server (Base Station)',
      available: probe.reachable && this.resolveModel(probe.models) !== null,
      detail: probe.detail,
      models: probe.models,
      selectedModel: this.resolveModel(probe.models),
    }
  }

  // ---- legacy v0.9.2 capability routing (unchanged) ----

  canHandle(request) {
    if (!request) {
      return false
    }

    return false
  }

  async process(request) {
    return {
      provider: this.name,
      status: 'success',
      capability: request?.capability || 'general',
      response: 'Processed by home AI server placeholder.',
    }
  }
}

export default new HomeProvider()
