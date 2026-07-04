/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Module:
 * NotificationProfiles
 *
 * Purpose:
 * Provides user notification profile templates for M2.5.
 *
 * Version:
 * v0.13.9
 * Date Code:
 * 040726
 * ==========================================================
 */

import { NOTIFICATION_PRIORITY } from './NotificationPriority'
import { NOTIFICATION_TARGET } from './NotificationTargets'

export const NOTIFICATION_PROFILE_TYPE = Object.freeze({
  OWNER: 'owner',
  PROTECTED_USER: 'protected_user',
  TRUSTED_CONTACT: 'trusted_contact',
  SYSTEM: 'system'
})

export const DEFAULT_NOTIFICATION_PROFILES = Object.freeze([
  {
    id: 'owner-default',
    label: 'Owner Default',
    type: NOTIFICATION_PROFILE_TYPE.OWNER,
    minimumPriority: NOTIFICATION_PRIORITY.OBSERVATION,
    targets: [
      NOTIFICATION_TARGET.ANDROID_NOTIFICATION,
      NOTIFICATION_TARGET.ROBOT_VOICE,
      NOTIFICATION_TARGET.BASE_STATION
    ],
    escalation: 'manual',
    description: 'Default local owner notification profile.'
  },
  {
    id: 'protected-user-assistive',
    label: 'Protected User Assistive',
    type: NOTIFICATION_PROFILE_TYPE.PROTECTED_USER,
    minimumPriority: NOTIFICATION_PRIORITY.ATTENTION,
    targets: [
      NOTIFICATION_TARGET.ANDROID_NOTIFICATION,
      NOTIFICATION_TARGET.GALAXY_WATCH,
      NOTIFICATION_TARGET.TRUSTED_CONTACT,
      NOTIFICATION_TARGET.BASE_STATION
    ],
    escalation: 'assistive-review',
    description: 'Assistive profile for vulnerable or supported users. Non-medical alerting only.'
  },
  {
    id: 'system-diagnostics',
    label: 'System Diagnostics',
    type: NOTIFICATION_PROFILE_TYPE.SYSTEM,
    minimumPriority: NOTIFICATION_PRIORITY.INFORMATION,
    targets: [
      NOTIFICATION_TARGET.ANDROID_NOTIFICATION,
      NOTIFICATION_TARGET.BASE_STATION
    ],
    escalation: 'none',
    description: 'Local diagnostics and engineering notifications.'
  }
])

export function getNotificationProfile(profileId = 'owner-default') {
  return DEFAULT_NOTIFICATION_PROFILES.find((profile) => profile.id === profileId) || DEFAULT_NOTIFICATION_PROFILES[0]
}
