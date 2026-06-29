/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Model:
 * Priority
 *
 * Purpose:
 * Defines a ranked priority item for the MARS Decision
 * Intelligence Layer.
 *
 * Version:
 * v0.12.0
 *
 * Date Code:
 * 290626
 * ==========================================================
 */

export default class Priority {
  constructor(data = {}) {
    this.id = data.id || 'UNKNOWN_PRIORITY'
    this.category = data.category || 'general'
    this.label = data.label || 'Unknown Priority'
    this.description = data.description || 'No priority description supplied.'
    this.originalPriority = data.originalPriority || 'low'
    this.score = this.clampScore(data.score ?? 0)
    this.confidence = data.confidence ?? 0
    this.factors = data.factors || {}
    this.timestamp = data.timestamp || Date.now()
    this.metadata = data.metadata || {}
  }

  clampScore(score) {
    return Math.max(0, Math.min(100, Math.round(score)))
  }

  isCritical() {
    return this.score >= 90
  }

  isHigh() {
    return this.score >= 70
  }

  isMedium() {
    return this.score >= 45
  }

  getScoreLabel() {
    if (this.score >= 90) return 'critical'
    if (this.score >= 70) return 'high'
    if (this.score >= 45) return 'medium'
    if (this.score >= 20) return 'low'

    return 'minimal'
  }
}