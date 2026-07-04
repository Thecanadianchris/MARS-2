/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Smoke Test:
 * NotificationPanelSmokeTest
 *
 * Purpose:
 * Verifies the notification UI-facing hook exposes safe M2.5
 * state without rendering external services.
 *
 * Version:
 * v0.13.9
 * Date Code:
 * 040726
 * ==========================================================
 */

import { describe, expect, test } from 'vitest'
import { NOTIFICATION_TARGETS } from '../services/notifications'

describe('Notification Panel Smoke Test', () => {
  test('defines notification targets for current and future routes', () => {
    const ids = NOTIFICATION_TARGETS.map((target) => target.id)

    expect(ids).toContain('android_notification')
    expect(ids).toContain('galaxy_watch')
    expect(ids).toContain('trusted_contact')
    expect(ids).toContain('base_station')
  })

  test('keeps cloud service optional', () => {
    const cloud = NOTIFICATION_TARGETS.find((target) => target.id === 'cloud_service')

    expect(cloud.status).toBe('optional')
  })
})
