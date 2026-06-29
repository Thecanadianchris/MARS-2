/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Engine:
 * ActionRecommendationEngine
 *
 * Purpose:
 * Converts prioritised decisions into recommended actions.
 *
 * This engine does NOT execute actions.
 *
 * Version:
 * v0.12.1
 *
 * Date Code:
 * 290626
 * ==========================================================
 */

import Recommendation from '@/models/Recommendation'

class ActionRecommendationEngine {
  evaluate(priorityResult = null, context = null) {
    if (!priorityResult || priorityResult.status !== 'success') {
      return this.createEmptyResult('No valid priorities available.')
    }

    const recommendations = priorityResult.priorities.map((priority) =>
      this.createRecommendation(priority, context)
    )

    return {
      status: 'success',
      provider: 'LOCAL_ACTION_RECOMMENDATION_ENGINE',
      timestamp: Date.now(),
      recommendationCount: recommendations.length,
      highestRecommendation: recommendations[0] || null,
      recommendations,
      summary:
        recommendations.length === 0
          ? 'No action recommendations.'
          : `Top recommendation: ${recommendations[0].label}.`,
    }
  }

  createRecommendation(priority, context) {
    const action = this.selectAction(priority, context)

    return new Recommendation({
      id: `ACTION_${priority.id}`,
      decisionId: priority.id,
      category: priority.category,
      label: action.label,
      actionType: action.actionType,
      executionTarget: action.executionTarget,
      score: priority.score,
      confidence: priority.confidence,
      reason: priority.description,
      requiresConfirmation: action.requiresConfirmation,
      safeToAutoExecute: action.safeToAutoExecute,
      message: action.message,
      priority,
    })
  }

  selectAction(priority, context) {
    if (priority.score >= 90) {
      return {
        label: 'Request Immediate Attention',
        actionType: 'request_attention',
        executionTarget: 'voice_notification',
        requiresConfirmation: false,
        safeToAutoExecute: true,
        message: this.createMessage(priority, context),
      }
    }

    if (priority.score >= 70) {
      return {
        label: 'Ask If Assistance Is Needed',
        actionType: 'ask_assistance',
        executionTarget: 'voice',
        requiresConfirmation: false,
        safeToAutoExecute: true,
        message: this.createMessage(priority, context),
      }
    }

    if (priority.score >= 45) {
      return {
        label: 'Continue Monitoring Closely',
        actionType: 'monitor_closely',
        executionTarget: 'vision',
        requiresConfirmation: false,
        safeToAutoExecute: true,
        message: this.createMessage(priority, context),
      }
    }

    if (priority.score >= 20) {
      return {
        label: 'Record Observation',
        actionType: 'record_observation',
        executionTarget: 'memory',
        requiresConfirmation: false,
        safeToAutoExecute: true,
        message: this.createMessage(priority, context),
      }
    }

    return {
      label: 'No Action Required',
      actionType: 'none',
      executionTarget: 'none',
      requiresConfirmation: false,
      safeToAutoExecute: true,
      message: 'No action required.',
    }
  }

  createMessage(priority, context) {
    const personName = context?.personal?.profileActive
      ? context.personal.displayName
      : 'A person'

    switch (priority.id) {
      case 'ELEVATED_RISK':
        return `${personName} may need attention. Risk level is elevated.`

      case 'PERSON_LYING':
        return `${personName} is lying down. Continue monitoring and check if assistance is needed.`

      case 'PROLONGED_STILLNESS':
        return `${personName} has been still for an extended period.`

      case 'PERSON_MOVING':
        return `${personName} is moving.`

      case 'KNOWN_PERSON_PRESENT':
        return `${personName} is present.`

      case 'ACTIVITY_DETECTED':
        return priority.description || `${personName} activity detected.`

      case 'NO_PERSON_PRESENT':
        return 'No person is currently visible.'

      default:
        return priority.description || 'Observation requires attention.'
    }
  }

  createEmptyResult(summary) {
    return {
      status: 'not_available',
      provider: 'LOCAL_ACTION_RECOMMENDATION_ENGINE',
      timestamp: Date.now(),
      recommendationCount: 0,
      highestRecommendation: null,
      recommendations: [],
      summary,
    }
  }
}

export default new ActionRecommendationEngine()