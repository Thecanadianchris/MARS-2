/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Engine:
 * IdentityEngine
 *
 * Purpose:
 * Orchestrates the MARS Identity Foundation and v0.13.1
 * Identity Recognition Architecture.
 *
 * Identity answers "who is this?" while User Management,
 * Decision Intelligence and Notifications remain separate
 * subsystems.
 *
 * This engine accepts neutral perception results or provider-
 * neutral Recognition Candidates. As of v0.16, real face
 * recognition fills the RecognitionCandidate slot this engine was
 * built to receive back in v0.13.1 — see FaceRecognitionService.
 * v0.16.1 swapped the matcher itself from an 8-ratio landmark-
 * geometry signature to a real 128-d face-embedding descriptor,
 * after a live test showed the geometry approach wasn't
 * discriminative enough between two different real people.
 *
 * Version:
 * v0.16.1 (orchestration architecture from v0.13.1)
 *
 * Date Code:
 * 140726
 * ==========================================================
 */

import IdentityDiagnosticsService from './IdentityDiagnosticsService'
import IdentityObservationBuilder from './IdentityObservationBuilder'
import IdentityStateMachine from './IdentityStateMachine'
import IdentityTrackingService from './IdentityTrackingService'
import PersonRegistry from './PersonRegistry'
import ProfileAuthorisationService from './ProfileAuthorisationService'
import RecognitionCandidate from './RecognitionCandidate'
import { RECOGNITION_PROVIDER } from './FaceRecognitionService'
import {
  IDENTITY_ACTIVE_PERSON_CONFIDENCE_THRESHOLD,
  IDENTITY_RECOGNITION_PATIENCE_FRAMES,
  IDENTITY_STATES,
  IDENTITY_USER_TYPES,
} from './IdentityTypes'

class IdentityEngine {
  evaluate(perceptionResult = {}, options = {}) {
    const safePerceptionResult = perceptionResult || {}
    const safeOptions = options || {}
    const trackingResult = this.resolveTrackingResult(safePerceptionResult, safeOptions)
    const recognitionCandidate = trackingResult?.candidate || this.resolveRecognitionCandidate(
      safePerceptionResult,
      safeOptions
    )

    const observationIds = this.getObservationIds(safePerceptionResult)
    const personPresent = this.hasPersonPresent(
      safePerceptionResult,
      observationIds,
      recognitionCandidate
    )
    const faceDetected = this.hasFaceDetected(safePerceptionResult, recognitionCandidate)
    const matchedProfile = this.resolveMatchedProfile(safeOptions, recognitionCandidate)
    const pendingProfile = safeOptions.pendingProfile || null
    const attemptingRecognition = this.isAttemptingRecognition(
      faceDetected,
      matchedProfile,
      trackingResult
    )

    const stateResult = IdentityStateMachine.evaluate({
      personPresent,
      faceDetected,
      matchedProfile,
      pendingProfile,
      guest: Boolean(safeOptions.guest),
      attemptingRecognition,
    })

    const userType = IdentityStateMachine.getUserTypeForState(
      stateResult.state,
      matchedProfile
    )

    const identityResult = {
      status: stateResult.status,
      provider: 'LOCAL_IDENTITY_ENGINE',
      version: 'v0.13.1',
      timestamp: Date.now(),
      state: stateResult.state,
      confidence: stateResult.confidence,
      reason: stateResult.reason,
      userType,
      profile: this.createProfileSummary(matchedProfile, pendingProfile, stateResult.state),
      known: Boolean(matchedProfile),
      trusted: Boolean(matchedProfile?.trusted),
      protected: Boolean(matchedProfile?.protected),
      blocked: Boolean(matchedProfile?.blocked),
      requiresTrustedUserConfirmation:
        stateResult.state === IDENTITY_STATES.UNKNOWN ||
        stateResult.state === IDENTITY_STATES.PENDING_PROFILE,
      recognition: this.createRecognitionSummary(recognitionCandidate, trackingResult),
      tracking: this.createTrackingSummary(trackingResult),
      workflow: this.createWorkflowState(stateResult.state),
    }

    const identityObservations = IdentityObservationBuilder.build(identityResult)
    const diagnostics = IdentityDiagnosticsService.evaluate(identityResult)

    return {
      ...identityResult,
      observations: identityObservations.observations,
      observationStream: identityObservations,
      diagnostics,
      summary: this.createSummary(identityResult),
    }
  }

