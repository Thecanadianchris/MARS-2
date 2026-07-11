/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Service:
 * ChatConversationBridge
 *
 * Purpose:
 * Decides when ChatPanel should use the v0.14.2/v0.14.3 Natural
 * Conversation Engine's response instead of ChatPanel's existing
 * local reply logic (memory commands + createLocalMarsReply).
 *
 * Design intent — do not regress working behaviour:
 * ChatPanel's existing memory commands (remember/recall/clear/
 * list) and every specific canned reply in createLocalMarsReply
 * already work today and always return specific, non-generic
 * text. This bridge only steps in when local reply logic has
 * nothing specific to say and would otherwise fall through to
 * the generic "Understood... How would you like me to assist?"
 * filler — at that point the engine's genuinely new conversation
 * capabilities (cancel, confirm/continue, clarifying questions,
 * vision-flavoured phrasing) are a real improvement, not a
 * regression risk, because there was nothing specific to lose.
 *
 * The engine's memory branch is a v0.15 placeholder, not real
 * storage — it is deliberately excluded from the override set so
 * real "remember X is Y" functionality is never at risk of being
 * shadowed by this bridge (in practice it never would be, since
 * memory commands never hit the generic fallback in the first
 * place, but this keeps the intent explicit and testable).
 *
 * Version:
 * v0.14.3
 * Date Code:
 * 110726
 * ==========================================================
 */

import { CONVERSATION_PLAN_ACTIONS } from './ConversationPlanner'

export const GENERIC_FALLBACK_MARKER = 'How would you like me to assist?'

const OVERRIDE_PLAN_ACTIONS = Object.freeze([
  CONVERSATION_PLAN_ACTIONS.CANCEL_ACTION,
  CONVERSATION_PLAN_ACTIONS.CONTINUE_PREVIOUS_ACTION,
  CONVERSATION_PLAN_ACTIONS.ASK_CLARIFYING_QUESTION,
  CONVERSATION_PLAN_ACTIONS.ROUTE_TO_VISION,
])

export function isGenericFallback(reply) {
  return typeof reply === 'string' && reply.includes(GENERIC_FALLBACK_MARKER)
}

export function shouldUseConversationResponse(planAction) {
  return OVERRIDE_PLAN_ACTIONS.includes(planAction)
}

export function buildChatReply({ localReply, engineResult }) {
  if (!isGenericFallback(localReply)) {
    return localReply
  }

  const planAction = engineResult?.plan?.action
  const engineSummary = engineResult?.response?.summary

  if (engineSummary && shouldUseConversationResponse(planAction)) {
    return engineSummary
  }

  return localReply
}
