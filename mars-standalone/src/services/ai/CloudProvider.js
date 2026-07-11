/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Module:
 * CloudProvider
 *
 * Purpose:
 * Tier 3 of the MARS AI escalation chain: a selectable cloud
 * AI provider. Supported: Claude (Anthropic), ChatGPT (OpenAI),
 * Gemini (Google), and Other (any OpenAI-compatible endpoint
 * entered manually). Selection and per-provider keys live in
 * AIProviderConfig (localStorage only, optional .env.local
 * seed — never repo, never bundle).
 *
 * Honesty note: not every vendor allows direct browser calls.
 * Anthropic supports it via its CORS opt-in header and Gemini
 * supports browser keys; OpenAI generally does not allow
 * browser CORS — if a call fails that way, the error says so
 * rather than pretending the tier is broken.
 *
 * The legacy capability-routing interface (canHandle/process,
 * used by LocalAIDecisionService since v0.9.1) is preserved
 * unchanged.
 *
 * Version:
 * v0.14.4 (multi-provider cloud client; legacy interface from v0.9.1)
 * Date Code:
 * 110726
 * ==========================================================
 */

import AIProviderConfig, { getProviderMeta } from './AIProviderConfig'

const REQUEST_TIMEOUT_MS = 30000
const MAX_TOKENS = 512

async function fetchWithTimeout(url, options = {}, timeoutMs) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    return await fetch(url, { ...options, signal: controller.signal })
  } finally {
    clearTimeout(timer)
  }
}

// ---- per-vendor request builders + response parsers ----

async function callAnthropic({ apiKey, model, prompt, system }) {
  const res = await fetchWithTimeout(
    'https://api.anthropic.com/v1/messages',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model,
        max_tokens: MAX_TOKENS,
        system,
        messages: [{ role: 'user', content: prompt }],
      }),
    },
    REQUEST_TIMEOUT_MS
  )

  if (!res.ok) {
    return { httpStatus: res.status }
  }

  const data = await res.json()
  const text = (data?.content || [])
    .filter((block) => block?.type === 'text')
    .map((block) => block.text)
    .join('')
    .trim()

  return { text, model: data?.model || model }
}

async function callOpenAICompatible({ baseUrl, apiKey, model, prompt, system }) {
  const res = await fetchWithTimeout(
    `${baseUrl.replace(/\/$/, '')}/chat/completions`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        max_tokens: MAX_TOKENS,
        messages: [
          ...(system ? [{ role: 'system', content: system }] : []),
          { role: 'user', content: prompt },
        ],
      }),
    },
    REQUEST_TIMEOUT_MS
  )

  if (!res.ok) {
    return { httpStatus: res.status }
  }

  const data = await res.json()
  const text = (data?.choices?.[0]?.message?.content || '').trim()

  return { text, model: data?.model || model }
}

