/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Service:
 * PersonRegistry
 *
 * Purpose:
 * Stores the local identity profiles known to MARS v0.13.0.
 * This registry is deliberately simple and replaceable. It is
 * not the future long-term memory database and it does not
 * manage permissions.
 *
 * Version:
 * v0.13.0
 *
 * Date Code:
 * 030726
 * ==========================================================
 */

import { IDENTITY_USER_TYPES } from './IdentityTypes'

const DEFAULT_PROFILES = [
  {
    id: 'christian',
    displayName: 'Christian',
    userType: IDENTITY_USER_TYPES.OWNER,
    trusted: true,
    protected: false,
    blocked: false,
    learningEnabled: true,
    notes: 'Project owner profile placeholder. Recognition is future work.',
  },
  {
    id: 'ann',
    displayName: 'Ann',
    userType: IDENTITY_USER_TYPES.TRUSTED_USER,
    trusted: true,
    protected: false,
    blocked: false,
    learningEnabled: true,
    notes: 'Trusted household profile placeholder. Recognition is future work.',
  },
  {
    id: 'finley',
    displayName: 'Finley',
    userType: IDENTITY_USER_TYPES.PROTECTED_USER,
    trusted: true,
    protected: true,
    blocked: false,
    learningEnabled: true,
    notes:
      'Protected user profile placeholder. Used for observation priority only, never diagnosis.',
  },
]

class PersonRegistry {
  constructor() {
    this.reset()
  }

  reset() {
    this.profiles = new Map()

    DEFAULT_PROFILES.forEach((profile) => {
      this.profiles.set(profile.id, this.normaliseProfile(profile))
    })

    this.pendingProfiles = new Map()
  }

  listProfiles() {
    return Array.from(this.profiles.values()).map((profile) => ({ ...profile }))
  }

  getProfile(profileId) {
    if (!profileId) return null

    const profile = this.profiles.get(profileId)
    return profile ? { ...profile } : null
  }

  findProfileByDisplayName(displayName) {
    if (!displayName) return null

    const normalisedName = displayName.trim().toLowerCase()

    return (
      this.listProfiles().find(
        (profile) => profile.displayName.toLowerCase() === normalisedName
      ) || null
    )
  }

  createPendingProfile(candidate = {}) {
    const pendingId = candidate.id || `pending-${Date.now()}`

    const pendingProfile = {
      id: pendingId,
      displayName: candidate.displayName || 'Pending profile',
      userType: IDENTITY_USER_TYPES.UNKNOWN,
      trusted: false,
      protected: false,
      blocked: false,
      learningEnabled: false,
      pending: true,
      createdAt: Date.now(),
      source: candidate.source || 'identity_foundation',
      notes:
        candidate.notes ||
        'Pending identity profile. Requires trusted user confirmation.',
    }

    this.pendingProfiles.set(pendingId, pendingProfile)
    return { ...pendingProfile }
  }

  confirmPendingProfile(pendingProfileId, approvedProfile = {}) {
    const pendingProfile = this.pendingProfiles.get(pendingProfileId)

    if (!pendingProfile) {
      return null
    }

    const confirmedProfile = this.normaliseProfile({
      ...pendingProfile,
      ...approvedProfile,
      id: approvedProfile.id || pendingProfile.id.replace('pending-', 'profile-'),
      pending: false,
      trusted: Boolean(approvedProfile.trusted),
      protected: Boolean(approvedProfile.protected),
      learningEnabled: approvedProfile.learningEnabled !== false,
      confirmedAt: Date.now(),
    })

    this.pendingProfiles.delete(pendingProfileId)
    this.profiles.set(confirmedProfile.id, confirmedProfile)

    return { ...confirmedProfile }
  }

  listPendingProfiles() {
    return Array.from(this.pendingProfiles.values()).map((profile) => ({ ...profile }))
  }

  normaliseProfile(profile) {
    return {
      id: profile.id,
      displayName: profile.displayName || 'Unknown',
      userType: profile.userType || IDENTITY_USER_TYPES.UNKNOWN,
      trusted: Boolean(profile.trusted),
      protected: Boolean(profile.protected),
      blocked: Boolean(profile.blocked),
      learningEnabled: profile.learningEnabled !== false,
      pending: Boolean(profile.pending),
      createdAt: profile.createdAt || null,
      confirmedAt: profile.confirmedAt || null,
      source: profile.source || 'static_registry',
      notes: profile.notes || '',
    }
  }
}

export default new PersonRegistry()
