/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Model:
 * Decision
 *
 * Purpose:
 * Defines a standard decision candidate for the MARS
 * Decision Intelligence Layer.
 *
 * Version:
 * v0.12.0
 *
 * Date Code:
 * 290626
 * ==========================================================
 */

export default class Decision {
  constructor(data = {}) {
    this.id = data.id || 'UNKNOWN_DECISION'
    this.category = data.category || 'general'
    this.priority = data.priority || 'low'
    this.confidence = data.confidence ?? 0
    this.description = data.description || 'No decision description supplied.'
    this.timestamp = data.timestamp || Date.now()
    this.metadata = data.metadata || {}
  }

  isHighPriority() {
    return this.priority === 'high' || this.priority === 'critical'
  }

  isCritical() {
    return this.priority === 'critical'
  }

  getConfidencePercent() {
    return Math.max(0, Math.min(100, Math.round(this.confidence)))
  }
}