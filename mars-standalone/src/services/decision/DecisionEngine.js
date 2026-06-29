/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Engine:
 * DecisionEngine
 *
 * Purpose:
 * Evaluates the current context and identifies decision
 * candidates that may require further processing.
 *
 * Version:
 * v0.12.1
 *
 * Date Code:
 * 290626
 * ==========================================================
 */

import Decision from '@/models/Decision'

class DecisionEngine {
  evaluate(context = null) {
    if (!context || !context.isAvailable()) {
      return {
        status: 'not_available',
        provider: 'LOCAL_DECISION_ENGINE',
        timestamp: Date.now(),
        decisions: [],
        summary: 'No valid context available.',
      }
    }

    const decisions = []

    this.evaluatePresence(context, decisions)
    this.evaluateMovement(context, decisions)
    this.evaluateBehaviour(context, decisions)
    this.evaluateActivity(context, decisions)
    this.evaluateRisk(context, decisions)
    this.evaluatePersonalProfile(context, decisions)

    return {
      status: 'success',
      provider: 'LOCAL_DECISION_ENGINE',
      timestamp: Date.now(),
      decisionCount: decisions.length,
      decisions,
      summary:
        decisions.length === 0
          ? 'No significant decisions.'
          : `${decisions.length} decision candidate(s) identified.`,
    }
  }

  evaluatePresence(context, decisions) {
    if (!context.person.present) {
      decisions.push(
        new Decision({
          id: 'NO_PERSON_PRESENT',
          category: 'presence',
          priority: 'low',
          confidence: 100,
          description: 'No person currently visible.',
        })
      )
    }
  }

  evaluateMovement(context, decisions) {
    if (context.movement.state === 'moving') {
      decisions.push(
        new Decision({
          id: 'PERSON_MOVING',
          category: 'movement',
          priority: 'low',
          confidence: context.movement.confidence,
          description: 'Person is moving.',
        })
      )
    }

    if (
      context.behaviour.pattern === 'standing_still' &&
      context.behaviour.sampleCount > 20
    ) {
      decisions.push(
        new Decision({
          id: 'PROLONGED_STILLNESS',
          category: 'behaviour',
          priority: 'medium',
          confidence: context.behaviour.confidence,
          description: 'Person has remained stationary for an extended period.',
        })
      )
    }
  }

  evaluateBehaviour(context, decisions) {
    if (context.body.state === 'lying') {
      decisions.push(
        new Decision({
          id: 'PERSON_LYING',
          category: 'body',
          priority: 'medium',
          confidence: context.body.confidence,
          description: 'Person is lying down.',
        })
      )
    }
  }

  evaluateActivity(context, decisions) {
    if (context.activity.state && context.activity.state !== 'unknown') {
      decisions.push(
        new Decision({
          id: 'ACTIVITY_DETECTED',
          category: 'activity',
          priority: 'low',
          confidence: context.activity.confidence,
          description: `Activity detected: ${context.activity.state}.`,
        })
      )
    }
  }

  evaluateRisk(context, decisions) {
    if (context.risk.level >= 5) {
      decisions.push(
        new Decision({
          id: 'ELEVATED_RISK',
          category: 'risk',
          priority: 'high',
          confidence: context.risk.confidence,
          description: `Risk level ${context.risk.level}/10.`,
        })
      )
    }
  }

  evaluatePersonalProfile(context, decisions) {
    if (context.personal.profileActive) {
      decisions.push(
        new Decision({
          id: 'KNOWN_PERSON_PRESENT',
          category: 'identity',
          priority: 'low',
          confidence: 100,
          description: `${context.personal.displayName} recognised.`,
        })
      )
    }
  }
}

export default new DecisionEngine()