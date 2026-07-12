/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Service:
 * NaturalConversationEngine
 *
 * Purpose:
 * Orchestrates v0.14.2 multi-turn natural conversation over the
 * existing deterministic voice layer. This service keeps voice as
 * transport and conversation as its own temporary capability layer.
 *
 * Version:
 * v0.14.2
 * Date Code:
 * 070726
 * ==========================================================
 */

import ConversationSessionService from './ConversationSessionService'
import ConversationHistoryService from './ConversationHistoryService'
import ConversationContextService from './ConversationContextService'
import ReferenceResolver from './ReferenceResolver'
import ConversationPlanner, { CONVERSATION_PLAN_ACTIONS } from './ConversationPlanner'
import ConversationDiagnosticsService from './ConversationDiagnosticsService'
import MemoryIntelligenceService from '@/services/memory/MemoryIntelligenceService'

function createConversationResponse({ message, plan, reference, context, timestamp = Date.now() }) {
  let title = 'Conversation Ready'
  let summary = 'MARS has processed the conversation turn.'
  let lines = []
  let memoryStoreActive = false
  let storedFactCount = null

  switch (plan.action) {
    case CONVERSATION_PLAN_ACTIONS.ROUTE_TO_VISION:
      title = 'Vision Conversation Request'
      summary = 'I can use the current conversation context to route this towards vision.'
      lines = ['Vision routing is planned from this conversation turn.', 'Live camera action remains controlled by the existing vision capability.']
      break
    case CONVERSATION_PLAN_ACTIONS.ROUTE_TO_MEMORY: {
      const memoryStatus = MemoryIntelligenceService.getStatus()
      memoryStoreActive = true
      storedFactCount = memoryStatus.entryCount
      title = 'Memory Intelligence Online'
      summary = storedFactCount > 0
        ? `Persistent memory is active. I currently have ${storedFactCount} stored ${storedFactCount === 1 ? 'fact' : 'facts'}.`
        : 'Persistent memory is active. I do not have anything stored yet.'
      lines = [
        'Short-term conversation context is active.',
        'Persistent memory is read here; engine-driven writes arrive in v0.15.1.',
      ]
      break
    }
    case CONVERSATION_PLAN_ACTIONS.CANCEL_ACTION:
      title = 'Conversation Action Cancelled'
      summary = 'I have cancelled the current conversational action.'
      lines = ['The conversation session remains available for the next instruction.']
      break
    case CONVERSATION_PLAN_ACTIONS.CONTINUE_PREVIOUS_ACTION:
      title = 'Continuing Previous Context'
      summary = reference?.resolvedTarget ? `I understood this as referring to ${reference.resolvedTarget}.` : 'I understood this as a follow-up to the previous action.'
      lines = ['Follow-up handling is active.', 'The persistent memory store is active from v0.15.']
      break
    case CONVERSATION_PLAN_ACTIONS.ASK_CLARIFYING_QUESTION:
      title = 'Clarification Needed'
      summary = 'Can you clarify what you want MARS to do next?'
      lines = ['The current request does not contain enough detail for a safe route.']
      break
    case CONVERSATION_PLAN_ACTIONS.ROUTE_TO_VOICE_COMMAND:
      title = 'Voice Command Routed'
      summary = 'I recognised this as a voice command and kept the conversation context active.'
      lines = ['Command routing remains handled by the existing voice command layer.']
      break
    default:
      title = 'Conversation Context Updated'
      summary = reference?.resolvedTarget ? `I understood the reference to ${reference.resolvedTarget}.` : 'I have updated the temporary conversation context.'
      lines = [message ? `Last message: ${message}` : 'No message supplied.', context?.activeTopic ? `Active topic: ${context.activeTopic}` : 'No active topic yet.']
      break
  }

  return {
    version: 'v0.14.2',
    service: 'NaturalConversationEngine',
    title,
    summary,
    lines,
    planAction: plan.action,
    capability: plan.capability,
    confidence: plan.confidence,
    naturalConversation: true,
    persistentMemory: false,
    memoryStoreActive,
    storedFactCount,
    liveAudio: false,
    medicalDiagnosis: false,
    timestamp,
  }
}

class NaturalConversationEngine {
  processTurn(message = '', options = {}) {
    const timestamp = options.timestamp || Date.now()
    const session = ConversationSessionService.getOrCreateSession({
      timestamp,
      activeTopic: options.activeTopic,
      activeIntent: options.intentResult?.intent || null,
      activeCapability: options.routeResult?.target || null,
    })

    const initialHistoryRecord = ConversationHistoryService.addExchange({
      sessionId: session.id,
      userMessage: message,
      intent: options.intentResult?.intent || null,
      capability: options.routeResult?.target || null,
      confidence: options.intentResult?.confidence || 0,
      timestamp,
    })

    const context = ConversationContextService.buildContext({
      session,
      history: ConversationHistoryService.getRecent(),
      userMessage: message,
      intentResult: options.intentResult || null,
      routeResult: options.routeResult || null,
      timestamp,
    })

    const reference = ReferenceResolver.resolve(message, context)
    const plan = ConversationPlanner.plan({
      message,
      intentResult: options.intentResult || null,
      routeResult: options.routeResult || null,
      reference,
      context,
    })

    ConversationSessionService.touchSession({
      timestamp,
      activeTopic: plan.activeTopic || context.activeTopic,
      activeIntent: options.intentResult?.intent || context.lastIntent,
      activeCapability: plan.capability,
      incrementTurn: false,
    })

    const response = createConversationResponse({ message, plan, reference, context, timestamp })
    const updatedExchange = ConversationHistoryService.updateLastAssistantResponse(response, {
      plan: plan.action,
      capability: plan.capability,
      confidence: plan.confidence,
    }) || initialHistoryRecord

    const diagnostics = ConversationDiagnosticsService.createSnapshot({
      sessionStatus: ConversationSessionService.getStatus(timestamp),
      historyStatus: ConversationHistoryService.getStatus(),
      contextStatus: ConversationContextService.getStatus(),
      reference,
      plan,
      response,
    })

    return {
      version: 'v0.14.2',
      service: 'NaturalConversationEngine',
      status: 'processed',
      session: ConversationSessionService.getSession(),
      context: ConversationContextService.getContext(),
      reference,
      plan,
      response,
      exchange: updatedExchange,
      diagnostics,
      naturalConversation: true,
      persistentMemory: false,
      liveAudio: false,
      medicalDiagnosis: false,
    }
  }

  reset() {
    ConversationSessionService.clearSession()
    ConversationHistoryService.clearHistory()
    ConversationContextService.clearContext()
    ConversationDiagnosticsService.clearSnapshot()
  }

  getStatus() {
    return {
      version: 'v0.14.2',
      service: 'NaturalConversationEngine',
      status: 'ready',
      naturalConversationEnabled: true,
      session: ConversationSessionService.getStatus(),
      history: ConversationHistoryService.getStatus(),
      context: ConversationContextService.getStatus(),
      diagnostics: ConversationDiagnosticsService.getStatus(),
      persistentMemory: false,
      liveAudio: false,
      medicalDiagnosis: false,
    }
  }
}

export default new NaturalConversationEngine()
