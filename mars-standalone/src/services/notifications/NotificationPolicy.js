/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Service:
 * NotificationPolicy
 *
 * Purpose:
 * Converts decisions and user context into notification policy
 * outcomes without delivering the notification directly.
 *
 * Version:
 * v0.13.2
 *
 * Date Code:
 * 040726
 * ==========================================================
 */

import { USER_ROLES } from '../users/UserRoles'
import UserPermissions from '../users/UserPermissions'
import { ACTIVE_CHANNELS_V0132 } from './NotificationChannels'

export const NOTIFICATION_PRIORITIES = Object.freeze({
  LOW: 'LOW',
  NORMAL: 'NORMAL',
  HIGH: 'HIGH',
  URGENT: 'URGENT'
})

export const NOTIFICATION_TYPES = Object.freeze({
  UNKNOWN_PERSON: 'UNKNOWN_PERSON',
  PROTECTED_USER_ATTENTION: 'PROTECTED_USER_ATTENTION',
  BLOCKED_USER: 'BLOCKED_USER',
  SYSTEM_DIAGNOSTIC: 'SYSTEM_DIAGNOSTIC',
  GENERAL_DECISION: 'GENERAL_DECISION'
})

class NotificationPolicy {
  evaluate(decision = {}, userContext = {}) {
    const safeDecision = decision || {}
    const safeUserContext = userContext || {}
    const user = safeUserContext.user || {}

    if (user.role === USER_ROLES.BLOCKED || user.blocked) {
      return this.createPolicy({
        allowed: true,
        type: NOTIFICATION_TYPES.BLOCKED_USER,
        priority: NOTIFICATION_PRIORITIES.URGENT,
        reason: 'Blocked user context requires owner attention.'
      })
    }

    if (safeUserContext.requiresTrustedUserConfirmation || user.role === USER_ROLES.UNKNOWN) {
      return this.createPolicy({
        allowed: true,
        type: NOTIFICATION_TYPES.UNKNOWN_PERSON,
        priority: NOTIFICATION_PRIORITIES.HIGH,
        reason: 'Unknown person requires authorised user review.'
      })
    }

    if (safeUserContext.protectedUserContext?.protected) {
      return this.createPolicy({
        allowed: true,
        type: NOTIFICATION_TYPES.PROTECTED_USER_ATTENTION,
        priority: NOTIFICATION_PRIORITIES.HIGH,
        reason: 'Protected user context increases notification priority.'
      })
    }

    if (safeDecision.priority === 'high' || safeDecision.priority === 'urgent') {
      return this.createPolicy({
        allowed: true,
        type: NOTIFICATION_TYPES.GENERAL_DECISION,
        priority: safeDecision.priority === 'urgent'
          ? NOTIFICATION_PRIORITIES.URGENT
          : NOTIFICATION_PRIORITIES.HIGH,
        reason: 'Decision priority requires notification.'
      })
    }

    return this.createPolicy({
      allowed: false,
      type: NOTIFICATION_TYPES.GENERAL_DECISION,
      priority: NOTIFICATION_PRIORITIES.NORMAL,
      reason: 'No notification required for current decision context.'
    })
  }

  getAuthorisedRecipients(users = [], type = NOTIFICATION_TYPES.GENERAL_DECISION) {
    const safeUsers = Array.isArray(users) ? users : []

    return safeUsers.filter((user) => {
      if (!user || user.blocked || user.notificationEnabled === false) {
        return false
      }

      if (type === NOTIFICATION_TYPES.PROTECTED_USER_ATTENTION) {
        return UserPermissions.canReceiveProtectedUserAlerts(user.role)
      }

      return UserPermissions.canReceiveAlerts(user.role)
    })
  }

  createPolicy({ allowed, type, priority, reason }) {
    return {
      allowed: Boolean(allowed),
      type,
      priority,
      reason,
      channels: [...ACTIVE_CHANNELS_V0132],
      medicalDiagnosis: false
    }
  }
}

export default new NotificationPolicy()
