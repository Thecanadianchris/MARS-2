/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Service:
 * ConversationContextService
 *
 * Purpose:
 * Builds short-lived session context for multi-turn conversation.
 * It tracks recent subject, person, place, intent and capability
 * without writing persistent memory.
 *
 * Version:
 * v0.14.2
 * Date Code:
 * 070726
 * ==========================================================
 */

function inferSubjectFromText(text = '') {
  const normalised = text.toLowerCase()

  if (normalised.includes('christian')) return 'Christian'
  if (normalised.includes('finley')) return 'Finley'
  if (normalised.includes('mars')) return 'MARS'
  if (normalised.includes('room')) return 'room'
  if (normalised.includes('kitchen')) return 'kitchen'
  if (normalised.includes('protected user')) return 'protected user'

  return null
}

function inferLocationFromText(text = '') {
  const normalised = text.toLowerCase()

  if (normalised.includes('kitchen')) return 'kitchen'
  if (normalised.includes('room')) return 'room'
  if (normalised.includes('hall')) return 'hall'
  if (normalised.includes('living room')) return 'living room'

  return null
}

class ConversationContextService {
  constructor() {
    this.context = this.createEmptyContext()
  }

  createEmptyContext() {
    return {
      version: 'v0.14.2',
      currentSubject: null,
      currentPerson: null,
      currentLocation: null,
      activeTopic: null,
      lastUserMessage: null,
      lastMarsResponse: null,
      lastIntent: null,
      lastCapability: null,
      lastPlan: null,
      lastUpdatedAt: null,
      persistentMemory: false,
    }
  }

  buildContext({ session = null, history = [], userMessage = '', intentResult = null, routeResult = null, plan = null, timestamp = Date.now() } = {}) {
    const lastExchange = history[0] || null
    const inferredSubject = inferSubjectFromText(userMessage) || inferSubjectFromText(lastExchange?.assistantResponse?.summary || '')
    const inferredLocation = inferLocationFromText(userMessage) || inferLocationFromText(lastExchange?.assistantResponse?.summary || '')

    this.context = {
      ...this.context,
      currentSubject: inferredSubject || this.context.currentSubject,
      currentPerson: ['Christian', 'Finley'].includes(inferredSubject) ? inferredSubject : this.context.currentPerson,
      currentLocation: inferredLocation || this.context.currentLocation,
      activeTopic: session?.activeTopic || this.context.activeTopic || inferredSubject || inferredLocation,
      lastUserMessage: userMessage || this.context.lastUserMessage,
      lastMarsResponse: lastExchange?.assistantResponse || this.context.lastMarsResponse,
      lastIntent: intentResult?.intent || lastExchange?.intent || this.context.lastIntent,
      lastCapability: routeResult?.target || lastExchange?.capability || this.context.lastCapability,
      lastPlan: plan?.action || lastExchange?.plan || this.context.lastPlan,
      lastUpdatedAt: timestamp,
    }

    return { ...this.context }
  }

  updateContext(partialContext = {}) {
    this.context = {
      ...this.context,
      ...partialContext,
      lastUpdatedAt: partialContext.lastUpdatedAt || Date.now(),
    }

    return { ...this.context }
  }

  getContext() {
    return { ...this.context }
  }

  clearContext() {
    this.context = this.createEmptyContext()
  }

  getStatus() {
    return {
      version: 'v0.14.2',
      service: 'ConversationContextService',
      status: 'ready',
      currentSubject: this.context.currentSubject,
      currentPerson: this.context.currentPerson,
      currentLocation: this.context.currentLocation,
      activeTopic: this.context.activeTopic,
      lastIntent: this.context.lastIntent,
      lastCapability: this.context.lastCapability,
      persistentMemory: false,
    }
  }
}

export default new ConversationContextService()
