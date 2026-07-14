/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Service:
 * IdentityDiagnosticsService
 *
 * Purpose:
 * Provides simple diagnostics for the MARS Identity Foundation
 * without exposing private recognition data or future biometric
 * implementation details.
 *
 * Version:
 * v0.13.0
 *
 * Date Code:
 * 030726
 * ==========================================================
 */

import FaceRecognitionService from './FaceRecognitionService'
import PersonRegistry from './PersonRegistry'

class IdentityDiagnosticsService {
  evaluate(identityResult = null) {
    const profiles = PersonRegistry.listProfiles()
    const pendingProfiles = PersonRegistry.listPendingProfiles()
    const faceRecognitionStatus = FaceRecognitionService.getStatus()

    return {
      status: 'success',
      provider: 'LOCAL_IDENTITY_DIAGNOSTICS_SERVICE',
      version: 'v0.13.0',
      timestamp: Date.now(),
      profileCount: profiles.length,
      pendingProfileCount: pendingProfiles.length,
      currentIdentityState: identityResult?.state || 'not_evaluated',
      currentIdentityKnown: Boolean(identityResult?.known),
      currentIdentityTrusted: Boolean(identityResult?.trusted),
      currentIdentityProtected: Boolean(identityResult?.protected),
      capabilities: {
        identityStateMachine: true,
        localProfileRegistry: true,
        pendingProfileWorkflow: true,
        trustedUserAutoPromotion: false,
        faceRecognition: true,
        voiceRecognition: false,
      },
      faceRecognition: faceRecognitionStatus,
      summary: this.createSummary(profiles, pendingProfiles, identityResult),
    }
  }

  createSummary(profiles, pendingProfiles, identityResult) {
    return `Identity diagnostics active. ${profiles.length} known profile(s), ${pendingProfiles.length} pending profile(s). Current state: ${identityResult?.state || 'not evaluated'}.`
  }
}

export default new IdentityDiagnosticsService()
