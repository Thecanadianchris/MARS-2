/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Service:
 * UserManager
 *
 * Purpose:
 * Manages MARS user roles, permissions and protected-user
 * context separately from Identity and Decision Intelligence.
 *
 * Identity answers: "Who is this?"
 * User Manager answers: "What permissions do they have?"
 * Decision Engine answers: "What should MARS do?"
 *
 * Version:
 * v0.13.2
 *
 * Date Code:
 * 040726
 * ==========================================================
 */

import UserProfile from './UserProfile'
import { USER_ROLES, isValidUserRole } from './UserRoles'
import UserPermissions from './UserPermissions'
import ProtectedUserService from './ProtectedUserService'

class UserManager {
  constructor() {
    this.users = new Map()
  }

  createUser(data = {}) {
    const safeData = data || {}
    const profile = UserProfile.create({
      ...safeData,
      role: isValidUserRole(safeData.role) ? safeData.role : USER_ROLES.UNKNOWN
    })

    this.users.set(profile.id, profile)
    return profile.toJSON()
  }

  registerFromIdentity(identityResult = {}, role = USER_ROLES.UNKNOWN, overrides = {}) {
    const safeIdentity = identityResult || {}
    const profile = safeIdentity.profile || {}

    return this.createUser({
      id: overrides.id,
      identityProfileId: profile.id || safeIdentity.profileId || null,
      displayName: overrides.displayName || profile.displayName || 'Unknown User',
      role,
      authorised: role !== USER_ROLES.UNKNOWN && role !== USER_ROLES.BLOCKED,
      protected: role === USER_ROLES.PROTECTED_USER || Boolean(profile.protected),
      blocked: role === USER_ROLES.BLOCKED || Boolean(profile.blocked),
      notificationEnabled: overrides.notificationEnabled,
      metadata: {
        source: 'identity_result',
        identityState: safeIdentity.state || 'UNKNOWN'
      }
    })
  }

  getUser(userId) {
    const user = this.users.get(userId)
    return user ? user.toJSON() : null
  }

  getAllUsers() {
    return Array.from(this.users.values()).map((user) => user.toJSON())
  }

  getUsersByRole(role) {
    return this.getAllUsers().filter((user) => user.role === role)
  }

  resolveUserContext(identityResult = {}) {
    const safeIdentity = identityResult || {}
    const profile = safeIdentity.profile || {}
    const matchedUser = this.findByIdentityProfileId(profile.id)

    const user = matchedUser || {
      id: 'unknown-user',
      identityProfileId: profile.id || null,
      displayName: profile.displayName || 'Unknown User',
      role: USER_ROLES.UNKNOWN,
      authorised: false,
      protected: false,
      blocked: false,
      notificationEnabled: false
    }

    return {
      status: 'success',
      provider: 'LOCAL_USER_MANAGER',
      version: 'v0.13.2',
      user,
      permissions: UserPermissions.getPermissions(user.role),
      protectedUserContext: ProtectedUserService.createProtectedUserContext(user),
      identityLinked: Boolean(matchedUser),
      requiresTrustedUserConfirmation: user.role === USER_ROLES.UNKNOWN
    }
  }

  findByIdentityProfileId(identityProfileId) {
    if (!identityProfileId) {
      return null
    }

    const found = Array.from(this.users.values()).find(
      (user) => user.identityProfileId === identityProfileId
    )

    return found ? found.toJSON() : null
  }

  canConfirmIdentity(userId) {
    const user = this.getUser(userId)
    return UserPermissions.canConfirmIdentity(user?.role)
  }

  reset() {
    this.users.clear()
  }
}

export default new UserManager()
