/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Module:
 * NotificationChannels
 *
 * Purpose:
 * Defines notification channels for current and future MARS
 * notification delivery systems.
 *
 * Version:
 * v0.13.2
 *
 * Date Code:
 * 040726
 * ==========================================================
 */

export const NOTIFICATION_CHANNELS = Object.freeze({
  LOCAL_APP: 'LOCAL_APP',
  ANDROID: 'ANDROID',
  BASE_STATION: 'BASE_STATION',
  CLOUD_RELAY: 'CLOUD_RELAY',
  EMAIL: 'EMAIL',
  SMS: 'SMS'
})

export const ACTIVE_CHANNELS_V0132 = Object.freeze([
  NOTIFICATION_CHANNELS.LOCAL_APP
])

export default NOTIFICATION_CHANNELS
