/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Module:
 * NotificationTargets
 *
 * Purpose:
 * Defines supported and planned notification destinations.
 *
 * Version:
 * v0.13.9
 * Date Code:
 * 040726
 * ==========================================================
 */

export const NOTIFICATION_TARGET = Object.freeze({
  ROBOT_VOICE: 'robot_voice',
  ANDROID_NOTIFICATION: 'android_notification',
  GALAXY_WATCH: 'galaxy_watch',
  TRUSTED_CONTACT: 'trusted_contact',
  BASE_STATION: 'base_station',
  CLOUD_SERVICE: 'cloud_service'
})

export const NOTIFICATION_TARGET_STATUS = Object.freeze({
  ACTIVE: 'active',
  LOCAL_ONLY: 'local_only',
  PLANNED: 'planned',
  OPTIONAL: 'optional'
})

export const NOTIFICATION_TARGETS = Object.freeze([
  {
    id: NOTIFICATION_TARGET.ROBOT_VOICE,
    label: 'Robot Voice',
    status: NOTIFICATION_TARGET_STATUS.PLANNED,
    description: 'Future spoken response through the onboard device speaker.'
  },
  {
    id: NOTIFICATION_TARGET.ANDROID_NOTIFICATION,
    label: 'Android Notification',
    status: NOTIFICATION_TARGET_STATUS.LOCAL_ONLY,
    description: 'Local on-device notification from the robot onboard platform.'
  },
  {
    id: NOTIFICATION_TARGET.GALAXY_WATCH,
    label: 'Galaxy Watch',
    status: NOTIFICATION_TARGET_STATUS.PLANNED,
    description: 'Future watch haptics, emergency triggers and heart-rate context.'
  },
  {
    id: NOTIFICATION_TARGET.TRUSTED_CONTACT,
    label: 'Trusted Contact',
    status: NOTIFICATION_TARGET_STATUS.PLANNED,
    description: 'Future alert routing to family members, carers or authorised users.'
  },
  {
    id: NOTIFICATION_TARGET.BASE_STATION,
    label: 'Base Station',
    status: NOTIFICATION_TARGET_STATUS.OPTIONAL,
    description: 'Optional local base station logging, escalation and diagnostics.'
  },
  {
    id: NOTIFICATION_TARGET.CLOUD_SERVICE,
    label: 'Cloud Service',
    status: NOTIFICATION_TARGET_STATUS.OPTIONAL,
    description: 'Optional cloud relay used only when approved and required.'
  }
])

export function getNotificationTarget(targetId) {
  return NOTIFICATION_TARGETS.find((target) => target.id === targetId) || null
}
