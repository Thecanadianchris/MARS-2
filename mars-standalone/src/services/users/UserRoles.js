/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Module:
 * UserRoles
 *
 * Purpose:
 * Defines the standard user roles used by the MARS User
 * Management architecture.
 *
 * Version:
 * v0.13.2
 *
 * Date Code:
 * 040726
 * ==========================================================
 */

export const USER_ROLES = Object.freeze({
  OWNER: 'OWNER',
  ADMINISTRATOR: 'ADMINISTRATOR',
  TRUSTED_USER: 'TRUSTED_USER',
  PROTECTED_USER: 'PROTECTED_USER',
  GUEST: 'GUEST',
  UNKNOWN: 'UNKNOWN',
  BLOCKED: 'BLOCKED'
})

export const USER_ROLE_PRIORITY = Object.freeze({
  [USER_ROLES.OWNER]: 100,
  [USER_ROLES.ADMINISTRATOR]: 90,
  [USER_ROLES.TRUSTED_USER]: 80,
  [USER_ROLES.PROTECTED_USER]: 70,
  [USER_ROLES.GUEST]: 40,
  [USER_ROLES.UNKNOWN]: 10,
  [USER_ROLES.BLOCKED]: 0
})

export function isValidUserRole(role) {
  return Object.values(USER_ROLES).includes(role)
}

export function getRolePriority(role) {
  return USER_ROLE_PRIORITY[role] ?? USER_ROLE_PRIORITY[USER_ROLES.UNKNOWN]
}

export default USER_ROLES
