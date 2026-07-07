/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Service:
 * ConversationSessionService
 *
 * Purpose:
 * Manages temporary Natural Conversation Engine sessions for
 * v0.14.2. Conversation sessions are short-lived, contextual
 * and deliberately separate from future long-term memory.
 *
 * Version:
 * v0.14.2
 * Date Code:
 * 070726
 * ==========================================================
 */

export const CONVERSATION_SESSION_STATUS = Object.freeze({
  ACTIVE: 'active',
  CREATED: 'created',
  EXPIRED: 'expired',
  ENDED: 'ended',
  IDLE: 'idle',
})

const DEFAULT_TIMEOUT_MS = 5 * 60 * 1000

function createSessionId(timestamp = Date.now()) {
  return `conversation-${timestamp}`
}

class ConversationSessionService {
  constructor() {
    this.activeSession = null
    this.timeoutMs = DEFAULT_TIMEOUT_MS
  }

  startSession(options = {}) {
    const timestamp = options.timestamp || Date.now()
    const session = {
      id: options.id || createSessionId(timestamp),
      status: CONVERSATION_SESSION_STATUS.ACTIVE,
      createdStatus: CONVERSATION_SESSION_STATUS.CREATED,
      startedAt: timestamp,
      lastInteractionAt: timestamp,
      activeTopic: options.activeTopic || null,
      activeIntent: options.activeIntent || null,
      activeCapability: options.activeCapability || null,
      turnCount: 0,
      timeoutMs: options.timeoutMs || this.timeoutMs,
      endedAt: null,
      metadata: options.metadata || {},
      version: 'v0.14.2',
    }

    this.activeSession = session
    return { ...session }
  }

  getOrCreateSession(options = {}) {
    const timestamp = options.timestamp || Date.now()

    if (!this.activeSession || this.isExpired(timestamp)) {
      return this.startSession(options)
    }

    return this.touchSession(options)
  }

  touchSession(options = {}) {
    if (!this.activeSession) {
      return this.startSession(options)
    }

    const timestamp = options.timestamp || Date.now()
    this.activeSession = {
      ...this.activeSession,
      status: CONVERSATION_SESSION_STATUS.ACTIVE,
      lastInteractionAt: timestamp,
      activeTopic: options.activeTopic ?? this.activeSession.activeTopic,
      activeIntent: options.activeIntent ?? this.activeSession.activeIntent,
      activeCapability: options.activeCapability ?? this.activeSession.activeCapability,
      turnCount: options.incrementTurn === false ? this.activeSession.turnCount : this.activeSession.turnCount + 1,
    }

    return { ...this.activeSession }
  }

  isExpired(timestamp = Date.now()) {
    if (!this.activeSession) {
      return true
    }

    return timestamp - this.activeSession.lastInteractionAt > this.activeSession.timeoutMs
  }

  endSession(options = {}) {
    if (!this.activeSession) {
      return null
    }

    const timestamp = options.timestamp || Date.now()
    this.activeSession = {
      ...this.activeSession,
      status: CONVERSATION_SESSION_STATUS.ENDED,
      endedAt: timestamp,
    }

    return { ...this.activeSession }
  }

  clearSession() {
    this.activeSession = null
  }

  getSession() {
    return this.activeSession ? { ...this.activeSession } : null
  }

  getStatus(timestamp = Date.now()) {
    return {
      version: 'v0.14.2',
      service: 'ConversationSessionService',
      status: this.activeSession ? this.activeSession.status : CONVERSATION_SESSION_STATUS.IDLE,
      conversationActive: Boolean(this.activeSession && !this.isExpired(timestamp) && this.activeSession.status === CONVERSATION_SESSION_STATUS.ACTIVE),
      sessionExpired: this.activeSession ? this.isExpired(timestamp) : false,
      sessionId: this.activeSession?.id || null,
      activeTopic: this.activeSession?.activeTopic || null,
      activeIntent: this.activeSession?.activeIntent || null,
      activeCapability: this.activeSession?.activeCapability || null,
      turnCount: this.activeSession?.turnCount || 0,
      timeoutMs: this.activeSession?.timeoutMs || this.timeoutMs,
      lastInteractionAt: this.activeSession?.lastInteractionAt || null,
    }
  }
}

export default new ConversationSessionService()
