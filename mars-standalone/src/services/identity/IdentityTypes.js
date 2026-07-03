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
