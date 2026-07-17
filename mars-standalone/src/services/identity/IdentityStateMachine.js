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
 * v0.16.11: this used to return generic TRACKING the instant
 * `faceDetected` was false, discarding any matchedProfile entirely —
 * exactly the bug Christian's Identity Lock request exposed: if a
 * protected user's face becomes unavailable (turned away, occluded, a
 * fall), the safety-relevant "who this is" information was thrown
 * away right when it mattered most. Now that gate only fires when
 * there's ALSO no matchedProfile — a matchedProfile can arrive from a
 * held IdentityLockService lock (see RecognitionCandidate's
 * identityHeld) as well as from a live face match, so this needed no
 * new plumbing beyond loosening the early return. `identityHeld` is
 * threaded through purely so the reason string is honest about
 * whether this frame actually reconfirmed the person or is carrying
 * the identity from a prior lock.
 *
 * Version:
 * v0.16.11
 *
 * Date Code:
 * 160726
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
    // v0.16.11: true when matchedProfile arrived from a held
    // IdentityLockService lock rather than this frame's own live face
    // match — see RecognitionCandidate.identityHeld.
    const identityHeld = Boolean(input.identityHeld)
    const heldNote = identityHeld
      ? ' Tracking held through a face-visibility gap — not reconfirmed by this frame’s own face evidence.'
      : ''

    if (!personPresent) {
      return this.createState({
        state: IDENTITY_STATES.NO_PERSON,
        confidence: IDENTITY_CONFIDENCE.NONE,
        reason: 'No person is currently visible.',
      })
    }

    if (!faceDetected && !matchedProfile) {
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
        reason: `Matched profile is blocked.${heldNote}`,
      })
    }

    if (matchedProfile?.protected) {
      return this.createState({
        state: IDENTITY_STATES.PROTECTED,
        confidence: IDENTITY_CONFIDENCE.PROTECTED,
        reason: `Matched profile is a protected user.${heldNote}`,
      })
    }

    if (matchedProfile?.trusted) {
      return this.createState({
        state: IDENTITY_STATES.TRUSTED,
        confidence: IDENTITY_CONFIDENCE.TRUSTED,
        reason: `Matched profile is a trusted user.${heldNote}`,
      })
    }

    if (matchedProfile) {
      return this.createState({
        state: IDENTITY_STATES.KNOWN,
        confidence: IDENTITY_CONFIDENCE.KNOWN,
        reason: `Known profile matched but not trusted.${heldNote}`,
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

    if (input.attemptingRecognition) {
      return this.createState({
        state: IDENTITY_STATES.SEARCHING,
        confidence: IDENTITY_CONFIDENCE.SEARCHING,
        reason: 'Face detected; comparing against known profiles.',
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
