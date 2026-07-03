/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Engine:
 * IdentityStateMachine
 *
 * Purpose:
 * Converts neutral perception and profile information into a
 * stable identity state. The state machine does not recognise
 * faces itself and never promotes an unknown person to trusted.
 *
 * Version:
 * v0.13.0
 *
 * Date Code:
 * 030726
 * ==========================================================
 */

import {
  IDENTITY_CONFIDENCE,
  IDENTITY_STATES,
  IDENTITY_USER_TYPES,
} from './IdentityTypes'

class IdentityStateMachine {
  evaluate(input = {}) {
    const personPresent = Boolean(input.personPresent)
    const faceDetected = Boolean(input.faceDetected)
    const matchedProfile = input.matchedProfile || null
    const pendingProfile = input.pendingProfile || null
    const guest = Boolean(input.guest)

    if (!personPresent) {
      return this.createState({
        state: IDENTITY_STATES.NO_PERSON,
        confidence: IDENTITY_CONFIDENCE.NONE,
        reason: 'No person is currently visible.',
      })
    }

    if (!faceDetected) {
      return this.createState({
        state: IDENTITY_STATES.TRACKING,
        confidence: IDENTITY_CONFIDENCE.TRACKING,
        reason: 'Person is present but face recognition evidence is not available.',
      })
    }

    if (matchedProfile?.blocked) {
      return this.createState({
        state: IDENTITY_STATES.BLOCKED,
        confidence: IDENTITY_CONFIDENCE.BLOCKED,
        reason: 'Matched profile is blocked.',
      })
    }

    if (matchedProfile?.protected) {
      return this.createState({
        state: IDENTITY_STATES.PROTECTED,
        confidence: IDENTITY_CONFIDENCE.PROTECTED,
        reason: 'Matched profile is a protected user.',
      })
    }

    if (matchedProfile?.trusted) {
      return this.createState({
        state: IDENTITY_STATES.TRUSTED,
        confidence: IDENTITY_CONFIDENCE.TRUSTED,
        reason: 'Matched profile is a trusted user.',
      })
    }

    if (matchedProfile) {
      return this.createState({
        state: IDENTITY_STATES.KNOWN,
        confidence: IDENTITY_CONFIDENCE.KNOWN,
        reason: 'Known profile matched but not trusted.',
      })
    }

    if (pendingProfile) {
      return this.createState({
        state: IDENTITY_STATES.PENDING_PROFILE,
        confidence: IDENTITY_CONFIDENCE.PENDING,
        reason: 'Possible identity requires trusted user confirmation.',
      })
    }

    if (guest) {
      return this.createState({
        state: IDENTITY_STATES.GUEST,
        confidence: IDENTITY_CONFIDENCE.GUEST,
        reason: 'Person is recorded as a guest.',
      })
    }

    return this.createState({
      state: IDENTITY_STATES.UNKNOWN,
      confidence: IDENTITY_CONFIDENCE.UNKNOWN,
      reason:
        'Person and face are visible, but no confirmed identity profile has been matched.',
    })
  }

  getUserTypeForState(state, profile = null) {
    if (profile?.userType) return profile.userType

    const userTypeByState = {
      [IDENTITY_STATES.TRUSTED]: IDENTITY_USER_TYPES.TRUSTED_USER,
      [IDENTITY_STATES.PROTECTED]: IDENTITY_USER_TYPES.PROTECTED_USER,
      [IDENTITY_STATES.GUEST]: IDENTITY_USER_TYPES.GUEST,
      [IDENTITY_STATES.UNKNOWN]: IDENTITY_USER_TYPES.UNKNOWN,
      [IDENTITY_STATES.PENDING_PROFILE]: IDENTITY_USER_TYPES.UNKNOWN,
      [IDENTITY_STATES.BLOCKED]: IDENTITY_USER_TYPES.BLOCKED,
    }

    return userTypeByState[state] || IDENTITY_USER_TYPES.UNKNOWN
  }

  createState({ state, confidence, reason }) {
    return {
      status: 'success',
      state,
      confidence,
      reason,
      timestamp: Date.now(),
    }
  }
}

export default new IdentityStateMachine()
