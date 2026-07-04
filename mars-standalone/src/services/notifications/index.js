/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Module:
 * Notification Services Index
 *
 * Purpose:
 * Provides stable exports for the MARS Notification layer.
 *
 * Version:
 * v0.13.9
 * Date Code:
 * 040726
 * ==========================================================
 */

export { default as NotificationEngine } from './NotificationEngine'
export { default as NotificationManager } from './NotificationManager'
export { default as NotificationPolicy, NOTIFICATION_PRIORITIES, NOTIFICATION_TYPES } from './NotificationPolicy'
export { default as NotificationQueue } from './NotificationQueue'
export { default as NotificationHistory } from './NotificationHistory'
export { NOTIFICATION_CHANNELS, ACTIVE_CHANNELS_V0132 } from './NotificationChannels'
export {
  NOTIFICATION_PRIORITY,
  NOTIFICATION_PRIORITY_LABELS,
  NOTIFICATION_PRIORITY_SCORES,
  getNotificationPriorityLabel,
  getNotificationPriorityScore,
  normaliseNotificationPriority
} from './NotificationPriority'
export {
  NOTIFICATION_TARGET,
  NOTIFICATION_TARGET_STATUS,
  NOTIFICATION_TARGETS,
  getNotificationTarget
} from './NotificationTargets'
export {
  DEFAULT_NOTIFICATION_PROFILES,
  NOTIFICATION_PROFILE_TYPE,
  getNotificationProfile
} from './NotificationProfiles'
