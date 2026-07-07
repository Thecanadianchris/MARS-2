/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Service:
 * ConversationPlanner
 *
 * Purpose:
 * Produces a deterministic next-step plan for v0.14.2 natural
 * conversation. It does not execute hardware, diagnose medical
 * conditions or write persistent memory.
 *
 * Version:
 * v0.14.2
 * Date Code:
 * 070726
 * ==========================================================
 */

export const CONVERSATION_PLAN_ACTIONS = Object.freeze({
  ANSWER_NOW: 'answer_now',
  ASK_CLARIFYING_QUESTION: 'ask_clarifying_question',
  ROUTE_TO_VOICE_COMMAND: 'route_to_voice_command',
  ROUTE_TO_VISION: 'route_to_vision',
  ROUTE_TO_MEMORY: 'route_to_memory',
  CANCEL_ACTION: 'cancel_action',
  CONTINUE_PREVIOUS_ACTION: 'continue_previous_action',
})

class ConversationPlanner {
  plan({ message = '', intentResult = null, routeResult = null, reference = null, context = {} } = {}) {
    const normalised = String(message).toLowerCase().trim()

    if (reference?.referenceType === 'cancellation' || intentResult?.intent === 'CANCEL_COMMAND') {
      return this.createPlan(CONVERSATION_PLAN_ACTIONS.CANCEL_ACTION, 'voice', 0.95, 'Cancel the current conversation action.', context)
    }

    if (reference?.referenceType === 'confirmation') {
      return this.createPlan(CONVERSATION_PLAN_ACTIONS.CONTINUE_PREVIOUS_ACTION, context.lastCapability || 'voice', 0.82, 'Continue the previous conversational action.', context)
    }

    if (reference?.referenceType === 'repeat') {
      return this.createPlan(CONVERSATION_PLAN_ACTIONS.CONTINUE_PREVIOUS_ACTION, context.lastCapability || routeResult?.target || 'voice', 0.78, 'Repeat or continue the previous action.', context)
    }

    if (normalised.includes('who') || normalised.includes('see') || normalised.includes('look') || normalised.includes('doing')) {
      return this.createPlan(CONVERSATION_PLAN_ACTIONS.ROUTE_TO_VISION, 'vision', 0.78, 'Route conversational request to the vision capability.', context)
    }

    if (normalised.includes('remember') || normalised.includes('memory')) {
      return this.createPlan(CONVERSATION_PLAN_ACTIONS.ROUTE_TO_MEMORY, 'memory', 0.62, 'Memory is planned for v0.15; answer with current limitation.', context)
    }

    if (intentResult?.intent && intentResult.intent !== 'UNKNOWN_VOICE_INTENT') {
      return this.createPlan(CONVERSATION_PLAN_ACTIONS.ROUTE_TO_VOICE_COMMAND, routeResult?.target || 'voice', intentResult.confidence || 0.7, 'Route recognised voice intent through existing command routing.', context)
    }

    if (normalised.length < 3 || reference?.confidence < 0.5) {
      return this.createPlan(CONVERSATION_PLAN_ACTIONS.ASK_CLARIFYING_QUESTION, 'conversation', 0.55, 'Ask for clarification because the request is incomplete.', context)
    }

    return this.createPlan(CONVERSATION_PLAN_ACTIONS.ANSWER_NOW, 'conversation', 0.68, 'Answer using current conversation context.', context)
  }

  createPlan(action, capability, confidence, summary, context = {}) {
    return {
      version: 'v0.14.2',
      service: 'ConversationPlanner',
      action,
      capability,
      confidence,
      summary,
      activeTopic: context.activeTopic || context.currentSubject || null,
      requiresPersistentMemory: false,
      executesHardware: false,
      medicalDiagnosis: false,
      timestamp: Date.now(),
    }
  }

  getStatus() {
    return {
      version: 'v0.14.2',
      service: 'ConversationPlanner',
      status: 'ready',
      actions: Object.values(CONVERSATION_PLAN_ACTIONS),
      medicalDiagnosis: false,
    }
  }
}

export default new ConversationPlanner()