  evaluateRecognitionCandidate(recognitionCandidate = {}, options = {}) {
    const candidate = RecognitionCandidate.create(recognitionCandidate)

    return this.evaluate(
      {
        status: 'success',
        provider: 'RECOGNITION_CANDIDATE_INPUT',
        timestamp: candidate.timestamp,
        recognitionCandidate: candidate,
        personPresent: Boolean(candidate.trackingId),
        faceVisible: candidate.faceVisible,
        detections: {
          people: candidate.trackingId ? 1 : 0,
          faces: candidate.faceVisible ? 1 : 0,
        },
      },
      {
        ...options,
        recognitionCandidate: candidate,
      }
    )
  }

  createPendingProfile(candidate = {}) {
    const safeCandidateInput = candidate || {}

    const authorisation = ProfileAuthorisationService.canCreatePendingProfile({
      reason: 'New person requires trusted user confirmation.',
    })

    if (!authorisation.allowed) {
      return {
        status: 'rejected',
        reason: authorisation.reason,
        profile: null,
      }
    }

    const safeCandidate = ProfileAuthorisationService.sanitiseUnconfirmedProfile(safeCandidateInput)
    const profile = PersonRegistry.createPendingProfile(safeCandidate)

    return {
      status: 'success',
      provider: 'LOCAL_IDENTITY_ENGINE',
      profile,
      requiresTrustedUserConfirmation: true,
      summary: 'Pending identity profile created. Trusted user confirmation required.',
    }
  }

  /**
   * v0.16.8. Directly adds a new local profile, requested from the
   * Identity tab's "Add Person" control. Distinct from
   * createPendingProfile()/confirmPendingProfile() above: this is an
   * explicit action by whoever is operating the device right now,
   * not an unconfirmed auto-detected face, so it skips the pending/
   * trusted-user-confirmation dance and writes straight to
   * PersonRegistry. FaceEnrollmentPanel already renders an Enroll
   * button for every profile PersonRegistry knows about, so a newly
   * added person becomes enrollable immediately with no further
   * wiring.
   */
  addPerson({ displayName, userType } = {}) {
    return PersonRegistry.addProfile({ displayName, userType })
  }

  removePerson(profileId) {
    const removed = PersonRegistry.removeProfile(profileId)

    return {
      status: removed ? 'success' : 'not_found',
      profileId,
      removed,
    }
  }

  confirmPendingProfile(pendingProfileId, approvedProfile = {}, actor = {}) {
    const safeApprovedProfile = approvedProfile || {}
    const safeActor = actor || {}

    const authorisation = ProfileAuthorisationService.canConfirmProfile(
      safeActor,
      safeApprovedProfile
    )

    if (!authorisation.allowed) {
      return {
        status: 'rejected',
        reason: authorisation.reason,
        profile: null,
      }
    }

    const profile = PersonRegistry.confirmPendingProfile(
      pendingProfileId,
      safeApprovedProfile
    )

    if (!profile) {
      return {
        status: 'not_found',
        reason: 'Pending profile was not found.',
        profile: null,
      }
    }

    return {
      status: 'success',
      provider: 'LOCAL_IDENTITY_ENGINE',
      profile,
      summary: `Identity profile confirmed for ${profile.displayName}.`,
    }
  }

  getDiagnostics() {
    return IdentityDiagnosticsService.evaluate(null)
  }

  reset() {
    PersonRegistry.reset()
    IdentityTrackingService.reset()
  }

