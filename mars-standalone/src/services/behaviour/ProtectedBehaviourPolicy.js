/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Module:
 * ProtectedBehaviourPolicy
 *
 * Purpose:
 * Applies additional observation priority rules for protected
 * users without making medical diagnoses.
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
  BEHAVIOUR_CONCERN_LEVELS
} from './BehaviourProfile'

class ProtectedBehaviourPolicy {
  evaluate(input = {}) {
    const safeInput = input || {}
    const protectedUser = Boolean(safeInput.protectedUser)
    const risk = safeInput.risk || {}

    if (!protectedUser) {
      return {
        status: 'success',
        provider: 'LOCAL_PROTECTED_BEHAVIOUR_POLICY',
        version: 'v0.13.3',
        protectedUser: false,
        priority: 'normal',
        notifyAuthorisedUser: risk.recommendedAction === BEHAVIOUR_ACTIONS.NOTIFY,
        reason: 'Standard behaviour observation policy applied.'
      }
    }

    const notifyAuthorisedUser =
      risk.recommendedAction === BEHAVIOUR_ACTIONS.NOTIFY ||
      risk.concernLevel === BEHAVIOUR_CONCERN_LEVELS.HIGH

    return {
      status: 'success',
      provider: 'LOCAL_PROTECTED_BEHAVIOUR_POLICY',
      version: 'v0.13.3',
      protectedUser: true,
      priority: risk.score >= 40 ? 'elevated' : 'watch',
      notifyAuthorisedUser,
      reason: notifyAuthorisedUser
        ? 'Protected user has unusual behaviour observations. Authorised user check recommended.'
        : 'Protected user is being monitored with elevated observation priority.'
    }
  }
}

export default new ProtectedBehaviourPolicy()
