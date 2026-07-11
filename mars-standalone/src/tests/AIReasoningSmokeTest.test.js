/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Smoke Test:
 * AIReasoningSmokeTest
 *
 * Purpose:
 * Validates the v0.14.4 AI Reasoning Layer: honest Local stub,
 * real HomeProvider (Ollama) and CloudProvider (Claude) clients
 * against a mocked fetch, and the Local → Home → Cloud
 * escalation router with its honest trail.
 *
 * Version:
 * v0.14.4
 * Date Code:
 * 110726
 * ==========================================================
 */

import { describe, expect, test, beforeEach, afterEach, vi } from 'vitest'
import AIProviderConfig from '../services/ai/AIProviderConfig'
import LocalProvider from '../services/ai/LocalProvider'
import HomeProvider from '../services/ai/HomeProvider'
import CloudProvider from '../services/ai/CloudProvider'
import AIReasoningService, { MARS_REASONING_SYSTEM_PROMPT } from '../services/ai/AIReasoningService'

const OLLAMA_TAGS_URL = 'http://localhost:11434/api/tags'
const OLLAMA_GENERATE_URL = 'http://localhost:11434/api/generate'
const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages'

function jsonResponse(body, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  }
}

function mockFetchByUrl(handlers) {
  return vi.fn(async (url, options = {}) => {
    for (const [match, handler] of Object.entries(handlers)) {
      if (String(url).startsWith(match)) {
        return handler(url, options)
      }
    }

    throw new Error(`Unexpected fetch: ${url}`)
  })
}