  resolveTrackingResult(perceptionResult = {}, options = {}) {
    const safePerceptionResult = perceptionResult || {}
    const safeOptions = options || {}

    if (safeOptions.disableTracking) {
      return null
    }

    if (safeOptions.trackingResult) {
      return safeOptions.trackingResult
    }

    if (safeOptions.recognitionCandidate || safePerceptionResult.recognitionCandidate) {
      return null
    }

    return IdentityTrackingService.updateFromPerception(
      safePerceptionResult,
      safeOptions.trackingOptions || {}
    )
  }

  resolveRecognitionCandidate(perceptionResult = {}, options = {}) {
    const safePerceptionResult = perceptionResult || {}
    const safeOptions = options || {}
    const candidate = safeOptions.recognitionCandidate || safePerceptionResult.recognitionCandidate

    if (!candidate) {
      return null
    }

    return RecognitionCandidate.create(candidate)
  }

  resolveMatchedProfile(options = {}, recognitionCandidate = null) {
    const safeOptions = options || {}

    if (safeOptions.matchedProfile) {
      return safeOptions.matchedProfile
    }

    const candidateProfile = recognitionCandidate?.candidateProfiles?.[0] || null

    if (candidateProfile?.profile) {
      return candidateProfile.profile
    }

    if (candidateProfile?.profileId) {
      return PersonRegistry.getProfile(candidateProfile.profileId)
    }

    if (safeOptions.profileId) {
      return PersonRegistry.getProfile(safeOptions.profileId)
    }

    if (safeOptions.displayName) {
      return PersonRegistry.findProfileByDisplayName(safeOptions.displayName)
    }

    return null
  }

  getObservationIds(perceptionResult = {}) {
    const safePerceptionResult = perceptionResult || {}
    const observations = safePerceptionResult.observationStream?.observations || []
    const ids = safePerceptionResult.observationStream?.ids || []

    return new Set([
      ...ids,
      ...observations.map((observation) => observation.id),
    ])
  }

  hasPersonPresent(perceptionResult = {}, observationIds = new Set(), recognitionCandidate = null) {
    const safePerceptionResult = perceptionResult || {}

    return (
      observationIds.has('person_present') ||
      Boolean(safePerceptionResult.detections?.people > 0) ||
      Boolean(safePerceptionResult.personPresent) ||
      Boolean(recognitionCandidate?.trackingId)
    )
  }

  hasFaceDetected(perceptionResult = {}, recognitionCandidate = null) {
    const safePerceptionResult = perceptionResult || {}

    return (
      Boolean(recognitionCandidate?.faceVisible) ||
      Boolean(safePerceptionResult.faceVisible) ||
      Boolean(safePerceptionResult.faceFoundation?.faceDetected) ||
      Boolean(safePerceptionResult.faceFoundation?.faceCount > 0) ||
      Boolean(safePerceptionResult.detections?.faces > 0)
    )
  }

  /**
   * True while a face is visible, no profile has matched yet, and
   * we're still within the "give it a few frames" patience window
   * tracked by IdentityTrackingService. Drives the SEARCHING state
   * so a brief glance doesn't immediately read as UNKNOWN.
   */
  isAttemptingRecognition(faceDetected, matchedProfile, trackingResult) {
    if (!faceDetected || matchedProfile) {
      return false
    }

    const framesSeen = trackingResult?.track?.framesSeen || 0

    return framesSeen > 0 && framesSeen < IDENTITY_RECOGNITION_PATIENCE_FRAMES
  }

