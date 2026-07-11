/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Service:
 * AIProviderConfig
 *
 * Purpose:
 * Single source of truth for AI provider configuration.
 *
 * Cloud tier is provider-selectable (v0.14.4): Claude
 * (Anthropic), ChatGPT (OpenAI), Gemini (Google), or Other
 * (any OpenAI-compatible endpoint, entered manually). One API
 * key is stored per provider, so switching providers never
 * loses a key.
 *
 * Key storage: localStorage on this machine only — never the
 * repo, never the bundle. Optionally, a gitignored `.env.local`
 * with VITE_CLOUD_AI_KEY seeds the selected provider's key into
 * the browser store on load, so the key never needs pasting.
 * (Trade-off, recorded in the v0.14.4 manifest: an env key is
 * embedded in the served JS bundle — fine for this local-only
 * machine, not for public hosting.)
 *
 * Falls back to an in-memory store when localStorage is not
 * available (e.g. vitest's node environment).
 *
 * Version:
 * v0.14.4
 * Date Code:
 * 110726
 * ==========================================================
 */

const STORAGE_KEY = 'mars_ai_provider_config_v2'

export const CLOUD_PROVIDERS = Object.freeze([
  { id: 'anthropic', label: 'Claude (Anthropic)', defaultModel: 'claude-haiku-4-5', keyPlaceholder: 'sk-ant-…' },
  { id: 'openai', label: 'ChatGPT (OpenAI)', defaultModel: 'gpt-4o-mini', keyPlaceholder: 'sk-…' },
  { id: 'gemini', label: 'Gemini (Google)', defaultModel: 'gemini-2.0-flash', keyPlaceholder: 'AIza…' },
  { id: 'other', label: 'Other (manual endpoint)', defaultModel: '', keyPlaceholder: 'API key' },
])

export function getProviderMeta(providerId) {
  return CLOUD_PROVIDERS.find((p) => p.id === providerId) || CLOUD_PROVIDERS[0]
}

const DEFAULTS = Object.freeze({
  cloudProvider: 'anthropic',
  cloudApiKeys: {}, // one key per provider id
  cloudModels: {}, // per-provider model override; falls back to defaultModel
  customBaseUrl: '', // used only by 'other' (OpenAI-compatible)
  ollamaBaseUrl: 'http://localhost:11434',
  ollamaModel: null, // null = use first installed model reported by Ollama
  allowCloud: true,
})

function storageAvailable() {
  try {
    return typeof window !== 'undefined' && Boolean(window.localStorage)
  } catch {
    return false
  }
}

function envSeedKey() {
  try {
    return import.meta?.env?.VITE_CLOUD_AI_KEY || null
  } catch {
    return null
  }
}

class AIProviderConfig {
  constructor() {
    this.memoryStore = { ...DEFAULTS }
    this.envSeedApplied = false
  }

  getConfig() {
    let config

    if (!storageAvailable()) {
      config = { ...this.memoryStore }
    } else {
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY)
        config = raw ? { ...DEFAULTS, ...JSON.parse(raw) } : { ...DEFAULTS }
      } catch {
        config = { ...DEFAULTS }
      }
    }

    // .env.local seed: if the selected provider has no stored key but
    // VITE_CLOUD_AI_KEY is set, adopt it into the browser store once.
    const seed = envSeedKey()

    if (seed && !this.envSeedApplied && !config.cloudApiKeys?.[config.cloudProvider]) {
      config = this.setConfigInternal(config, {
        cloudApiKeys: { ...config.cloudApiKeys, [config.cloudProvider]: seed },
      })
      this.envSeedApplied = true
    }

    return config
  }

  setConfigInternal(base, partial) {
    const next = { ...base, ...partial }

    if (storageAvailable()) {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      } catch {
        // Storage full/blocked — in-memory copy keeps the session working.
      }
    }

    this.memoryStore = { ...next }
    return next
  }

  setConfig(partial = {}) {
    return this.setConfigInternal(this.getConfig(), partial)
  }

  // ---- cloud provider selection ----

  getCloudProvider() {
    return this.getConfig().cloudProvider
  }

  setCloudProvider(providerId) {
    return this.setConfig({ cloudProvider: getProviderMeta(providerId).id })
  }

  // ---- per-provider keys ----

  getCloudApiKey(providerId = null) {
    const config = this.getConfig()
    return config.cloudApiKeys?.[providerId || config.cloudProvider] || null
  }

  setCloudApiKey(key, providerId = null) {
    const config = this.getConfig()
    const id = providerId || config.cloudProvider

    return this.setConfig({ cloudApiKeys: { ...config.cloudApiKeys, [id]: key || null } })
  }

  clearCloudApiKey(providerId = null) {
    return this.setCloudApiKey(null, providerId)
  }

  hasCloudApiKey(providerId = null) {
    return Boolean(this.getCloudApiKey(providerId))
  }

  getMaskedCloudKey(providerId = null) {
    const key = this.getCloudApiKey(providerId)

    if (!key) {
      return null
    }

    return key.length > 8 ? `${key.slice(0, 7)}…${key.slice(-4)}` : '…'
  }

  // ---- per-provider models ----

  getCloudModel(providerId = null) {
    const config = this.getConfig()
    const id = providerId || config.cloudProvider

    return config.cloudModels?.[id] || getProviderMeta(id).defaultModel
  }

  setCloudModel(model, providerId = null) {
    const config = this.getConfig()
    const id = providerId || config.cloudProvider

    return this.setConfig({ cloudModels: { ...config.cloudModels, [id]: model || null } })
  }

  resetForTests() {
    this.memoryStore = { ...DEFAULTS }
    this.envSeedApplied = true // tests never want env seeding

    if (storageAvailable()) {
      try {
        window.localStorage.removeItem(STORAGE_KEY)
      } catch {
        // ignore
      }
    }
  }
}

export default new AIProviderConfig()