async function callGemini({ apiKey, model, prompt, system }) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`

  const res = await fetchWithTimeout(
    url,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...(system ? { systemInstruction: { parts: [{ text: system }] } } : {}),
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: MAX_TOKENS },
      }),
    },
    REQUEST_TIMEOUT_MS
  )

  if (!res.ok) {
    return { httpStatus: res.status }
  }

  const data = await res.json()
  const text = (data?.candidates?.[0]?.content?.parts || [])
    .map((part) => part?.text || '')
    .join('')
    .trim()

  return { text, model }
}

class CloudProvider {
  constructor() {
    this.name = 'CLOUD_AI'
  }

  isConfigured() {
    return AIProviderConfig.hasCloudApiKey()
  }

  getReasoningStatus() {
    const { allowCloud, cloudProvider, customBaseUrl } = AIProviderConfig.getConfig()
    const meta = getProviderMeta(cloudProvider)
    const configured = this.isConfigured()
    const model = AIProviderConfig.getCloudModel()

    let detail

    if (!configured) {
      detail = `No API key configured for ${meta.label}. Add one in the MARS Intelligence panel to enable cloud escalation.`
    } else if (!allowCloud) {
      detail = `${meta.label} key configured (${AIProviderConfig.getMaskedCloudKey()}) but cloud escalation is switched off.`
    } else if (cloudProvider === 'other' && !customBaseUrl) {
      detail = `${meta.label}: key configured but no endpoint URL entered.`
    } else if (cloudProvider === 'other' && !model) {
      detail = `${meta.label}: key and endpoint configured but no model name entered.`
    } else {
      detail = `${meta.label} — key configured (${AIProviderConfig.getMaskedCloudKey()}), model ${model}.`
    }

    return {
      tier: this.name,
      label: `Cloud AI (${meta.label})`,
      available:
        configured &&
        allowCloud &&
        (cloudProvider !== 'other' || Boolean(customBaseUrl && model)),
      detail,
      provider: cloudProvider,
      model,
    }
  }

  async reason({ prompt, system } = {}) {
    if (!prompt) {
      return { provider: this.name, status: 'error', response: null, detail: 'No prompt supplied.' }
    }

    const { allowCloud, cloudProvider, customBaseUrl } = AIProviderConfig.getConfig()
    const meta = getProviderMeta(cloudProvider)
    const apiKey = AIProviderConfig.getCloudApiKey()
    const model = AIProviderConfig.getCloudModel()

    if (!apiKey) {
      return {
        provider: this.name,
        status: 'unavailable',
        response: null,
        detail: `No API key configured for ${meta.label}.`,
      }
    }

    if (!allowCloud) {
      return {
        provider: this.name,
        status: 'unavailable',
        response: null,
        detail: 'Cloud escalation is switched off.',
      }
    }

    if (cloudProvider === 'other' && (!customBaseUrl || !model)) {
      return {
        provider: this.name,
        status: 'unavailable',
        response: null,
        detail: 'Other provider selected but endpoint URL or model name is missing.',
      }
    }

    const startedAt = Date.now()

    try {
      let result

      if (cloudProvider === 'anthropic') {
        result = await callAnthropic({ apiKey, model, prompt, system })
      } else if (cloudProvider === 'gemini') {
        result = await callGemini({ apiKey, model, prompt, system })
      } else if (cloudProvider === 'openai') {
        result = await callOpenAICompatible({ baseUrl: 'https://api.openai.com/v1', apiKey, model, prompt, system })
      } else {
        result = await callOpenAICompatible({ baseUrl: customBaseUrl, apiKey, model, prompt, system })
      }

      if (result.httpStatus) {
        const authFail = result.httpStatus === 401 || result.httpStatus === 403

        return {
          provider: this.name,
          status: 'error',
          response: null,
          detail: authFail
            ? `${meta.label} rejected the key (HTTP ${result.httpStatus}). Check it in the MARS Intelligence panel.`
            : `${meta.label} request failed with HTTP ${result.httpStatus}.`,
        }
      }

      if (!result.text) {
        return {
          provider: this.name,
          status: 'error',
          response: null,
          detail: `${meta.label} returned an empty response.`,
        }
      }

      return {
        provider: this.name,
        status: 'success',
        response: result.text,
        model: result.model,
        cloudProvider: cloudProvider,
        durationMs: Date.now() - startedAt,
      }
    } catch (err) {
      return {
        provider: this.name,
        status: 'error',
        response: null,
        detail:
          err?.name === 'AbortError'
            ? `${meta.label} request timed out.`
            : `${meta.label} request failed (network or CORS — note some vendors block direct browser calls; Claude and Gemini allow them).`,
      }
    }
  }

  // ---- legacy v0.9.1 capability routing (unchanged) ----

  canHandle(request) {
    if (!request) {
      return false
    }

    return request.allowCloud === true
  }

  async process(request) {
    return {
      provider: this.name,
      status: 'success',
      capability: request?.capability || 'general',
      response: 'Processed by cloud AI placeholder.',
    }
  }
}

export default new CloudProvider()
