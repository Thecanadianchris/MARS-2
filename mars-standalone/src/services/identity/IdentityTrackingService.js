/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Service:
 * IdentityTrackingService
 *
 * Purpose:
 * Maintains provider-neutral tracking records for people
 * observed by the Vision subsystem.
 *
 * Tracking answers continuity questions such as:
 *
 *     "Is this the same observed person as last frame?"
 *
 * It does not answer identity, permission or decision questions.
 *
 * v0.16: identityConfidence/candidateProfiles are now real,
 * produced by FaceRecognitionService, instead of the hardcoded
 * 0/[] this service shipped with in v0.13.1. v0.16.1: reads
 * faceEmbedding (128-d neural descriptor) instead of faceLandmarks
 * (geometry ratios) — see FaceRecognitionService's header for why.
 *
 * v0.16.11: two changes for Identity Lock (see IdentityLockService).
 *
 * First, a real bug fix: VisionPipeline never supplied a trackingId
 * (checked directly — it doesn't), so `this.allocateTrackingId()` ran
 * on literally every frame, minting a brand-new trackingId each time.
 * That meant `existingTrack` was always null, `framesSeen` was always
 * 1, and no track EVER actually persisted across frames in the live
 * pipeline — despite this service being built to support exactly
 * that. `resolveTrackingId()` now reuses the single active
 * (non-expired) track when the caller doesn't supply one, matching
 * the "one primary tracked person" assumption already used throughout
 * the rest of Identity (single faces[0], single trust pipeline).
 *
 * Second, this service now asks IdentityLockService to update and
 * potentially override the recognition candidate it builds — once a
 * person locks in, their identity is reported even on frames where no
 * face evidence exists (see IdentityLockService's header for why:
 * Christian's example is a protected user like Finley collapsing
 * during a seizure, where losing face visibility must not also mean
 * losing who he is).
 *
 * v0.16.13: trackingId resolution is now keyed by WHO a face is
 * recognised as, not just "the one active track." Live-testing found
 * a real bug: with two enrolled people simultaneously in frame
 * (Christian + Ann), the lock acquired on Ann, then "turned off" on
 * Christian — because `resolveTrackingId()` only ever tracked ONE
 * global slot (whichever track was most recently touched), and
 * VisionPipeline only ever fed the single largest/most-prominent face
 * into it. Whichever person's face happened to be biggest/closest
 * that frame owned the one shared trackingId, and therefore the one
 * shared lock — a second, simultaneously-visible recognised person
 * could only ever steal it, never hold their own alongside it.
 * `profileTrackMap` (profileId -> trackingId) now gives every
 * recognised profile its own stable, dedicated trackingId that
 * doesn't depend on face size/position, so simultaneously-visible
 * enrolled people each accumulate and hold their own independent lock
 * in IdentityLockService (already a per-trackingId Map — this was the
 * only piece actually missing). Unrecognised/not-yet-matched faces
 * still fall back to the old "single most recently seen, unclaimed
 * track" heuristic, preserving existing SEARCHING-patience continuity
 * for someone MARS doesn't know yet, and are never allowed to steal a
 * track already pinned to a recognised profile.
 *
 * Known, disclosed limitation this does NOT solve: "held through a
 * face-visibility gap" (see IdentityLockService) still only works
 * reliably for whichever ONE person VisionPipeline chooses as primary
 * that frame (see its header for the new protected-profile-first
 * priority) — the underlying person-presence signal (pose/body
 * detection) is itself single-person, not multi-person, so a second,
 * non-primary person going out of face view can't honestly be told
 * apart from having genuinely left. True simultaneous "held" tracking
 * for 2+ people needs multi-person body/pose presence detection, a
 * materially bigger vision-pipeline change — logged as a follow-up,
 * not silently claimed as solved here.
 *
 * Version:
 * v0.16.13
 *
 * Date Code:
 * 170726
 * ==========================================================
 */

import FaceQualityEngine from './FaceQualityEngine'
import FaceRecognitionService from './FaceRecognitionService'
import IdentityLockService from './IdentityLockService'
import IdentityTimelineService from './IdentityTimelineService'
import RecognitionCandidate, { RECOGNITION_STATES } from './RecognitionCandidate'
import RecognitionConfidence from './RecognitionConfidence'

const TRACKING_TIMEOUT_MS = 5000

class IdentityTrackingService {
  constructor() {
    this.tracks = new Map()
    this.sequence = 0
    // v0.16.13: profileId -> trackingId. Gives every recognised
    // profile a dedicated, stable track independent of face size/
    // position — see header for the bug this fixes.
    this.profileTrackMap = new Map()
  }

  updateFromPerception(perceptionResult = {}, options = {}) {
    const safePerception = perceptionResult || {}
    const safeOptions = options || {}
    const timestamp = safePerception.timestamp || Date.now()

    if (!this.hasPersonEvidence(safePerception)) {
      this.expireOldTracks(timestamp)
      return {
        status: 'no_person',
        provider: 'LOCAL_IDENTITY_TRACKING_SERVICE',
        version: 'v0.13.1',
        track: null,
        candidate: RecognitionCandidate.create({
          state: RECOGNITION_STATES.NO_PERSON,
          timestamp,
        }),
      }
    }

    const faceQuality = FaceQualityEngine.evaluate({
      ...safePerception,
      faceVisible: this.hasFaceEvidence(safePerception),
      faceFoundation: safePerception.faceFoundation,
      confidence:
        safePerception.faceFoundation?.confidence ??
        safePerception.detections?.confidence ??
        safePerception.confidence ??
        0.75,
    })

    const faceRecognitionResult = FaceRecognitionService.recognise({
      embedding: safePerception.faceEmbedding,
      faceQualityResult: faceQuality,
    })

    // v0.16.13: resolve trackingId AFTER knowing who this face matches
    // (if anyone) — see header. A confidently-matched profile always
    // gets its own dedicated track; an unmatched/pending face falls
    // back to the old single-slot continuity heuristic. `hasOwnFace`
    // distinguishes "there IS a specific face this frame, just not
    // matched yet" (safe to exclude tracks already claimed by a
    // recognised profile, protecting them from being stolen by an
    // unrelated bystander) from "no face at all this frame" (the
    // whole-frame fallback used when nobody's face is visible at all —
    // MUST be allowed to resume a claimed/locked track, since that's
    // exactly the continuity the held-through-occlusion lock feature
    // depends on).
    const matchedProfileId = faceRecognitionResult.candidateProfiles?.[0]?.profileId || null
    const hasOwnFace = Boolean(safePerception.faceEmbedding)
    const trackingId =
      safeOptions.trackingId ||
      safePerception.trackingId ||
      this.resolveTrackingId(timestamp, matchedProfileId, hasOwnFace)
    const existingTrack = this.tracks.get(trackingId)

    // v0.16.11: this frame's own face evidence (possibly empty — no
    // face, quality too low) is what the lock service actually needs
    // to decide whether to keep reporting a prior identity or not.
    // See IdentityLockService's header.
    const lockResult = IdentityLockService.update({
      trackingId,
      candidateProfiles: faceRecognitionResult.candidateProfiles,
      timestamp,
    })

    const identityHeld = lockResult.locked && lockResult.held

    // When locked but NOT held, this frame has genuine live evidence
    // confirming the locked person — report its real confidence
    // rather than a flattened value. Only fall back to the lock's own
    // (frozen, acquisition-threshold) confidence when there's no live
    // number to report at all — the actual held-through-no-face case.
    const effectiveIdentityConfidence =
      lockResult.locked && identityHeld ? lockResult.confidence : faceRecognitionResult.identityConfidence

    const effectiveCandidateProfiles = lockResult.locked
      ? [
          {
            profileId: lockResult.personId,
            confidence: effectiveIdentityConfidence,
            held: lockResult.held,
          },
        ]
      : faceRecognitionResult.candidateProfiles

    const trackingConfidence = existingTrack ? 0.95 : 0.75
    const recognitionConfidence = RecognitionConfidence.calculate({
      visionConfidence: safePerception.confidence ?? 0.8,
      trackingConfidence,
      faceQuality: faceQuality.quality,
      identityConfidence: effectiveIdentityConfidence,
    })

    const track = {
      trackingId,
      status: 'active',
      firstSeen: existingTrack?.firstSeen || timestamp,
      lastSeen: timestamp,
      framesSeen: (existingTrack?.framesSeen || 0) + 1,
      faceVisible: faceQuality.suitable || this.hasFaceEvidence(safePerception),
      faceQuality: faceQuality.quality,
      trackingConfidence,
      boundingBox: safePerception.boundingBox || safePerception.personBox || null,
      metadata: {
        provider: safePerception.provider || 'UNKNOWN_VISION_PROVIDER',
      },
    }

    this.tracks.set(trackingId, track)

    // v0.16.11: a held lock is precisely the case where face quality
    // is bad or absent but MARS should still report an identity — so
    // the old "unsuitable quality always forces QUALITY_TOO_LOW"
    // override must yield to a held lock, otherwise the lock's whole
    // purpose (surviving no/bad face evidence) gets overridden right
    // back out again one line later.
    const forceQualityTooLow = !faceQuality.suitable && !identityHeld

    const candidate = RecognitionCandidate.create({
      trackingId,
      timestamp,
      faceVisible: track.faceVisible,
      faceQuality: faceQuality.quality,
      visionConfidence: safePerception.confidence ?? 0.8,
      trackingConfidence,
      identityConfidence: effectiveIdentityConfidence,
      boundingBox: track.boundingBox,
      candidateProfiles: effectiveCandidateProfiles,
      identityHeld,
      // v0.16.12: whether the lock is currently ENGAGED at all,
      // regardless of whether this specific frame is held or live-
      // confirmed. identityHeld alone can't drive a persistent "locked
      // on" UI indicator, since it's false on every frame the face IS
      // visible — even once the lock has fully acquired. See
      // VisionFaceOverlay.
      identityLocked: lockResult.locked,
      // Suitable quality (or a held lock): let the candidate derive
      // RECOGNISED vs SEARCHING itself from identityConfidence/
      // candidateProfiles (see RecognitionCandidate.deriveState).
      // Otherwise unsuitable quality overrides to QUALITY_TOO_LOW
      // regardless of any match.
      state: forceQualityTooLow ? RECOGNITION_STATES.QUALITY_TOO_LOW : undefined,
      qualityReasons: faceQuality.reasons,
      metadata: {
        faceQuality,
        recognitionConfidence,
        faceRecognition: faceRecognitionResult,
        identityLock: lockResult,
      },
    })

    IdentityTimelineService.addEvent(trackingId, {
      type: 'tracking_updated',
      label: identityHeld
        ? 'Identity tracking held — no current face evidence, reporting locked identity.'
        : 'Identity tracking updated from perception result.',
      state: candidate.state,
      confidence: recognitionConfidence.confidence,
      metadata: {
        faceVisible: track.faceVisible,
        faceQuality: faceQuality.quality,
        framesSeen: track.framesSeen,
        identityHeld,
      },
    })

    this.expireOldTracks(timestamp)

    return {
      status: 'success',
      provider: 'LOCAL_IDENTITY_TRACKING_SERVICE',
      version: 'v0.16.13',
      track,
      candidate,
      faceQuality,
      recognitionConfidence,
      identityLock: lockResult,
      timeline: IdentityTimelineService.getTimeline(trackingId),
    }
  }

  getTrack(trackingId) {
    return this.tracks.get(trackingId) || null
  }

  getActiveTracks() {
    return [...this.tracks.values()].filter((track) => track.status === 'active')
  }

  expireOldTracks(now = Date.now()) {
    this.tracks.forEach((track, trackingId) => {
      if (track.status === 'active' && now - track.lastSeen > TRACKING_TIMEOUT_MS) {
        this.tracks.set(trackingId, {
          ...track,
          status: 'expired',
        })

        IdentityTimelineService.addEvent(trackingId, {
          type: 'tracking_expired',
          label: 'Identity tracking expired after timeout.',
          state: 'expired',
        })

        // v0.16.11: the person is genuinely gone (no presence
        // evidence at all for TRACKING_TIMEOUT_MS, independent of
        // face visibility) — release any identity lock held against
        // this track rather than leaving it to potentially be picked
        // up by whichever unrelated person is tracked next.
        IdentityLockService.release(trackingId)

        // v0.16.13: also free up this profile's dedicated track slot
        // (if any) so, should they come back later, they're allocated
        // a fresh track rather than incorrectly resuming a session
        // that genuinely ended.
        for (const [profileId, mappedTrackingId] of this.profileTrackMap.entries()) {
          if (mappedTrackingId === trackingId) {
            this.profileTrackMap.delete(profileId)
          }
        }
      }
    })
  }

  allocateTrackingId() {
    this.sequence += 1
    return `TRK-${String(this.sequence).padStart(6, '0')}`
  }

  /**
   * v0.16.13. When a face confidently matches an enrolled profile,
   * that profile always gets its own dedicated, stable trackingId —
   * looked up (and remembered) in `profileTrackMap` — independent of
   * face size/position in the frame. This is the fix for the bug
   * Christian found live: two simultaneously-visible recognised
   * people (Christian + Ann) were sharing the same single trackingId
   * (whoever was currently largest/most-prominent), so a second
   * person's confident match didn't just get their OWN lock — it
   * stole the first person's, because IdentityLockService's lock is
   * keyed by trackingId and there was only ever one trackingId to go
   * around.
   *
   * When no profile is matched yet (unrecognised or still-pending
   * face), falls back to the pre-v0.16.13 single-slot heuristic: reuse
   * the single most-recently-seen active track, EXCLUDING any track
   * already claimed by a recognised profile in `profileTrackMap` — an
   * unmatched face is never allowed to steal a recognised person's
   * dedicated track. Preserves the existing SEARCHING-patience
   * continuity for a face MARS hasn't identified yet.
   *
   * `hasOwnFace` (see call site) controls whether a claimed track can
   * be reused by this fallback: true only when there's a genuinely
   * distinct, unrecognised face THIS frame (safe — and necessary — to
   * exclude claimed tracks, so it can't steal a recognised person's
   * dedicated one); false for the whole-frame "no face detected at
   * all" case, which MUST be allowed to resume a claimed/locked track
   * — that continuity is exactly what the held-through-occlusion lock
   * feature depends on (see IdentityLockService).
   *
   * Still not spatial re-identification (no bounding-box matching
   * across people) — see IdentityLockService's header for the known
   * limitation this implies for TWO simultaneously-unrecognised
   * people swapping within the same timeout window, and this file's
   * header for the broader known limitation around simultaneous
   * "held through occlusion" tracking.
   */
  resolveTrackingId(now = Date.now(), matchedProfileId = null, hasOwnFace = false) {
    if (matchedProfileId) {
      const mappedTrackingId = this.profileTrackMap.get(matchedProfileId)
      const mappedTrack = mappedTrackingId ? this.tracks.get(mappedTrackingId) : null

      if (
        mappedTrack &&
        mappedTrack.status === 'active' &&
        now - mappedTrack.lastSeen <= TRACKING_TIMEOUT_MS
      ) {
        return mappedTrackingId
      }

      const trackingId = this.allocateTrackingId()
      this.profileTrackMap.set(matchedProfileId, trackingId)
      return trackingId
    }

    const activeTracksBase = this.getActiveTracks().filter(
      (track) => now - track.lastSeen <= TRACKING_TIMEOUT_MS
    )

    const claimedTrackingIds = new Set(this.profileTrackMap.values())
    const activeTracks = hasOwnFace
      ? activeTracksBase.filter((track) => !claimedTrackingIds.has(track.trackingId))
      : activeTracksBase

    if (activeTracks.length === 0) {
      return this.allocateTrackingId()
    }

    const mostRecentlySeen = activeTracks.reduce((latest, track) =>
      track.lastSeen > latest.lastSeen ? track : latest
    )

    return mostRecentlySeen.trackingId
  }

  hasPersonEvidence(perceptionResult = {}) {
    const safePerception = perceptionResult || {}
    const observationIds = new Set([
      ...(safePerception.observationStream?.ids || []),
      ...(safePerception.observationStream?.observations || []).map(
        (observation) => observation.id
      ),
    ])

    return (
      observationIds.has('person_present') ||
      Boolean(safePerception.detections?.people > 0) ||
      Boolean(safePerception.personPresent)
    )
  }

  hasFaceEvidence(perceptionResult = {}) {
    const safePerception = perceptionResult || {}

    return (
      Boolean(safePerception.faceFoundation?.faceDetected) ||
      Boolean(safePerception.faceFoundation?.faceCount > 0) ||
      Boolean(safePerception.detections?.faces > 0) ||
      Boolean(safePerception.faceVisible)
    )
  }

  reset() {
    this.tracks.clear()
    this.sequence = 0
    this.profileTrackMap.clear()
    IdentityTimelineService.reset()
    IdentityLockService.reset()
  }
}

export default new IdentityTrackingService()
