/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Model:
 * DecisionContext
 *
 * Purpose:
 * Defines the standard context object used by the MARS
 * Decision Intelligence Layer.
 *
 * Version:
 * v0.12.0
 *
 * Date Code:
 * 290626
 * ==========================================================
 */

export default class DecisionContext {
  constructor(data = {}) {
    this.status = data.status || 'not_available'
    this.provider = data.provider || 'LOCAL_CONTEXT_ENGINE'
    this.timestamp = data.timestamp || Date.now()

    this.source = data.source || {}
    this.person = data.person || {}
    this.body = data.body || {}
    this.movement = data.movement || {}
    this.behaviour = data.behaviour || {}
    this.activity = data.activity || {}
    this.face = data.face || {}
    this.personal = data.personal || {}
    this.risk = data.risk || {}
    this.observations = data.observations || {}

    this.summary = data.summary || 'No context summary available.'
  }

  isAvailable() {
    return this.status === 'success'
  }

  hasPersonPresent() {
    return Boolean(this.person?.present)
  }

  getRiskLevel() {
    return this.risk?.level || 0
  }

  getSummary() {
    return this.summary
  }
}