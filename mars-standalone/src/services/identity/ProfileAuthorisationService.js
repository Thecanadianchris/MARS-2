/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Service:
 * ProfileAuthorisationService
 *
 * Purpose:
 * Enforces Identity Foundation safety rules around profile
 * creation. Unknown people can become pending or guest profiles,
 * but they must never automatically become trusted users.
 *
 * Version:
 * v0.13.0
 *
 * Date Code:
 * 030726
 * ==========================================================
 */

import { IDENTITY_USER_TYPES } from './IdentityTypes'

class ProfileAuthorisationService {
  canCreatePendingProfile(request = {}) {
    return {
      allowed: true,
      requiresTrustedUserConfirmation: true,
      reason:
        request.reason ||
        'Pending profiles are allowed but must be confirmed by a trusted user before becoming known.',
    }
  }

  canConfirmProfile(actor = {}, requestedProfile = {}) {
    const actorTrusted = Boolean(actor.trusted) || actor.userType === IDENTITY_USER_TYPES.OWNER

    if (!actorTrusted) {
      return {
        allowed: false,
        reason: 'Only an owner or trusted user may confirm an identity profile.',
      }
    }

    if (requestedProfile.userType === IDENTITY_USER_TYPES.OWNER) {
      return {
        allowed: false,
        reason: 'Owner profiles cannot be created automatically through identity recognition.',
      }
    }

    return {
      allowed: true,
      reason: 'Trusted user confirmation accepted.',
    }
  }

  sanitiseUnconfirmedProfile(profile = {}) {
    return {
      ...profile,
      trusted: false,
      protected: false,
      userType: IDENTITY_USER_TYPES.UNKNOWN,
      learningEnabled: false,
      pending: true,
    }
  }
}

export default new ProfileAuthorisationService()
