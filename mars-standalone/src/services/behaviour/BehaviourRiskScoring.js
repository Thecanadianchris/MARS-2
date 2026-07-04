/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Module:
 * BehaviourRiskScoring
 *
 * Purpose:
 * Scores behaviour observations for assistive alerting.
 *
 * This service produces concern levels for MARS decisions.
 * It does not diagnose medical conditions.
 *
 * Version:
 * v0.13.3
 *
 * Date Code:
 * 040726
 * ==========================================================
 */

import {
  BEHAVIOUR_ACTIONS,
  BEHAVIOUR_CONCERN_LEVELS,
  BODY_POSITIONS,
  HEAD_DIRECTIONS,
  MOVEMENT_STATES
} from './BehaviourProfile'

class BehaviourRiskScoring {
  score(input = {}) {
    const safeInput = input || {}
    const observations = Array.isArray(safeInput.observations)
      ? safeInput.observations
      : []
    const protectedUser = Boolean(safeInput.protectedUser)
    const inactiveDurationSeconds = Number(safeInput.inactiveDurationSeconds ?? 0)

    let score = 0
    const reasons = []

    observations.forEach((observation) => {
      if (observation.type === 'body_position') {
        if (observation.value === BODY_POSITIONS.FLOOR) {
          score += 35
          reasons.push('Person appears to be on the floor.')
        }

        if (observation.value === BODY_POSITIONS.LYING) {
          score += 25
          reasons.push('Person appears to be lying down.')
        }
      }

      if (observation.type === 'head_direction') {
        if (observation.value === HEAD_DIRECTIONS.UP_LEFT || observation.value === HEAD_DIRECTIONS.UP_RIGHT) {
          score += 25
          reasons.push('Head direction appears unusual for this observation.')
        }
      }

      if (observation.type === 'movement_state') {
        if (observation.value === MOVEMENT_STATES.FALL_DETECTED) {
          score += 45
          reasons.push('Movement observation suggests a sudden fall or drop.')
        }

        if (observation.value === MOVEMENT_STATES.UNUSUAL) {
          score += 20
          reasons.push('Movement pattern is unusual.')
        }
      }

      if (observation.type === 'possible_concern_sign') {
        score += 10
      }
    })

    if (inactiveDurationSeconds >= 180) {
      score += 25
      reasons.push('Person has been inactive for longer than the current concern threshold.')
    }

    if (protectedUser && score > 0) {
      score += 15
      reasons.push('Protected user policy increases observation priority.')
    }

    const clampedScore = Math.max(0, Math.min(100, score))
    const concernLevel = this.getConcernLevel(clampedScore)
    const recommendedAction = this.getRecommendedAction(concernLevel)

    return {
      status: 'success',
      provider: 'LOCAL_BEHAVIOUR_RISK_SCORING',
      version: 'v0.13.3',
      score: clampedScore,
      concernLevel,
      recommendedAction,
      protectedUser,
      reasons: [...new Set(reasons)],
      diagnosticStatement: this.createDiagnosticStatement(concernLevel, recommendedAction)
    }
  }

  getConcernLevel(score = 0) {
    if (score >= 70) {
      return BEHAVIOUR_CONCERN_LEVELS.HIGH
    }

    if (score >= 40) {
      return BEHAVIOUR_CONCERN_LEVELS.MEDIUM
    }

    if (score > 0) {
      return BEHAVIOUR_CONCERN_LEVELS.LOW
    }

    return BEHAVIOUR_CONCERN_LEVELS.NONE
  }

  getRecommendedAction(concernLevel) {
    if (concernLevel === BEHAVIOUR_CONCERN_LEVELS.HIGH) {
      return BEHAVIOUR_ACTIONS.NOTIFY
    }

    if (concernLevel === BEHAVIOUR_CONCERN_LEVELS.MEDIUM) {
      return BEHAVIOUR_ACTIONS.LOG
    }

    return BEHAVIOUR_ACTIONS.OBSERVE
  }

  createDiagnosticStatement(concernLevel, recommendedAction) {
    if (recommendedAction === BEHAVIOUR_ACTIONS.NOTIFY) {
      return 'Unusual behaviour observations detected. Notify an authorised user to check.'
    }

    if (concernLevel === BEHAVIOUR_CONCERN_LEVELS.MEDIUM) {
      return 'Behaviour observations differ from expected baseline. Continue monitoring.'
    }

    return 'No immediate behaviour notification required.'
  }
}

export default new BehaviourRiskScoring()
