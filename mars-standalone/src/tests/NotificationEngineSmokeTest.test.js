/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Smoke Test:
 * NotificationEngineSmokeTest
 *
 * Purpose:
 * Verifies v0.13.9 M2.5 Notification & Alerting without
 * external delivery services.
 *
 * Version:
 * v0.13.9
 * Date Code:
 * 040726
 * ==========================================================
 */

import { beforeEach, describe, expect, test } from 'vitest'
import {
  NotificationEngine,
  NOTIFICATION_PRIORITY,
  NOTIFICATION_TARGET,
  DEFAULT_NOTIFICATION_PROFILES
} from '../services/notifications'

beforeEach(() => {
  NotificationEngine.clearHistory()
})

describe('Notification Engine Smoke Test', () => {
  test('waits safely when no decision output exists', () => {
    const result = NotificationEngine.evaluateDecision(null)

    expect(result.status).toBe('waiting')
    expect(result.notification).toBeNull()
    expect(result.capabilityState.state).toBe('waiting')
  })

  test('queues assistive notification from simulated decision output', () => {
    const result = NotificationEngine.evaluateDecision({
      dataState: 'simulation',
      notificationPriority: NOTIFICATION_PRIORITY.ASSIST,
      diagnosticStatement: 'Assistive decision simulation.',
      highestRecommendation: {
        label: 'Notify trusted contact'
      }
    }, 'protected-user-assistive')

    expect(result.status).toBe('queued')
    expect(result.notification.medicalDiagnosis).toBe(false)
    expect(result.notification.targets).toContain(NOTIFICATION_TARGET.TRUSTED_CONTACT)
  })

  test('supports notification profiles and targets', () => {
    expect(DEFAULT_NOTIFICATION_PROFILES.length).toBeGreaterThanOrEqual(3)
    expect(DEFAULT_NOTIFICATION_PROFILES[1].targets).toContain(NOTIFICATION_TARGET.GALAXY_WATCH)
  })

  test('preserves simulation state instead of presenting live delivery', () => {
    const result = NotificationEngine.evaluateDecision({
      dataState: 'simulation',
      notificationPriority: NOTIFICATION_PRIORITY.CRITICAL,
      diagnosticStatement: 'Critical simulation.',
      highestRecommendation: {
        label: 'Escalate assistive alert'
      }
    }, 'protected-user-assistive')

    expect(result.capabilityState.state).toBe('simulation')
    expect(result.notification.status).toBe('queued')
  })
})
