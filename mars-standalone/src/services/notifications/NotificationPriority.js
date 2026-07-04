/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Module:
 * NotificationPriority
 *
 * Purpose:
 * Defines the notification priority model for M2.5.
 *
 * Version:
 * v0.13.9
 * Date Code:
 * 040726
 * ==========================================================
 */

export const NOTIFICATION_PRIORITY = Object.freeze({
  INFORMATION: 'information',
  OBSERVATION: 'observation',
  ATTENTION: 'attention',
  ASSIST: 'assist',
  CRITICAL: 'critical'
})

export const NOTIFICATION_PRIORITY_LABELS = Object.freeze({
  [NOTIFICATION_PRIORITY.INFORMATION]: 'Information',
  [NOTIFICATION_PRIORITY.OBSERVATION]: 'Observation',
  [NOTIFICATION_PRIORITY.ATTENTION]: 'Attention',
  [NOTIFICATION_PRIORITY.ASSIST]: 'Assist',
  [NOTIFICATION_PRIORITY.CRITICAL]: 'Critical'
})

export const NOTIFICATION_PRIORITY_SCORES = Object.freeze({
  [NOTIFICATION_PRIORITY.INFORMATION]: 10,
  [NOTIFICATION_PRIORITY.OBSERVATION]: 25,
  [NOTIFICATION_PRIORITY.ATTENTION]: 45,
  [NOTIFICATION_PRIORITY.ASSIST]: 70,
  [NOTIFICATION_PRIORITY.CRITICAL]: 90
})

export function normaliseNotificationPriority(priority) {
  const value = String(priority || '').toLowerCase()

  if (Object.values(NOTIFICATION_PRIORITY).includes(value)) {
    return value
  }

  if (value === 'low') return NOTIFICATION_PRIORITY.INFORMATION
  if (value === 'normal' || value === 'medium') return NOTIFICATION_PRIORITY.OBSERVATION
  if (value === 'high') return NOTIFICATION_PRIORITY.ASSIST
  if (value === 'urgent') return NOTIFICATION_PRIORITY.CRITICAL

  return NOTIFICATION_PRIORITY.INFORMATION
}

export function getNotificationPriorityLabel(priority) {
  const safePriority = normaliseNotificationPriority(priority)
  return NOTIFICATION_PRIORITY_LABELS[safePriority]
}

export function getNotificationPriorityScore(priority) {
  const safePriority = normaliseNotificationPriority(priority)
  return NOTIFICATION_PRIORITY_SCORES[safePriority]
}
