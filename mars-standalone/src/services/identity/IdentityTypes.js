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

// v0.16.11: Identity Lock. Christian's motivating case: if a
// protected user (e.g. Finley) collapses — a seizure, a fall — their
// face may no longer be visible or detectable (turned away, occluded,
// lying down). Without a lock, IdentityStateMachine drops straight to
// generic "person present, unknown who" the instant faceDetected goes
// false, discarding exactly the identity information a safety
// notification most needs. A lock changes this: once a face match
// sustains IDENTITY_LOCK_ACQUIRE_CONFIDENCE_THRESHOLD for
// IDENTITY_LOCK_ACQUIRE_CONSECUTIVE_FRAMES consecutive frames on the
// same tracked person, MARS keeps reporting that identity through
// frames where the face becomes unavailable, as long as the
// underlying track (person-presence evidence) stays alive. The lock
// only releases if a DIFFERENT profile is confidently matched on the
// same track (IDENTITY_LOCK_OVERRIDE_CONFIDENCE_THRESHOLD — a real
// person swap) or the track itself expires (the person actually
// left). See IdentityLockService.
//
// Calibration history (16 July 2026, live-testing with Christian):
// tried 0.9, then 0.8, then 0.75 — all still failed to acquire
// reliably. Direct instrumentation of the real live pipeline (reading
// LivePipelineStore mid-session) found why: it was never really a
// threshold-tuning problem. FaceEmbeddingEngine's distance-to-
// confidence formula was linear and badly compressed — Christian's
// own face against his own enrolled samples (a genuinely good match,
// Euclidean distance ≈ 0.27, comfortably inside the 0.6 accept
// boundary) was only producing ~55% confidence, because a linear
// scale only awards 90%+ to near-identical descriptors that ordinary
// live pose/lighting variation never produces. Every threshold in
// this file was being measured against a scale that couldn't reach
// them. Fixed at the source: FaceEmbeddingEngine.distanceToConfidence
// now uses a logistic curve (see its header) that gives a genuinely
// good match a genuinely high number — Christian's real 0.27-distance
// match now reads ~90%, not 55%.
//
// With the scale actually fixed, this threshold was first restored to
// a real "high percentage" bar (0.9) rather than lowered to work
// around a broken measurement — honoring what was actually asked for:
// "once its id'd someone at a high percentage can it lock in."
//
// Tuning update (17 July 2026, live-testing with Christian): even with
// the scale fixed, 0.9 made the lock "not happen quick enough or not
// at all" in ordinary live conditions — real confidence for a
// genuinely good match jitters in the ~0.84-0.91 range frame to frame
// (lighting, pose, blur), so 0.9 was clearing only on the better
// frames rather than reliably. Christian: "the lock needs to happen a
// bit lower than 90%." Lowered to 0.85 — still a real "high
// percentage" bar (matches IDENTITY_CONFIDENCE.TRUSTED, the same 85
// already used elsewhere as "confidently known"), just calibrated to
// where genuine matches actually land in practice rather than the
// occasional best-case frame. Ordinary frame-to-frame jitter is
// handled separately: IdentityLockService's consecutive-frame counter
// decrements by one on a sub-threshold frame instead of hard-resetting
// to zero, so an isolated weak frame (a blink, a flicker of motion
// blur) doesn't discard otherwise-good progress. A sustained run of
// weak evidence still fails to accumulate — this only forgives noise,
// not a genuinely poor match.
export const IDENTITY_LOCK_ACQUIRE_CONFIDENCE_THRESHOLD = 0.85
export const IDENTITY_LOCK_ACQUIRE_CONSECUTIVE_FRAMES = 3

// Bar a DIFFERENT profile must clear on the same track to override an
// existing lock. Set to the same 0.75 "recognised" bar used elsewhere
// so a lock never gets bumped by a weak/noisy secondary match, only a
// genuinely confident one.
export const IDENTITY_LOCK_OVERRIDE_CONFIDENCE_THRESHOLD = 0.75

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
