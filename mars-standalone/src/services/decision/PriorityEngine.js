/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Engine:
 * PriorityEngine
 *
 * Purpose:
 * Converts decision candidates into ranked priority items.
 *
 * Version:
 * v0.12.1
 *
 * Date Code:
 * 290626
 * ==========================================================
 */

import Priority from '@/models/Priority'

class PriorityEngine {
  evaluate(decisionResult = null, context = null) {
    if (!decisionResult || decisionResult.status !== 'success') {
      return {
        status: 'not_available',
        provider: 'LOCAL_PRIORITY_ENGINE',
        timestamp: Date.now(),
        priorities: [],
        highestPriority: null,
        summary: 'No valid decisions available.',
      }
    }

    const priorities = decisionResult.decisions
      .map((decision) => this.scoreDecision(decision, context))
      .sort((a, b) => b.score - a.score)

    return {
      status: 'success',
      provider: 'LOCAL_PRIORITY_ENGINE',
      timestamp: Date.now(),
      priorityCount: priorities.length,
      highestPriority: priorities[0] || null,
      priorities,
      summary:
        priorities.length === 0
          ? 'No priority items.'
          : `Highest priority: ${priorities[0].label} (${priorities[0].score}/100).`,
    }
  }

  scoreDecision(decision, context) {
    const baseScore = this.getBaseScore(decision.priority)
    const confidenceScore = this.getConfidenceAdjustment(decision.confidence)
    const riskScore = this.getRiskAdjustment(context)
    const personalScore = this.getPersonalAdjustment(context)
    const finalScore = this.clampScore(
      baseScore + confidenceScore + riskScore + personalScore
    )

    return new Priority({
      id: decision.id,
      category: decision.category,
      label: this.createLabel(decision),
      description: decision.description,
      originalPriority: decision.priority,
      score: finalScore,
      confidence: decision.confidence ?? 0,
      factors: {
        baseScore,
        confidenceScore,
        riskScore,
        personalScore,
      },
    })
  }

  getBaseScore(priority) {
    switch (priority) {
      case 'critical':
        return 90
      case 'high':
        return 70
      case 'medium':
        return 45
      case 'low':
        return 20
      default:
        return 10
    }
  }

  getConfidenceAdjustment(confidence = 0) {
    if (confidence >= 90) return 10
    if (confidence >= 70) return 5
    if (confidence >= 50) return 0
    if (confidence >= 25) return -5
    return -10
  }

  getRiskAdjustment(context) {
    const riskLevel = context?.risk?.level || 0

    if (riskLevel >= 8) return 20
    if (riskLevel >= 5) return 12
    if (riskLevel >= 3) return 5

    return 0
  }

  getPersonalAdjustment(context) {
    if (!context?.personal?.profileActive) {
      return 0
    }

    if (context.personal.highestPriority === 'critical') {
      return 20
    }

    if (context.personal.highestPriority === 'high') {
      return 12
    }

    if (context.personal.highestPriority === 'medium') {
      return 6
    }

    return 2
  }

  createLabel(decision) {
    return decision.id
      .toLowerCase()
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  clampScore(score) {
    return Math.max(0, Math.min(100, Math.round(score)))
  }
}

export default new PriorityEngine()