  /**
   * Gate for MemoryIntelligenceService.setActivePerson(). Pure and
   * synchronous so it's testable without running the full vision
   * pipeline. Only fires on a confirmed, non-pending KNOWN/TRUSTED/
   * PROTECTED state whose underlying face-match confidence clears
   * IDENTITY_ACTIVE_PERSON_CONFIDENCE_THRESHOLD — deliberately
   * higher than RecognitionCandidate's own 0.75 "recognised" bar,
   * and never true on a weak match, protected profile included.
   */
  shouldActivatePerson(identityResult, threshold = IDENTITY_ACTIVE_PERSON_CONFIDENCE_THRESHOLD) {
    if (!identityResult || !identityResult.profile || identityResult.profile.pending) {
      return false
    }

    const eligibleStates = [
      IDENTITY_STATES.KNOWN,
      IDENTITY_STATES.TRUSTED,
      IDENTITY_STATES.PROTECTED,
    ]

    if (!eligibleStates.includes(identityResult.state)) {
      return false
    }

    const matchConfidence = identityResult.recognition?.candidate?.identityConfidence ?? 0

    return matchConfidence >= threshold
  }

  createProfileSummary(matchedProfile, pendingProfile, state) {
    if (matchedProfile) {
      return {
        id: matchedProfile.id,
        displayName: matchedProfile.displayName,
        userType: matchedProfile.userType,
        trusted: Boolean(matchedProfile.trusted),
        protected: Boolean(matchedProfile.protected),
        blocked: Boolean(matchedProfile.blocked),
        pending: false,
      }
    }

    if (pendingProfile) {
      return {
        id: pendingProfile.id,
        displayName: pendingProfile.displayName || 'Pending profile',
        userType: IDENTITY_USER_TYPES.UNKNOWN,
        trusted: false,
        protected: false,
        blocked: false,
        pending: true,
      }
    }

    return {
      id: 'unknown',
      displayName: state === IDENTITY_STATES.NO_PERSON ? 'No person' : 'Unknown',
      userType: IDENTITY_USER_TYPES.UNKNOWN,
      trusted: false,
      protected: false,
      blocked: false,
      pending: false,
    }
  }

  createRecognitionSummary(recognitionCandidate = null, trackingResult = null) {
    if (!recognitionCandidate) {
      return {
        faceRecognitionActive: true,
        voiceRecognitionActive: false,
        recognitionProvider: RECOGNITION_PROVIDER,
        preparedForFutureRecognition: true,
        candidate: null,
      }
    }

    return {
      // v0.16: face recognition is real; v0.16.1 swapped the matcher
      // from landmark-geometry ratios to a real face-embedding net
      // (see FaceRecognitionService's header). Voice recognition is
      // still not real — kept separate per provider.
      faceRecognitionActive: true,
      voiceRecognitionActive: false,
      recognitionProvider: RECOGNITION_PROVIDER,
      preparedForFutureRecognition: true,
      candidate: recognitionCandidate.toJSON
        ? recognitionCandidate.toJSON()
        : recognitionCandidate,
      confidence: trackingResult?.recognitionConfidence || null,
      faceQuality: trackingResult?.faceQuality || null,
    }
  }

  createTrackingSummary(trackingResult = null) {
    if (!trackingResult?.track) {
      return {
        active: false,
        trackingId: null,
        track: null,
        timeline: [],
      }
    }

    return {
      active: trackingResult.track.status === 'active',
      trackingId: trackingResult.track.trackingId,
      track: trackingResult.track,
      timeline: trackingResult.timeline || [],
    }
  }

  createWorkflowState(state) {
    return {
      personDetected: state !== IDENTITY_STATES.NO_PERSON,
      tracking:
        state === IDENTITY_STATES.TRACKING ||
        state === IDENTITY_STATES.SEARCHING,
      searching:
        state === IDENTITY_STATES.SEARCHING ||
        state === IDENTITY_STATES.UNKNOWN,
      unknown: state === IDENTITY_STATES.UNKNOWN,
      pendingProfile: state === IDENTITY_STATES.PENDING_PROFILE,
      guest: state === IDENTITY_STATES.GUEST,
      trustedUserRequired:
        state === IDENTITY_STATES.UNKNOWN ||
        state === IDENTITY_STATES.PENDING_PROFILE,
    }
  }

  createSummary(identityResult) {
    const name = identityResult.profile?.displayName || 'Unknown'
    return `Identity Foundation: ${name} is ${identityResult.state}. ${identityResult.reason}`
  }
}

export default new IdentityEngine()
