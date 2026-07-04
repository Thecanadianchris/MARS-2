/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Model:
 * UserProfile
 *
 * Purpose:
 * Represents a managed MARS user profile.
 *
 * Version:
 * v0.13.2
 *
 * Date Code:
 * 040726
 * ==========================================================
 */

import { USER_ROLES, isValidUserRole } from './UserRoles'

class UserProfile {
  constructor(data = {}) {
    const safeData = data || {}

    this.id = safeData.id || `USR-${Date.now()}`
    this.identityProfileId = safeData.identityProfileId || null
    this.displayName = safeData.displayName || 'Unknown User'
    this.role = isValidUserRole(safeData.role) ? safeData.role : USER_ROLES.UNKNOWN
    this.authorised = Boolean(safeData.authorised)
    this.protected = this.role === USER_ROLES.PROTECTED_USER || Boolean(safeData.protected)
    this.blocked = this.role === USER_ROLES.BLOCKED || Boolean(safeData.blocked)
    this.notificationEnabled = safeData.notificationEnabled !== false
    this.createdAt = safeData.createdAt || Date.now()
    this.updatedAt = Date.now()
    this.metadata = safeData.metadata || {}
  }

  toJSON() {
    return {
      id: this.id,
      identityProfileId: this.identityProfileId,
      displayName: this.displayName,
      role: this.role,
      authorised: this.authorised,
      protected: this.protected,
      blocked: this.blocked,
      notificationEnabled: this.notificationEnabled,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      metadata: this.metadata
    }
  }

  static create(data = {}) {
    return new UserProfile(data)
  }
}

export default UserProfile
