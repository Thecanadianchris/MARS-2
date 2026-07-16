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
 * v0.16.8: added addProfile()/removeProfile() so the owner can add
 * a new named person directly from the Identity tab, and persists
 * any profile beyond the three seeded defaults (Christian/Ann/
 * Finley) to localStorage — same on-device-only, storageAvailable()
 * -guarded pattern as FaceEnrollmentStore. Without this, a newly
 * added person and their enrolled face samples would survive a page
 * reload independently of each other (FaceEnrollmentStore already
 * persisted; this registry didn't), leaving orphaned face data with
 * no matching profile. DEFAULT_PROFILES themselves are never
 * persisted — they always come from this file so future code changes
 * to them take effect immediately.
 *
 * Version:
 * v0.16.8
 *
 * Date Code:
 * 160726
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

// v0.16.8: user types the owner may pick when adding a person
// directly. OWNER/BLOCKED/UNKNOWN are deliberately not offered here —
// owner profiles aren't something a UI button should be able to
// create, blocked is a moderation outcome not a starting point, and
// unknown isn't a real choice.
const ADDABLE_USER_TYPES = [
  IDENTITY_USER_TYPES.TRUSTED_USER,
  IDENTITY_USER_TYPES.PROTECTED_USER,
  IDENTITY_USER_TYPES.GUEST,
]

const STORAGE_KEY = 'mars_person_registry_v1'

function storageAvailable() {
  try {
    return typeof window !== 'undefined' && Boolean(window.localStorage)
  } catch {
    return false
  }
}

function slugify(text) {
  return (text || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-+|-+$)/g, '')
}

class PersonRegistry {
  constructor() {
    this.reset({ clearStorage: false })
    this.loadFromStorage()
  }

  reset({ clearStorage = true } = {}) {
    this.profiles = new Map()

    DEFAULT_PROFILES.forEach((profile) => {
      this.profiles.set(profile.id, this.normaliseProfile(profile))
    })

    this.pendingProfiles = new Map()
    this.customProfileIds = new Set()

    if (clearStorage && storageAvailable()) {
      try {
        window.localStorage.removeItem(STORAGE_KEY)
      } catch {
        // In-memory reset already happened even if storage clear failed.
      }
    }
  }

  loadFromStorage() {
    if (!storageAvailable()) {
      return
    }

    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)

      if (!raw) {
        return
      }

      const parsed = JSON.parse(raw)

      if (!Array.isArray(parsed)) {
        return
      }

      parsed.forEach((profile) => {
        if (profile && profile.id) {
          this.profiles.set(profile.id, this.normaliseProfile(profile))
          this.customProfileIds.add(profile.id)
        }
      })
    } catch {
      // Corrupt/blocked storage — start clean rather than throwing.
    }
  }

  saveToStorage() {
    if (!storageAvailable()) {
      return
    }

    try {
      const customProfiles = Array.from(this.customProfileIds)
        .map((id) => this.profiles.get(id))
        .filter(Boolean)

      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(customProfiles))
    } catch {
      // Storage full/blocked — the in-memory copy keeps the session working.
    }
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

  /**
   * v0.16.8. Directly adds a new local profile. This is the owner
   * explicitly adding a person from the Identity tab — distinct from
   * createPendingProfile()/confirmPendingProfile() below, which exist
   * for a face MARS noticed on its own and which still require
   * trusted-user confirmation before becoming known. An explicit
   * "add person" action initiated by whoever is operating the device
   * doesn't need that same confirmation dance.
   */
  addProfile({ displayName, userType } = {}) {
    const trimmedName = (displayName || '').trim()

    if (!trimmedName) {
      return { status: 'rejected', reason: 'display_name_required', profile: null }
    }

    const safeUserType = ADDABLE_USER_TYPES.includes(userType)
      ? userType
      : IDENTITY_USER_TYPES.TRUSTED_USER

    const id = this.generateUniqueId(trimmedName)

    const profile = this.normaliseProfile({
      id,
      displayName: trimmedName,
      userType: safeUserType,
      trusted:
        safeUserType === IDENTITY_USER_TYPES.TRUSTED_USER ||
        safeUserType === IDENTITY_USER_TYPES.PROTECTED_USER,
      protected: safeUserType === IDENTITY_USER_TYPES.PROTECTED_USER,
      blocked: false,
      learningEnabled: true,
      pending: false,
      createdAt: Date.now(),
      source: 'owner_added',
      notes: 'Added directly from the Identity tab.',
    })

    this.profiles.set(id, profile)
    this.customProfileIds.add(id)
    this.saveToStorage()

    return { status: 'success', profile: { ...profile } }
  }

  /**
   * v0.16.8. Removes a profile added via addProfile()/confirmPendingProfile()
   * (anything tracked in customProfileIds). The three seeded
   * DEFAULT_PROFILES can never be removed this way — they're never
   * added to customProfileIds in the first place.
   */
  removeProfile(profileId) {
    if (!profileId || !this.customProfileIds.has(profileId)) {
      return false
    }

    const removed = this.profiles.delete(profileId)
    this.customProfileIds.delete(profileId)

    if (removed) {
      this.saveToStorage()
    }

    return removed
  }

  generateUniqueId(displayName) {
    const base = slugify(displayName) || 'person'
    let candidate = base
    let attempt = 1

    while (this.profiles.has(candidate)) {
      attempt += 1
      candidate = `${base}-${attempt}`
    }

    return candidate
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
    // v0.16.8: a confirmed pending profile is just as "custom" as one
    // added directly — persist it the same way.
    this.customProfileIds.add(confirmedProfile.id)
    this.saveToStorage()

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

export { ADDABLE_USER_TYPES }
export default new PersonRegistry()
