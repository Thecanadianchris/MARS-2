/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Model:
 * Recommendation
 *
 * Purpose:
 * Defines a standard action recommendation for the MARS
 * Decision Intelligence Layer.
 *
 * This model does not execute actions.
 *
 * Version:
 * v0.12.0
 *
 * Date Code:
 * 290626
 * ==========================================================
 */

export default class Recommendation {
  constructor(data = {}) {
    this.id = data.id || 'UNKNOWN_RECOMMENDATION'
    this.decisionId = data.decisionId || 'UNKNOWN_DECISION'
    this.category = data.category || 'general'
    this.label = data.label || 'No Action Required'
    this.actionType = data.actionType || 'none'
    this.executionTarget = data.executionTarget || 'none'
    this.score = data.score ?? 0
    this.confidence = data.confidence ?? 0
    this.reason = data.reason || 'No recommendation reason supplied.'
    this.requiresConfirmation = Boolean(data.requiresConfirmation)
    this.safeToAutoExecute = Boolean(data.safeToAutoExecute)
    this.message = data.message || 'No action required.'
    this.priority = data.priority || null
    this.timestamp = data.timestamp || Date.now()
    this.metadata = data.metadata || {}
  }

  canAutoExecute() {
    return this.safeToAutoExecute && !this.requiresConfirmation
  }

  targetsVoice() {
    return this.executionTarget === 'voice' || this.executionTarget === 'voice_notification'
  }

  targetsRobot() {
    return this.executionTarget === 'robot'
  }

  targetsMemory() {
    return this.executionTarget === 'memory'
  }
}