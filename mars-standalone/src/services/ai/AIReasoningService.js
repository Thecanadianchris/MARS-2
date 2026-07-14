/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Service:
 * AIReasoningService
 *
 * Purpose:
 * The v0.14.4 AI Reasoning Layer escalation router. Implements
 * the MARS "Local AI First" principle with real providers:
 *
 *   1. LOCAL_DEVICE  — on-device LLM on the S22 (honest stub
 *                      until the Android build, v0.20.x)
 *   2. HOME_AI_SERVER — Ollama on the base station laptop
 *   3. CLOUD_AI       — multi-provider cloud (Claude, ChatGPT,
 *                       Gemini or a custom OpenAI-compatible
 *                       endpoint), only when lower tiers cannot
 *                       answer and cloud is allowed
 *
 * Every call returns an honest escalation trail recording which
 * tiers were tried and why each was skipped or failed — the
 * diagnostics panel and tests rely on this, no silent fallbacks.
 *
 * Safety boundary: the shared system prompt reasserts the
 * project's non-medical framing at the model level, consistent
 * with the medicalDiagnosis:false flag carried on every
 * NaturalConversationEngine response.
 *
 * Version:
 * v0.14.4
 * Date Code:
 * 110726
 * ==========================================================
 */

import LocalProvider from './LocalProvider'
import HomeProvider from './HomeProvider'
import CloudProvider from './CloudProvider'
import AIProviderConfig from './AIProviderConfig'

export const MARS_REASONING_SYSTEM_PROMPT =
  'You are MARS, a non-medical assistive robot companion. ' +
  'Answer concisely in one to three sentences, in a natural spoken style suitable for text-to-speech. ' +
  'Never provide medical diagnosis or medical advice — if asked, say that is outside what MARS is allowed to do. ' +
  "Address the user as Christian when it feels natural."

class AIReasoningService {
  async reason({ prompt, system = MARS_REASONING_SYSTEM_PROMPT, personalContext = null } = {}) {
    const trail = []

    if (!prompt || !prompt.trim()) {
      return { provider: 'NONE', status: 'error', response: null, trail, detail: 'No prompt supplied.' }
    }

    // v0.15.4: per-tier system prompt. Personal context is injected for the
    // on-prem tiers only; the cloud tier receives the base system prompt with
    // no personal context (on-prem-only privacy posture). Passing no
    // personalContext leaves behaviour identical to v0.14.4.
    const systemFor = (contextKey) => {
      const context = personalContext ? personalContext[contextKey] : null
      return context ? `${system}\n\n${context}` : system
    }

    // Tier 1 — Local device (S22). Honest stub until v0.20.x.
    const localResult = await LocalProvider.reason({ prompt, system: systemFor('onPrem') })
    trail.push({ tier: LocalProvider.name, outcome: localResult.status, detail: localResult.detail || null })

    if (localResult.status === 'success') {
      return { ...localResult, trail }
    }

    // Tier 2 — Home AI server (Ollama on the base station).
    const homeResult = await HomeProvider.reason({ prompt, system: systemFor('onPrem') })
    trail.push({ tier: HomeProvider.name, outcome: homeResult.status, detail: homeResult.detail || null })

    if (homeResult.status === 'success') {
      return { ...homeResult, trail }
    }

    // Tier 3 — Cloud AI (Claude), last resort. No personal context (cloud key).
    const cloudResult = await CloudProvider.reason({ prompt, system: systemFor('cloud') })
    trail.push({ tier: CloudProvider.name, outcome: cloudResult.status, detail: cloudResult.detail || null })

    if (cloudResult.status === 'success') {
      return { ...cloudResult, trail }
    }

    return {
      provider: 'NONE',
      status: 'unavailable',
      response: null,
      trail,
      detail: 'No AI tier could answer — Local is a stub until v0.20.x, and Home/Cloud were unavailable or failed.',
    }
  }

  async probeAll() {
    const [local, home] = await Promise.all([
      Promise.resolve(LocalProvider.getReasoningStatus()),
      HomeProvider.getReasoningStatus(),
    ])

    const cloud = CloudProvider.getReasoningStatus()

    return {
      tiers: [local, home, cloud],
      config: {
        allowCloud: AIProviderConfig.getConfig().allowCloud,
        cloudProvider: AIProviderConfig.getCloudProvider(),
        cloudModel: AIProviderConfig.getCloudModel(),
        ollamaBaseUrl: AIProviderConfig.getConfig().ollamaBaseUrl,
      },
    }
  }
}

export default new AIReasoningService()
