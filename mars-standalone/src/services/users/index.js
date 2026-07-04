/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Module:
 * User Services Index
 *
 * Purpose:
 * Provides stable exports for the MARS User Management layer.
 *
 * Version:
 * v0.13.2
 *
 * Date Code:
 * 040726
 * ==========================================================
 */

export { default as UserManager } from './UserManager'
export { default as UserProfile } from './UserProfile'
export { default as UserPermissions, USER_PERMISSIONS } from './UserPermissions'
export { default as ProtectedUserService } from './ProtectedUserService'
export { USER_ROLES, USER_ROLE_PRIORITY, isValidUserRole, getRolePriority } from './UserRoles'
