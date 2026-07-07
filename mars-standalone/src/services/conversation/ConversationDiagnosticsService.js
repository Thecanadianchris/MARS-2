/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Service:
 * ConversationDiagnosticsService
 *
 * Purpose:
 * Provides UI/test friendly diagnostics for v0.14.2 Natural
 * Conversation Engine without coupling diagnostics to UI panels.
 *
 * Version:
 * v0.14.2
 * Date Code:
 * 070726
 * ==========================================================
 */

class ConversationDiagnosticsService {
  constructor() {
    this.lastSnapshot = null
  }

  createSnapshot({ sessionStatus = {}, historyStatus = {}, contextStatus = {}, reference = null, plan = null, response = null } = {}) {
    const snapshot = {
      version: 'v0.14.2',
      service: 'ConversationDiagnosticsService',
      status: 'ready',
      conversationActive: Boolean(sessionStatus.conversationActive),
      sessionId: sessionStatus.sessionId || null,
      sessionExpired: Boolean(sessionStatus.sessionExpired),
      historySize: historyStatus.historySize || 0,
      activeTopic: sessionStatus.activeTopic || contextStatus.activeTopic || null,
      currentSubject: contextStatus.currentSubject || null,
      lastIntent: sessionStatus.activeIntent || contextStatus.lastIntent || null,
      lastCapability: sessionStatus.activeCapability || contextStatus.lastCapability || plan?.capability || null,
      lastResolvedReference: reference?.resolvedTarget || null,
      lastReferenceType: reference?.referenceType || 'none',
      lastPlan: plan?.action || null,
      lastConfidence: plan?.confidence ?? reference?.confidence ?? 0,
      lastResponseTitle: response?.title || null,
      persistentMemory: false,
      liveAudio: false,
      medicalDiagnosis: false,
      timestamp: Date.now(),
    }

    this.lastSnapshot = snapshot
    return { ...snapshot }
  }

  getLastSnapshot() {
    return this.lastSnapshot ? { ...this.lastSnapshot } : null
  }

  clearSnapshot() {
    this.lastSnapshot = null
  }

  getStatus() {
    return this.lastSnapshot || {
      version: 'v0.14.2',
      service: 'ConversationDiagnosticsService',
      status: 'ready',
      conversationActive: false,
      historySize: 0,
      persistentMemory: false,
      liveAudio: false,
      medicalDiagnosis: false,
    }
  }
}

export default new ConversationDiagnosticsService()
