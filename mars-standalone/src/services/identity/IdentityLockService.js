/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Service:
 * IdentityLockService
 *
 * Purpose:
 * v0.16.11 Identity Lock. Christian: "once its id'd someone at a high
 * percentage can it lock in and track... if finley has a sezure and
 * is on the floor face id will not recognize him as a seizure could
 * be missed but if it has a lock on it will continue to recognise
 * the person on the floor without face id."
 *
 * Before this service, MARS re-decided identity fresh on every single
 * frame (see FaceRecognitionService/IdentityTrackingService) — there
 * was no memory of "this tracked person is Finley" beyond the current
 * frame's own face match. The instant a face became unavailable
 * (turned away, occluded, the person lying down), IdentityStateMachine
 * fell straight back to a generic "person present, unknown who" state,
 * discarding exactly the identity a safety notification needs most.
 *
 * This service is a small, pure, synchronous per-trackingId state
 * machine sitting between IdentityTrackingService's frame-by-frame
 * face match and the RecognitionCandidate it builds:
 *
 *   - LOCKING: a person is confidently matched (>=
 *     IDENTITY_LOCK_ACQUIRE_CONFIDENCE_THRESHOLD) but hasn't yet
 *     sustained that across IDENTITY_LOCK_ACQUIRE_CONSECUTIVE_FRAMES
 *     consecutive frames. One lucky frame never locks anything.
 *   - LOCKED: the lock has been acquired. Reports personId with
 *     `held: false` on frames that still have live corroborating face
 *     evidence, and `held: true` (confidence frozen at the
 *     acquisition threshold) on frames where the face isn't visible
 *     or quality-gated out — this is the actual payoff: identity
 *     survives a loss of face evidence.
 *   - Released back to NONE only when either (a) a DIFFERENT profile
 *     clears IDENTITY_LOCK_OVERRIDE_CONFIDENCE_THRESHOLD on the same
 *     track (treated as a real person swap — safety-first, a lock is
 *     never allowed to keep misattributing once better evidence for
 *     someone else shows up), or (b) the caller explicitly clears the
 *     track (IdentityTrackingService does this when the underlying
 *     track itself expires — the person is actually gone, tracked via
 *     the existing TRACKING_TIMEOUT_MS person-presence timeout, which
 *     is independent of face visibility since it's driven by
 *     PoseDetectionService, not the face model).
 *
 * Calibration note (live testing, 16 July 2026, Christian): the
 * acquire threshold went 0.9 → 0.8 → 0.75 across three rounds of
 * live testing that all still failed to acquire — turned out not to
 * be a threshold problem at all. Direct instrumentation of the real
 * pipeline found FaceEmbeddingEngine's old linear distance-to-
 * confidence formula was compressing genuinely good matches down to
 * ~55%, nowhere near any of those thresholds. Fixed at the source
 * (see FaceEmbeddingEngine's header) rather than papered over here —
 * the acquire threshold is back to a real 0.9 "high percentage" bar,
 * now actually reachable by a genuinely good match. What DID stay
 * from the threshold-tuning attempts: the consecutive-frame counter
 * decrements on a weak frame instead of resetting to zero, so
 * ordinary per-frame jitter in a live match doesn't discard an
 * otherwise-good streak — that part was a real robustness improvement
 * independent of the confidence-scale bug.
 *
 * Known, deliberate limitation: this locks onto whichever personId is
 * associated with a *trackingId*, and trackingId continuity itself is
 * a simple single-active-track heuractic (see IdentityTrackingService),
 * not real spatial re-identification (no bounding-box IoU matching
 * across people). If the tracked person leaves and a *different*
 * unenrolled or not-clearly-visible person takes their place within
 * the same track's timeout window, the lock could keep reporting the
 * old identity until a confident rival match appears. This is an
 * accepted trade-off consistent with the rest of MARS's current
 * single-primary-person architecture, not a new one introduced here —
 * flagged in the engineering backlog, not hidden.
 *
 * Version:
 * v0.16.11
 *
 * Date Code:
 * 160726
 * ==========================================================
 */

import {
  IDENTITY_LOCK_ACQUIRE_CONFIDENCE_THRESHOLD,
  IDENTITY_LOCK_ACQUIRE_CONSECUTIVE_FRAMES,
  IDENTITY_LOCK_OVERRIDE_CONFIDENCE_THRESHOLD,
} from './IdentityTypes'

const LOCK_STATES = Object.freeze({
  NONE: 'none',
  LOCKING: 'locking',
  LOCKED: 'locked',
})

class IdentityLockService {
  constructor() {
    this.locks = new Map()
  }

  /**
   * Per-frame update for a tracked person. `candidateProfiles` is the
   * CURRENT frame's own live face-match result (FaceRecognitionService
   * .recognise().candidateProfiles) — empty when no face is visible or
   * quality-gated out, regardless of any existing lock. Never throws.
   *
   * Returns { locked, personId, held, confidence, lockState,
   * framesToAcquire } — `held` is only meaningful when `locked` is
   * true, and means "this frame had no live corroborating evidence for
   * the locked person, the identity is being carried from the lock."
   */
  update({ trackingId, candidateProfiles = [], timestamp = Date.now() } = {}) {
    if (!trackingId) {
      return this.emptyResult()
    }

    const topCandidate = Array.isArray(candidateProfiles) ? candidateProfiles[0] || null : null
    const record = this.locks.get(trackingId) || this.createRecord(trackingId)
    const priorLockedPersonId = record.lockState === LOCK_STATES.LOCKED ? record.personId : null

    // Did THIS frame carry live evidence confidently confirming the
    // person we were already locked to (before any update below)?
    // Anything less — no candidate, a different person, or a candidate
    // for the same person too weak to clear the override bar — counts
    // as "no live corroboration," which is exactly the held/carried
    // case this service exists for.
    const liveConfirmationOfPriorLock = Boolean(
      priorLockedPersonId &&
        topCandidate &&
        topCandidate.profileId === priorLockedPersonId &&
        topCandidate.confidence >= IDENTITY_LOCK_OVERRIDE_CONFIDENCE_THRESHOLD
    )

    if (topCandidate && topCandidate.confidence >= IDENTITY_LOCK_ACQUIRE_CONFIDENCE_THRESHOLD) {
      const isSamePerson = record.personId === topCandidate.profileId

      if (!isSamePerson) {
        // Either nothing was building yet, or a DIFFERENT profile just
        // cleared the bar on the same track (a genuine person swap,
        // including replacing an existing LOCKED person) — start fresh
        // toward this candidate rather than keep the old identity.
        this.startBuilding(record, topCandidate.profileId, timestamp)
      }

      record.consecutiveHighConfidenceFrames = Math.min(
        IDENTITY_LOCK_ACQUIRE_CONSECUTIVE_FRAMES,
        record.consecutiveHighConfidenceFrames + 1
      )

      if (record.consecutiveHighConfidenceFrames >= IDENTITY_LOCK_ACQUIRE_CONSECUTIVE_FRAMES) {
        record.lockState = LOCK_STATES.LOCKED
        record.lockedAt = record.lockedAt || timestamp
      }

      record.lastConfirmedAt = timestamp
    } else if (record.lockState !== LOCK_STATES.LOCKED) {
      // No qualifying evidence this frame and nothing locked yet. A
      // live test (16 July 2026, Christian) showed a hard reset to 0
      // here made acquisition unreliable in practice — a real
      // embedding's confidence naturally jitters frame to frame (a
      // blink, a flicker of motion blur), so a single weak frame kept
      // discarding an otherwise-good streak before it could complete.
      // Decrementing instead means isolated noise costs one frame of
      // progress, not the whole streak — a genuinely poor run of
      // frames still fails to accumulate, since it has to net-lose
      // faster than it can gain.
      record.consecutiveHighConfidenceFrames = Math.max(0, record.consecutiveHighConfidenceFrames - 1)
    }
    // else: locked, and this frame had no qualifying evidence (no
    // face, quality too low, or a rival below the bar) — this is
    // exactly the "hold through a loss of face" case. Leave the lock
    // exactly as-is.

    this.locks.set(trackingId, record)

    // held reflects whether the LOCK (not just this frame's own raw
    // match) is what's carrying the identity right now. If we just
    // freshly acquired the lock THIS frame, that's live evidence, not
    // a hold. Otherwise, use whether this frame reconfirmed the prior
    // lock computed above.
    const justAcquiredThisFrame = record.lockState === LOCK_STATES.LOCKED && !priorLockedPersonId
    const held = record.lockState === LOCK_STATES.LOCKED && !justAcquiredThisFrame && !liveConfirmationOfPriorLock

    return this.toResult(record, held)
  }

  /** Called by IdentityTrackingService when a track fully expires. */
  release(trackingId) {
    this.locks.delete(trackingId)
  }

  getLock(trackingId) {
    const record = this.locks.get(trackingId)
    return record ? this.toResult(record) : this.emptyResult()
  }

  reset() {
    this.locks.clear()
  }

  createRecord(trackingId) {
    return {
      trackingId,
      personId: null,
      lockState: LOCK_STATES.NONE,
      consecutiveHighConfidenceFrames: 0,
      lockedAt: null,
      lastConfirmedAt: null,
    }
  }

  startBuilding(record, personId, timestamp) {
    record.personId = personId
    record.lockState = LOCK_STATES.LOCKING
    record.consecutiveHighConfidenceFrames = 0
    record.lockedAt = null
    record.lastConfirmedAt = timestamp
  }

  toResult(record, held = false) {
    const locked = record.lockState === LOCK_STATES.LOCKED

    return {
      status: 'success',
      provider: 'LOCAL_IDENTITY_LOCK_SERVICE',
      locked,
      personId: locked ? record.personId : null,
      // Only meaningful when locked: true means this frame's own live
      // face evidence did NOT reconfirm the locked person (no face,
      // quality-gated out, or a weak/rival match) — the identity is
      // being carried by the lock alone, computed in update() above.
      held: locked ? held : false,
      confidence: locked ? IDENTITY_LOCK_ACQUIRE_CONFIDENCE_THRESHOLD : 0,
      lockState: record.lockState,
      framesToAcquire: Math.max(
        0,
        IDENTITY_LOCK_ACQUIRE_CONSECUTIVE_FRAMES - record.consecutiveHighConfidenceFrames
      ),
      lockedAt: record.lockedAt,
      lastConfirmedAt: record.lastConfirmedAt,
    }
  }

  emptyResult() {
    return {
      status: 'success',
      provider: 'LOCAL_IDENTITY_LOCK_SERVICE',
      locked: false,
      personId: null,
      held: false,
      confidence: 0,
      lockState: LOCK_STATES.NONE,
      framesToAcquire: IDENTITY_LOCK_ACQUIRE_CONSECUTIVE_FRAMES,
      lockedAt: null,
      lastConfirmedAt: null,
    }
  }

  getStatus() {
    return {
      status: 'success',
      provider: 'LOCAL_IDENTITY_LOCK_SERVICE',
      version: 'v0.16.11',
      acquireConfidenceThreshold: IDENTITY_LOCK_ACQUIRE_CONFIDENCE_THRESHOLD,
      acquireConsecutiveFrames: IDENTITY_LOCK_ACQUIRE_CONSECUTIVE_FRAMES,
      overrideConfidenceThreshold: IDENTITY_LOCK_OVERRIDE_CONFIDENCE_THRESHOLD,
      activeLocks: [...this.locks.values()].filter(
        (record) => record.lockState === LOCK_STATES.LOCKED
      ).length,
    }
  }
}

export { LOCK_STATES }
export default new IdentityLockService()