beforeEach(() => {
  AIProviderConfig.resetForTests()
  HomeProvider.resetProbeCache()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('AI Reasoning Smoke Test (v0.14.4)', () => {
  test('LocalProvider is an honest stub: unavailable for reasoning until the Android build', async () => {
    expect(LocalProvider.reasoningAvailable()).toBe(false)
    expect(LocalProvider.getReasoningStatus().available).toBe(false)

    const result = await LocalProvider.reason({ prompt: 'what time is it' })
    expect(result.status).toBe('unavailable')
    expect(result.response).toBeNull()
  })

  test('HomeProvider probe reports reachable Ollama with installed models', async () => {
    vi.stubGlobal(
      'fetch',
      mockFetchByUrl({
        [OLLAMA_TAGS_URL]: () => jsonResponse({ models: [{ name: 'qwen3.5:4b' }, { name: 'gemma3:4b' }] }),
      })
    )

    const probe = await HomeProvider.probe({ force: true })
    expect(probe.reachable).toBe(true)
    expect(probe.models).toEqual(['qwen3.5:4b', 'gemma3:4b'])
    expect(HomeProvider.resolveModel(probe.models)).toBe('qwen3.5:4b')
  })

  test('HomeProvider probe is honest when Ollama is not running', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => {
      throw new Error('ECONNREFUSED')
    }))

    const probe = await HomeProvider.probe({ force: true })
    expect(probe.reachable).toBe(false)
    expect(probe.models).toEqual([])
  })

  test('HomeProvider reason returns a real Ollama response', async () => {
    vi.stubGlobal(
      'fetch',
      mockFetchByUrl({
        [OLLAMA_TAGS_URL]: () => jsonResponse({ models: [{ name: 'qwen3.5:4b' }] }),
        [OLLAMA_GENERATE_URL]: (url, options) => {
          const body = JSON.parse(options.body)
          expect(body.model).toBe('qwen3.5:4b')
          expect(body.stream).toBe(false)
          return jsonResponse({ response: 'It is currently 3 PM, Christian.' })
        },
      })
    )

    const result = await HomeProvider.reason({ prompt: 'what time is it', system: 'sys' })
    expect(result.status).toBe('success')
    expect(result.provider).toBe('HOME_AI_SERVER')
    expect(result.response).toBe('It is currently 3 PM, Christian.')
    expect(result.model).toBe('qwen3.5:4b')
  })

  test('REGRESSION GUARD: CloudProvider never calls the network without a configured key', async () => {
    const fetchSpy = vi.fn()
    vi.stubGlobal('fetch', fetchSpy)

    const result = await CloudProvider.reason({ prompt: 'hello' })
    expect(result.status).toBe('unavailable')
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  test('CloudProvider calls the Claude API with the correct headers and parses the reply', async () => {
    AIProviderConfig.setCloudApiKey('sk-ant-test-key-1234', 'anthropic')

    vi.stubGlobal(
      'fetch',
      mockFetchByUrl({
        [ANTHROPIC_URL]: (url, options) => {
          expect(options.headers['x-api-key']).toBe('sk-ant-test-key-1234')
          expect(options.headers['anthropic-version']).toBe('2023-06-01')
          expect(options.headers['anthropic-dangerous-direct-browser-access']).toBe('true')

          const body = JSON.parse(options.body)
          expect(body.messages).toEqual([{ role: 'user', content: 'hello' }])

          return jsonResponse({
            model: 'claude-haiku-4-5',
            content: [{ type: 'text', text: 'MARS cloud reasoning is online.' }],
          })
        },
      })
    )

    const result = await CloudProvider.reason({ prompt: 'hello', system: MARS_REASONING_SYSTEM_PROMPT })
    expect(result.status).toBe('success')
    expect(result.provider).toBe('CLOUD_AI')
    expect(result.response).toBe('MARS cloud reasoning is online.')
  })

  test('CloudProvider reports an invalid key honestly (401)', async () => {
    AIProviderConfig.setCloudApiKey('sk-ant-bad-key', 'anthropic')

    vi.stubGlobal(
      'fetch',
      mockFetchByUrl({
        [ANTHROPIC_URL]: () => jsonResponse({}, 401),
      })
    )

    const result = await CloudProvider.reason({ prompt: 'hello' })
    expect(result.status).toBe('error')
    expect(result.detail).toContain('401')
  })

  test('CloudProvider respects the allowCloud switch', async () => {
    AIProviderConfig.setCloudApiKey('sk-ant-test-key', 'anthropic')
    AIProviderConfig.setConfig({ allowCloud: false })

    const fetchSpy = vi.fn()
    vi.stubGlobal('fetch', fetchSpy)

    const result = await CloudProvider.reason({ prompt: 'hello' })
    expect(result.status).toBe('unavailable')
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  test('router answers from the Home tier when Ollama is available, with an honest trail', async () => {
    vi.stubGlobal(
      'fetch',
      mockFetchByUrl({
        [OLLAMA_TAGS_URL]: () => jsonResponse({ models: [{ name: 'qwen3.5:4b' }] }),
        [OLLAMA_GENERATE_URL]: () => jsonResponse({ response: 'Answered locally on the base station.' }),
      })
    )

    const result = await AIReasoningService.reason({ prompt: 'easy question' })
    expect(result.provider).toBe('HOME_AI_SERVER')
    expect(result.status).toBe('success')
    expect(result.trail.map((s) => s.tier)).toEqual(['LOCAL_DEVICE', 'HOME_AI_SERVER'])
    expect(result.trail[0].outcome).toBe('unavailable')
  })

  test('router escalates to Cloud when Home is down and a key is configured', async () => {
    AIProviderConfig.setCloudApiKey('sk-ant-test-key', 'anthropic')

    vi.stubGlobal(
      'fetch',
      mockFetchByUrl({
        [OLLAMA_TAGS_URL]: () => {
          throw new Error('ECONNREFUSED')
        },
        [ANTHROPIC_URL]: () =>
          jsonResponse({ content: [{ type: 'text', text: 'Claude answered after escalation.' }] }),
      })
    )

    const result = await AIReasoningService.reason({ prompt: 'hard question' })
    expect(result.provider).toBe('CLOUD_AI')
    expect(result.status).toBe('success')
    expect(result.trail.map((s) => s.tier)).toEqual(['LOCAL_DEVICE', 'HOME_AI_SERVER', 'CLOUD_AI'])
    expect(result.trail[1].outcome).toBe('unavailable')
  })

  test('CloudProvider dispatches to OpenAI with Bearer auth and parses choices', async () => {
    AIProviderConfig.setCloudProvider('openai')
    AIProviderConfig.setCloudApiKey('sk-openai-test', 'openai')

    vi.stubGlobal(
      'fetch',
      mockFetchByUrl({
        'https://api.openai.com/v1/chat/completions': (url, options) => {
          expect(options.headers.Authorization).toBe('Bearer sk-openai-test')
          const body = JSON.parse(options.body)
          expect(body.messages.at(-1)).toEqual({ role: 'user', content: 'hello' })
          return jsonResponse({ model: 'gpt-4o-mini', choices: [{ message: { content: 'OpenAI reply.' } }] })
        },
      })
    )

    const result = await CloudProvider.reason({ prompt: 'hello', system: 'sys' })
    expect(result.status).toBe('success')
    expect(result.response).toBe('OpenAI reply.')
    expect(result.cloudProvider).toBe('openai')
  })

  test('CloudProvider dispatches to Gemini and parses candidates', async () => {
    AIProviderConfig.setCloudProvider('gemini')
    AIProviderConfig.setCloudApiKey('AIza-test-key', 'gemini')

    vi.stubGlobal(
      'fetch',
      mockFetchByUrl({
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent': () =>
          jsonResponse({ candidates: [{ content: { parts: [{ text: 'Gemini reply.' }] } }] }),
      })
    )

    const result = await CloudProvider.reason({ prompt: 'hello' })
    expect(result.status).toBe('success')
    expect(result.response).toBe('Gemini reply.')
    expect(result.cloudProvider).toBe('gemini')
  })

  test('CloudProvider "other" requires endpoint + model, then dispatches OpenAI-compatible', async () => {
    AIProviderConfig.setCloudProvider('other')
    AIProviderConfig.setCloudApiKey('custom-key', 'other')

    // Missing endpoint/model → honestly unavailable, no network call.
    const fetchSpy = vi.fn()
    vi.stubGlobal('fetch', fetchSpy)
    const blocked = await CloudProvider.reason({ prompt: 'hello' })
    expect(blocked.status).toBe('unavailable')
    expect(fetchSpy).not.toHaveBeenCalled()

    AIProviderConfig.setConfig({ customBaseUrl: 'https://my-llm.local/v1' })
    AIProviderConfig.setCloudModel('my-model', 'other')

    vi.stubGlobal(
      'fetch',
      mockFetchByUrl({
        'https://my-llm.local/v1/chat/completions': (url, options) => {
          expect(JSON.parse(options.body).model).toBe('my-model')
          return jsonResponse({ choices: [{ message: { content: 'Custom endpoint reply.' } }] })
        },
      })
    )

    const result = await CloudProvider.reason({ prompt: 'hello' })
    expect(result.status).toBe('success')
    expect(result.response).toBe('Custom endpoint reply.')
  })

  test('per-provider keys survive switching providers', () => {
    AIProviderConfig.setCloudApiKey('sk-ant-abc', 'anthropic')
    AIProviderConfig.setCloudApiKey('sk-oai-def', 'openai')

    AIProviderConfig.setCloudProvider('openai')
    expect(AIProviderConfig.getCloudApiKey()).toBe('sk-oai-def')

    AIProviderConfig.setCloudProvider('anthropic')
    expect(AIProviderConfig.getCloudApiKey()).toBe('sk-ant-abc')
  })

  test('router is honest when no tier can answer', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => {
      throw new Error('ECONNREFUSED')
    }))

    const result = await AIReasoningService.reason({ prompt: 'anything' })
    expect(result.provider).toBe('NONE')
    expect(result.status).toBe('unavailable')
    expect(result.response).toBeNull()
    expect(result.trail).toHaveLength(3)
  })

  test('probeAll returns one honest status per tier', async () => {
    vi.stubGlobal(
      'fetch',
      mockFetchByUrl({
        [OLLAMA_TAGS_URL]: () => jsonResponse({ models: [] }),
      })
    )

    const snapshot = await AIReasoningService.probeAll()
    expect(snapshot.tiers).toHaveLength(3)

    const [local, home, cloud] = snapshot.tiers
    expect(local.tier).toBe('LOCAL_DEVICE')
    expect(local.available).toBe(false)
    expect(home.tier).toBe('HOME_AI_SERVER')
    expect(home.available).toBe(false) // reachable but no models installed
    expect(cloud.tier).toBe('CLOUD_AI')
    expect(cloud.available).toBe(false) // no key configured
  })
})
