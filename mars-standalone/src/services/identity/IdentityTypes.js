/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Module:
 * IdentityTypes
 *
 * Purpose:
 * Defines stable identity constants for the MARS Identity
 * Foundation. Identity answers who a detected person may be.
 * It does not grant permissions, make decisions or diagnose.
 *
 * Version:
 * v0.13.0
 *
 * Date Code:
 * 030726
 * ==========================================================
 */

export const IDENTITY_STATES = Object.freeze({
  NO_PERSON: 'no_person',
  DETECTED: 'detected',
  TRACKING: 'tracking',
  SEARCHING: 'searching',
  UNKNOWN: 'unknown',
  PENDING_PROFILE: 'pending_profile',
  GUEST: 'guest',
  KNOWN: 'known',
  TRUSTED: 'trusted',
  PROTECTED: 'protected',
  BLOCKED: 'blocked',
})

export const IDENTITY_USER_TYPES = Object.freeze({
  OWNER: 'owner',
  ADMINISTRATOR: 'administrator',
  TRUSTED_USER: 'trusted_user',
  PROTECTED_USER: 'protected_user',
  GUEST: 'guest',
  UNKNOWN: 'unknown',
  BLOCKED: 'blocked',
})

export const IDENTITY_CONFIDENCE = Object.freeze({
  NONE: 0,
  DETECTED: 20,
  TRACKING: 35,
  SEARCHING: 45,
  UNKNOWN: 50,
  PENDING: 55,
  GUEST: 60,
  KNOWN: 75,
  TRUSTED: 85,
  PROTECTED: 90,
  BLOCKED: 95,
})

// v0.16: how many consecutive frames a face is given to be matched
// before the state machine gives up and reports UNKNOWN instead of
// SEARCHING. Keeps a brief glance from immediately reading as
// "unknown person" in the UI.
export const IDENTITY_RECOGNITION_PATIENCE_FRAMES = 3

// v0.16: minimum face-match confidence (RecognitionCandidate's
// identityConfidence) required before MemoryIntelligenceService.
// setActivePerson() is allowed to fire. Deliberately higher than
// RecognitionCandidate's own 0.75 "recognised" threshold — a
// recognised candidate is enough to resolve a KNOWN/TRUSTED state,
// but switching the whole memory system's active person is a
// higher-stakes action and gets a higher bar, especially since it
// must never happen on a weak match onto a protected profile.
export const IDENTITY_ACTIVE_PERSON_CONFIDENCE_THRESHOLD = 0.85

export const IDENTITY_EVENTS = Object.freeze({
  PERSON_NOT_VISIBLE: 'person_not_visible',
  PERSON_DETECTED: 'person_detected',
  FACE_VISIBLE: 'face_visible',
  PROFILE_MATCHED: 'profile_matched',
  PROFILE_NOT_MATCHED: 'profile_not_matched',
  PROFILE_PENDING: 'profile_pending',
  PROFILE_CONFIRMED: 'profile_confirmed',
  PROFILE_REJECTED: 'profile_rejected',
})
