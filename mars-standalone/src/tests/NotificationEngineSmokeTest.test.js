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
  NotificationManager,
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

  test('surfaces the authored waiting message, not the generic default', () => {
    // Regression guard: createWaitingState was previously called with
    // positional string args, silently discarding the authored message.
    const result = NotificationEngine.evaluateDecision(null)

    expect(result.capabilityState.message).toBe(
      'Waiting for Decision Intelligence output. No notification will be generated.'
    )
    expect(result.capabilityState.source).toBe('decision-intelligence')
  })

  test('surfaces the authored simulation message, not the generic default', () => {
    const result = NotificationEngine.evaluateDecision({
      dataState: 'simulation',
      notificationPriority: NOTIFICATION_PRIORITY.ASSIST,
      diagnosticStatement: 'Assistive decision simulation.'
    }, 'protected-user-assistive')

    expect(result.capabilityState.message).toBe(
      'Developer simulation is active. Notification routing is not live delivery.'
    )
    expect(result.capabilityState.source).toBe('notification-simulation')
  })

  test('NotificationManager.getStatus reports honest live framework state', () => {
    // Regression guard: DiagnosticsManager probes for getStatus() but it
    // never existed, so notification diagnostics always showed a
    // hardcoded fallback.
    expect(typeof NotificationManager.getStatus).toBe('function')

    const status = NotificationManager.getStatus()

    expect(status.status).toBe('available')
    expect(status.internalNotificationsReady).toBe(true)
    // No delivery target is ACTIVE yet — these must stay honestly false
    // until a target genuinely ships (trusted contact and watch are
    // still planned).
    expect(status.trustedContactAlertsReady).toBe(false)
    expect(status.watchInputReady).toBe(false)
    expect(status.activeTargetCount).toBe(0)
    expect(status.targetCount).toBeGreaterThanOrEqual(6)
    expect(status.medicalDiagnosis).toBe(false)
    expect(typeof status.queueCount).toBe('number')
    expect(typeof status.historyCount).toBe('number')
  })

  test('NotificationManager.getStatus history count tracks the engine history', () => {
    const before = NotificationManager.getStatus().historyCount

    NotificationEngine.evaluateDecision({
      dataState: 'simulation',
      notificationPriority: NOTIFICATION_PRIORITY.CRITICAL,
      diagnosticStatement: 'Critical simulation.'
    }, 'protected-user-assistive')

    expect(NotificationManager.getStatus().historyCount).toBe(before + 1)
  })
})
