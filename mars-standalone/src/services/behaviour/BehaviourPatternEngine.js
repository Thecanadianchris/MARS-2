/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Engine:
 * BehaviourPatternEngine
 *
 * Purpose:
 * Coordinates MARS Behaviour Intelligence Foundation.
 *
 * The engine observes body position, head direction, movement,
 * inactivity and protected-user behaviour signals. It produces
 * assistive concern levels for the Decision Engine and
 * Notification Manager.
 *
 * This engine never diagnoses. It only evaluates observations.
 *
 * Version:
 * v0.13.3
 *
 * Date Code:
 * 040726
 * ==========================================================
 */

import BehaviourObservationBuilder from './BehaviourObservationBuilder'
import BehaviourProfile from './BehaviourProfile'
import BehaviourRiskScoring from './BehaviourRiskScoring'
import ProtectedBehaviourPolicy from './ProtectedBehaviourPolicy'

class BehaviourPatternEngine {
  evaluate(input = {}) {
    const safeInput = input || {}
    const identityResult = safeInput.identityResult || {}
    const behaviourProfile = this.resolveBehaviourProfile(safeInput)

    const observationStream = BehaviourObservationBuilder.build({
      perceptionResult: safeInput.perceptionResult,
      identityResult,
      options: safeInput.options
    })

    const risk = BehaviourRiskScoring.score({
      observations: observationStream.observations,
      inactiveDurationSeconds: observationStream.inactiveDurationSeconds,
      protectedUser: behaviourProfile.protectedUser
    })

    const protectedPolicy = ProtectedBehaviourPolicy.evaluate({
      protectedUser: behaviourProfile.protectedUser,
      risk
    })

    const behaviourRecord = behaviourProfile.addObservation({
      timestamp: observationStream.timestamp,
      bodyPosition: observationStream.bodyPosition,
      headDirection: observationStream.headDirection,
      movementState: observationStream.movementState,
      confidence: this.resolveConfidence(observationStream.observations),
      concernLevel: risk.concernLevel,
      notes: risk.reasons
    })

    return {
      status: 'success',
      provider: 'LOCAL_BEHAVIOUR_PATTERN_ENGINE',
      version: 'v0.13.3',
      timestamp: observationStream.timestamp,
      profile: behaviourProfile.toJSON(),
      currentObservation: behaviourRecord,
      observationStream,
      risk,
      protectedPolicy,
      decisionHint: {
        concernLevel: risk.concernLevel,
        recommendedAction: risk.recommendedAction,
        notifyAuthorisedUser: protectedPolicy.notifyAuthorisedUser,
        reason: protectedPolicy.reason
      },
      summary: this.createSummary(observationStream, risk, protectedPolicy)
    }
  }

  resolveBehaviourProfile(input = {}) {
    const safeInput = input || {}

    if (safeInput.behaviourProfile instanceof BehaviourProfile) {
      return safeInput.behaviourProfile
    }

    const identityResult = safeInput.identityResult || {}
    const profile = identityResult.profile || safeInput.userProfile || {}

    return BehaviourProfile.create({
      profileId: profile.id || identityResult.profileId || 'unknown-behaviour-profile',
      personId: profile.id || identityResult.profileId || 'unknown-person',
      displayName: profile.displayName || identityResult.displayName || 'Unknown person',
      protectedUser: Boolean(profile.protected || identityResult.protected || safeInput.protectedUser),
      baseline: safeInput.baseline
    })
  }

  resolveConfidence(observations = []) {
    if (!observations.length) {
      return 0
    }

    const total = observations.reduce((sum, observation) => sum + Number(observation.confidence || 0), 0)
    return Math.max(0, Math.min(1, total / observations.length))
  }

  createSummary(observationStream, risk, protectedPolicy) {
    return [
      `Behaviour Intelligence: body=${observationStream.bodyPosition}`,
      `head=${observationStream.headDirection}`,
      `movement=${observationStream.movementState}`,
      `concern=${risk.concernLevel}`,
      `action=${risk.recommendedAction}`,
      protectedPolicy.notifyAuthorisedUser ? 'authorised-user-check-recommended' : 'continue-monitoring'
    ].join(' | ')
  }
}

export default new BehaviourPatternEngine()
