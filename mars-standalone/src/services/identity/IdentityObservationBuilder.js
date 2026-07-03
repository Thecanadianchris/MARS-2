/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Builder:
 * IdentityObservationBuilder
 *
 * Purpose:
 * Converts identity state into neutral observations for the
 * wider MARS observation and decision layers.
 *
 * Version:
 * v0.13.0
 *
 * Date Code:
 * 030726
 * ==========================================================
 */

import {
  OBSERVATIONS,
  createObservation,
} from '@/core/observations/ObservationRegistry'
import { IDENTITY_STATES } from './IdentityTypes'

class IdentityObservationBuilder {
  build(identityResult = {}) {
    const state = identityResult.state || IDENTITY_STATES.UNKNOWN
    const confidence = identityResult.confidence || 0
    const profile = identityResult.profile || null

    const observations = []

    const observationId = this.getObservationIdForState(state)

    if (observationId) {
      observations.push(
        createObservation(observationId, confidence, {
          identityState: state,
          profileId: profile?.id || null,
          displayName: profile?.displayName || 'Unknown',
          userType: identityResult.userType || 'unknown',
          protected: Boolean(profile?.protected),
          trusted: Boolean(profile?.trusted),
        })
      )
    }

    if (profile?.protected) {
      observations.push(
        createObservation(OBSERVATIONS.IDENTITY_PROTECTED_USER, confidence, {
          profileId: profile.id,
          displayName: profile.displayName,
        })
      )
    }

    return {
      status: 'success',
      provider: 'LOCAL_IDENTITY_OBSERVATION_BUILDER',
      observationCount: observations.length,
      observations,
      ids: observations.map((observation) => observation.id),
      labels: observations.map((observation) => observation.label),
      summary: this.createSummary(state, profile),
    }
  }

  getObservationIdForState(state) {
    const observationByState = {
      [IDENTITY_STATES.NO_PERSON]: OBSERVATIONS.IDENTITY_NO_PERSON,
      [IDENTITY_STATES.DETECTED]: OBSERVATIONS.IDENTITY_PERSON_DETECTED,
      [IDENTITY_STATES.TRACKING]: OBSERVATIONS.IDENTITY_TRACKING,
      [IDENTITY_STATES.SEARCHING]: OBSERVATIONS.IDENTITY_SEARCHING,
      [IDENTITY_STATES.UNKNOWN]: OBSERVATIONS.IDENTITY_UNKNOWN,
      [IDENTITY_STATES.PENDING_PROFILE]: OBSERVATIONS.IDENTITY_PENDING_PROFILE,
      [IDENTITY_STATES.GUEST]: OBSERVATIONS.IDENTITY_GUEST,
      [IDENTITY_STATES.KNOWN]: OBSERVATIONS.IDENTITY_KNOWN,
      [IDENTITY_STATES.TRUSTED]: OBSERVATIONS.IDENTITY_TRUSTED_USER,
      [IDENTITY_STATES.PROTECTED]: OBSERVATIONS.IDENTITY_PROTECTED_USER,
      [IDENTITY_STATES.BLOCKED]: OBSERVATIONS.IDENTITY_BLOCKED,
    }

    return observationByState[state] || OBSERVATIONS.IDENTITY_UNKNOWN
  }

  createSummary(state, profile) {
    const profileName = profile?.displayName || 'Unknown person'
    return `Identity observation: ${profileName} is ${state}.`
  }
}

export default new IdentityObservationBuilder()
