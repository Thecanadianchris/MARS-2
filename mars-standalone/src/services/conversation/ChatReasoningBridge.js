/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Service:
 * ChatReasoningBridge
 *
 * Purpose:
 * The v0.14.4 escalation step for chat, layered AFTER the
 * v0.14.3 ChatConversationBridge. If — and only if — the reply
 * that comes out of buildChatReply is still the generic
 * "How would you like me to assist?" fallback, this bridge asks
 * the AIReasoningService (Local → Home → Cloud) for a real
 * answer.
 *
 * Same structural regression guarantee as v0.14.3: memory
 * commands, canned replies, and engine-overridden replies never
 * contain the generic marker, so they can never be escalated,
 * shadowed, or sent to any AI provider. Only turns where MARS
 * literally had nothing specific to say are escalated.
 *
 * If every AI tier is unavailable, the original generic reply
 * is returned unchanged — chat never breaks because a model is
 * offline.
 *
 * Version:
 * v0.14.4
 * Date Code:
 * 110726
 * ==========================================================
 */

import AIReasoningService from '@/services/ai/AIReasoningService'
import { isGenericFallback } from './ChatConversationBridge'

export function shouldEscalateToReasoning(reply) {
  return isGenericFallback(reply)
}

export async function buildReasonedChatReply({
  bridgedReply,
  content,
  reasoningService = AIReasoningService,
} = {}) {
  if (!shouldEscalateToReasoning(bridgedReply)) {
    return { reply: bridgedReply, escalated: false, provider: null, model: null }
  }

  try {
    const result = await reasoningService.reason({ prompt: content })

    if (result?.status === 'success' && typeof result.response === 'string' && result.response.trim()) {
      return {
        reply: result.response.trim(),
        escalated: true,
        provider: result.provider || null,
        model: result.model || null,
      }
    }
  } catch {
    // Fall through to the original reply — escalation must never break chat.
  }

  return { reply: bridgedReply, escalated: false, provider: null, model: null }
}
