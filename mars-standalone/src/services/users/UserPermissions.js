/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Module:
 * UserPermissions
 *
 * Purpose:
 * Defines the permission model for MARS user management.
 *
 * Version:
 * v0.13.2
 *
 * Date Code:
 * 040726
 * ==========================================================
 */

import { USER_ROLES } from './UserRoles'

export const USER_PERMISSIONS = Object.freeze({
  MANAGE_USERS: 'MANAGE_USERS',
  CONFIRM_IDENTITY: 'CONFIRM_IDENTITY',
  RECEIVE_ALERTS: 'RECEIVE_ALERTS',
  RECEIVE_PROTECTED_USER_ALERTS: 'RECEIVE_PROTECTED_USER_ALERTS',
  CONTROL_ROBOT: 'CONTROL_ROBOT',
  VIEW_DIAGNOSTICS: 'VIEW_DIAGNOSTICS',
  BLOCK_USER: 'BLOCK_USER'
})

const ROLE_PERMISSIONS = Object.freeze({
  [USER_ROLES.OWNER]: Object.freeze([
    USER_PERMISSIONS.MANAGE_USERS,
    USER_PERMISSIONS.CONFIRM_IDENTITY,
    USER_PERMISSIONS.RECEIVE_ALERTS,
    USER_PERMISSIONS.RECEIVE_PROTECTED_USER_ALERTS,
    USER_PERMISSIONS.CONTROL_ROBOT,
    USER_PERMISSIONS.VIEW_DIAGNOSTICS,
    USER_PERMISSIONS.BLOCK_USER
  ]),
  [USER_ROLES.ADMINISTRATOR]: Object.freeze([
    USER_PERMISSIONS.MANAGE_USERS,
    USER_PERMISSIONS.CONFIRM_IDENTITY,
    USER_PERMISSIONS.RECEIVE_ALERTS,
    USER_PERMISSIONS.RECEIVE_PROTECTED_USER_ALERTS,
    USER_PERMISSIONS.CONTROL_ROBOT,
    USER_PERMISSIONS.VIEW_DIAGNOSTICS
  ]),
  [USER_ROLES.TRUSTED_USER]: Object.freeze([
    USER_PERMISSIONS.CONFIRM_IDENTITY,
    USER_PERMISSIONS.RECEIVE_ALERTS,
    USER_PERMISSIONS.CONTROL_ROBOT
  ]),
  [USER_ROLES.PROTECTED_USER]: Object.freeze([]),
  [USER_ROLES.GUEST]: Object.freeze([]),
  [USER_ROLES.UNKNOWN]: Object.freeze([]),
  [USER_ROLES.BLOCKED]: Object.freeze([])
})

class UserPermissions {
  getPermissions(role = USER_ROLES.UNKNOWN) {
    return [...(ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS[USER_ROLES.UNKNOWN])]
  }

  hasPermission(role = USER_ROLES.UNKNOWN, permission) {
    return this.getPermissions(role).includes(permission)
  }

  canConfirmIdentity(role = USER_ROLES.UNKNOWN) {
    return this.hasPermission(role, USER_PERMISSIONS.CONFIRM_IDENTITY)
  }

  canReceiveAlerts(role = USER_ROLES.UNKNOWN) {
    return this.hasPermission(role, USER_PERMISSIONS.RECEIVE_ALERTS)
  }

  canReceiveProtectedUserAlerts(role = USER_ROLES.UNKNOWN) {
    return this.hasPermission(role, USER_PERMISSIONS.RECEIVE_PROTECTED_USER_ALERTS)
  }
}

export default new UserPermissions()
