/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Service:
 * DecisionIntelligenceService
 *
 * Purpose:
 * Orchestrates the MARS Decision Intelligence Layer.
 *
 * It converts Vision Pipeline output into:
 * - Context
 * - Decisions
 * - Priorities
 * - Action Recommendations
 *
 * This service does NOT execute actions.
 *
 * Version:
 * v0.12.0
 *
 * Date Code:
 * 290626
 * ==========================================================
 */

import ContextEngine from './ContextEngine'
import DecisionEngine from './DecisionEngine'
import PriorityEngine from './PriorityEngine'
import ActionRecommendationEngine from './ActionRecommendationEngine'

class DecisionIntelligenceService {
  evaluate(pipelineResult = null) {
    const context = ContextEngine.evaluate(pipelineResult)
    const decisionResult = DecisionEngine.evaluate(context)
    const priorityResult = PriorityEngine.evaluate(decisionResult, context)
    const recommendationResult = ActionRecommendationEngine.evaluate(
      priorityResult,
      context
    )

    return {
      status: this.deriveStatus({
        context,
        decisionResult,
        priorityResult,
        recommendationResult,
      }),
      provider: 'LOCAL_DECISION_INTELLIGENCE_SERVICE',
      version: 'v0.12.0',
      timestamp: Date.now(),

      context,
      decisionResult,
      priorityResult,
      recommendationResult,

      summary: this.createSummary({
        context,
        decisionResult,
        priorityResult,
        recommendationResult,
      }),
    }
  }

  deriveStatus({
    context,
    decisionResult,
    priorityResult,
    recommendationResult,
  }) {
    if (context?.status !== 'success') {
      return 'not_available'
    }

    if (decisionResult?.status !== 'success') {
      return 'decision_unavailable'
    }

    if (priorityResult?.status !== 'success') {
      return 'priority_unavailable'
    }

    if (recommendationResult?.status !== 'success') {
      return 'recommendation_unavailable'
    }

    return 'success'
  }

  createSummary({
    context,
    decisionResult,
    priorityResult,
    recommendationResult,
  }) {
    if (context?.status !== 'success') {
      return 'Decision Intelligence unavailable. No valid context was produced.'
    }

    const decisionCount = decisionResult?.decisionCount || 0
    const priorityCount = priorityResult?.priorityCount || 0
    const recommendationCount = recommendationResult?.recommendationCount || 0

    const topPriority = priorityResult?.highestPriority
    const topRecommendation = recommendationResult?.highestRecommendation

    if (!topPriority || !topRecommendation) {
      return `Decision Intelligence complete. ${decisionCount} decision(s), ${priorityCount} priority item(s), ${recommendationCount} recommendation(s). No action currently required.`
    }

    return `Decision Intelligence complete. Top priority: ${topPriority.label} (${topPriority.score}/100). Recommended action: ${topRecommendation.label}.`
  }
}

export default new DecisionIntelligenceService()