/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Service:
 * BehaviourProfileMatcher
 *
 * Purpose:
 * Matches primitive behaviour observations against user-defined
 * behaviour profiles.
 *
 * Version:
 * v0.13.8
 * Date Code:
 * 040726
 * ==========================================================
 */

import BehaviourProfileRegistry from './BehaviourProfileRegistry'

function conditionMatches(allowedValues = [], value) {
  if (!allowedValues.length) return true
  return allowedValues.includes(value)
}

function contextMatches(allowedContexts = [], contexts = []) {
  if (!allowedContexts.length) return true
  return allowedContexts.some((context) => contexts.includes(context))
}

class BehaviourProfileMatcher {
  match(observation = {}, options = {}) {
    if (!observation) return null

    const contexts = Array.isArray(options.contexts) ? options.contexts : []
    const candidates = BehaviourProfileRegistry.listProfiles()
      .map((profile) => this.scoreProfile(profile, observation, contexts))
      .filter((result) => result.score > 0)
      .sort((a, b) => b.score - a.score)

    return candidates[0] || null
  }

  scoreProfile(profile, observation, contexts = []) {
    const conditions = profile.conditions || {}
    let score = 0
    let possible = 0

    if (conditions.bodyPositions?.length) {
      possible += 1
      if (conditionMatches(conditions.bodyPositions, observation.bodyPosition)) score += 1
    }

    if (conditions.headDirections?.length) {
      possible += 1
      if (conditionMatches(conditions.headDirections, observation.headDirection)) score += 1
    }

    if (conditions.movementStates?.length) {
      possible += 1
      if (conditionMatches(conditions.movementStates, observation.movementState)) score += 1
    }

    if (conditions.contexts?.length) {
      possible += 1
      if (contextMatches(conditions.contexts, contexts)) score += 1
    }

    const confidence = possible > 0 ? Math.round((score / possible) * 100) : 0

    return {
      profile,
      score,
      possible,
      confidence,
      matched: score > 0 && confidence >= 50
    }
  }
}

export default new BehaviourProfileMatcher()
