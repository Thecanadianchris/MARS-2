/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Service:
 * ConversationHistoryService
 *
 * Purpose:
 * Stores temporary rolling conversation exchanges for the
 * v0.14.2 Natural Conversation Engine. This is session context,
 * not persistent user memory.
 *
 * Version:
 * v0.14.2
 * Date Code:
 * 070726
 * ==========================================================
 */

class ConversationHistoryService {
  constructor() {
    this.history = []
    this.maxHistory = 20
  }

  addExchange(exchange = {}) {
    const timestamp = exchange.timestamp || Date.now()
    const record = {
      id: exchange.id || `exchange-${timestamp}-${this.history.length + 1}`,
      sessionId: exchange.sessionId || null,
      userMessage: exchange.userMessage || '',
      assistantResponse: exchange.assistantResponse || null,
      intent: exchange.intent || null,
      capability: exchange.capability || null,
      plan: exchange.plan || null,
      confidence: typeof exchange.confidence === 'number' ? exchange.confidence : 0,
      timestamp,
      version: 'v0.14.2',
    }

    this.history = [record, ...this.history].slice(0, this.maxHistory)
    return { ...record }
  }

  updateLastAssistantResponse(response, options = {}) {
    if (this.history.length === 0) {
      return null
    }

    const updated = {
      ...this.history[0],
      assistantResponse: response,
      plan: options.plan ?? this.history[0].plan,
      capability: options.capability ?? this.history[0].capability,
      confidence: typeof options.confidence === 'number' ? options.confidence : this.history[0].confidence,
    }

    this.history = [updated, ...this.history.slice(1)]
    return { ...updated }
  }

  getHistory() {
    return this.history.map((item) => ({ ...item }))
  }

  getRecent(limit = this.maxHistory) {
    return this.getHistory().slice(0, limit)
  }

  getLastExchange() {
    return this.history[0] ? { ...this.history[0] } : null
  }

  clearHistory() {
    this.history = []
  }

  getStatus() {
    const lastExchange = this.getLastExchange()

    return {
      version: 'v0.14.2',
      service: 'ConversationHistoryService',
      status: 'ready',
      historySize: this.history.length,
      maxHistory: this.maxHistory,
      lastIntent: lastExchange?.intent || null,
      lastCapability: lastExchange?.capability || null,
      persistentMemory: false,
    }
  }
}

export default new ConversationHistoryService()
