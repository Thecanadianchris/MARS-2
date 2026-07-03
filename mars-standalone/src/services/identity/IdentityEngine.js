/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Engine:
 * IdentityEngine
 *
 * Purpose:
 * Orchestrates the v0.13.0 MARS Identity Foundation.
 * Identity answers "who is this?" while User Management,
 * Decision Intelligence and Notifications remain separate
 * subsystems.
 *
 * This engine prepares MARS for future face recognition but
 * does not implement biometric recognition in v0.13.0.
 *
 * Version:
 * v0.13.0
 *
 * Date Code:
 * 030726
 * ==========================================================
 */

import IdentityDiagnosticsService from './IdentityDiagnosticsService'
import IdentityObservationBuilder from './IdentityObservationBuilder'
import IdentityStateMachine from './IdentityStateMachine'
import PersonRegistry from './PersonRegistry'
import ProfileAuthorisationService from './ProfileAuthorisationService'
import {
  IDENTITY_STATES,
  IDENTITY_USER_TYPES,
} from './IdentityTypes'

class IdentityEngine {
  evaluate(perceptionResult = {}, options = {}) {
    const safePerceptionResult = perceptionResult || {}
    const safeOptions = options || {}

    const observationIds = this.getObservationIds(safePerceptionResult)
    const personPresent = this.hasPersonPresent(safePerceptionResult, observationIds)
    const faceDetected = this.hasFaceDetected(safePerceptionResult)
    const matchedProfile = this.resolveMatchedProfile(safeOptions)
    const pendingProfile = safeOptions.pendingProfile || null

    const stateResult = IdentityStateMachine.evaluate({
      personPresent,
      faceDetected,
      matchedProfile,
      pendingProfile,
      guest: Boolean(safeOptions.guest),
    })

    const userType = IdentityStateMachine.getUserTypeForState(
      stateResult.state,
      matchedProfile
    )

    const identityResult = {
      status: stateResult.status,
      provider: 'LOCAL_IDENTITY_ENGINE',
      version: 'v0.13.0',
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
      recognition: {
        faceRecognitionActive: false,
        voiceRecognitionActive: false,
        recognitionProvider: 'not_implemented_in_v0.13.0',
        preparedForFutureRecognition: true,
      },
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
  }

  resolveMatchedProfile(options = {}) {
    const safeOptions = options || {}

    if (safeOptions.matchedProfile) {
      return safeOptions.matchedProfile
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

  hasPersonPresent(perceptionResult = {}, observationIds = new Set()) {
    const safePerceptionResult = perceptionResult || {}

    return (
      observationIds.has('person_present') ||
      Boolean(safePerceptionResult.detections?.people > 0)
    )
  }

  hasFaceDetected(perceptionResult = {}) {
    const safePerceptionResult = perceptionResult || {}

    return (
      Boolean(safePerceptionResult.faceFoundation?.faceDetected) ||
      Boolean(safePerceptionResult.faceFoundation?.faceCount > 0) ||
      Boolean(safePerceptionResult.detections?.faces > 0)
    )
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