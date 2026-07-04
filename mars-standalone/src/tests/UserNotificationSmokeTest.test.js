/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Smoke Test:
 * UserNotificationSmokeTest
 *
 * Purpose:
 * Verifies the v0.13.2 User Management and Notification
 * architecture without requiring Android, cloud services or
 * external notification providers.
 *
 * Version:
 * v0.13.2
 *
 * Date Code:
 * 040726
 * ==========================================================
 */

import { describe, expect, test, beforeEach } from 'vitest'
import { UserManager, USER_ROLES, UserPermissions } from '../services/users'
import { NotificationManager } from '../services/notifications'

beforeEach(() => {
  UserManager.reset()
  NotificationManager.reset()
})

describe('User Management and Notification Smoke Test', () => {
  test('keeps unknown users unauthorised by default', () => {
    const context = UserManager.resolveUserContext({
      state: 'UNKNOWN',
      profile: {
        id: 'unknown',
        displayName: 'Unknown'
      }
    })

    expect(context.user.role).toBe(USER_ROLES.UNKNOWN)
    expect(context.user.authorised).toBe(false)
    expect(context.requiresTrustedUserConfirmation).toBe(true)
  })

  test('allows trusted users to confirm identity', () => {
    expect(UserPermissions.canConfirmIdentity(USER_ROLES.TRUSTED_USER)).toBe(true)
    expect(UserPermissions.canConfirmIdentity(USER_ROLES.UNKNOWN)).toBe(false)
  })

  test('creates protected user context without diagnosis', () => {
    const protectedUser = UserManager.createUser({
      identityProfileId: 'finley-profile',
      displayName: 'Finley',
      role: USER_ROLES.PROTECTED_USER,
      protected: true
    })

    const context = UserManager.resolveUserContext({
      profile: {
        id: protectedUser.identityProfileId,
        displayName: protectedUser.displayName
      }
    })

    expect(context.protectedUserContext.protected).toBe(true)
    expect(context.protectedUserContext.medicalDiagnosis).toBe(false)
  })

  test('queues notification for unknown person decision', () => {
    const owner = UserManager.createUser({
      displayName: 'Christian',
      role: USER_ROLES.OWNER,
      authorised: true
    })

    const context = UserManager.resolveUserContext({
      state: 'UNKNOWN',
      profile: {
        id: 'unknown',
        displayName: 'Unknown'
      }
    })

    const result = NotificationManager.createFromDecision(
      {
        priority: 'high',
        summary: 'Unknown person detected by MARS.'
      },
      context,
      [owner]
    )

    expect(result.status).toBe('queued')
    expect(result.notification.recipients).toHaveLength(1)
    expect(result.notification.medicalDiagnosis).toBe(false)
  })
})
