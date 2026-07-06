/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Module:
 * DiagnosticsTypes
 *
 * Purpose:
 * Defines shared diagnostics status levels, component groups
 * and helper functions for the MARS diagnostics framework.
 *
 * Version:
 * v0.13.6
 *
 * Date Code:
 * 040726
 * ==========================================================
 */

export const DIAGNOSTIC_STATUS = Object.freeze({
  ONLINE: 'online',
  READY: 'ready',
  DEGRADED: 'degraded',
  WAITING: 'waiting',
  OFFLINE: 'offline',
  ERROR: 'error',
  UNKNOWN: 'unknown',
})

export const DIAGNOSTIC_SEVERITY = Object.freeze({
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
})

export const DIAGNOSTIC_GROUPS = Object.freeze({
  ROBOT: 'Robot',
  INTELLIGENCE: 'Intelligence',
  PERCEPTION: 'Perception',
  IDENTITY: 'Identity',
  BEHAVIOUR: 'Behaviour',
  DECISION: 'Decision',
  NOTIFICATION: 'Notification & Alerting',
  VOICE: 'Voice',
  PLATFORM: 'Platform',
})

export function createDiagnosticItem({
  id,
  label,
  group = DIAGNOSTIC_GROUPS.PLATFORM,
  status = DIAGNOSTIC_STATUS.UNKNOWN,
  summary = '',
  details = {},
  checks = [],
  timestamp = Date.now(),
}) {
  return {
    id,
    label,
    group,
    status,
    summary,
    details,
    checks,
    timestamp,
  }
}

export function createDiagnosticCheck({
  id,
  label,
  passed = false,
  status = null,
  summary = '',
}) {
  return {
    id,
    label,
    passed: Boolean(passed),
    status: status || (passed ? DIAGNOSTIC_STATUS.READY : DIAGNOSTIC_STATUS.WAITING),
    summary,
  }
}

export function normaliseDiagnosticStatus(status) {
  const value = String(status || '').toLowerCase()

  if (Object.values(DIAGNOSTIC_STATUS).includes(value)) {
    return value
  }

  if (value === 'success' || value === 'active' || value === 'available') {
    return DIAGNOSTIC_STATUS.READY
  }

  if (value === 'failed' || value === 'failure') {
    return DIAGNOSTIC_STATUS.ERROR
  }

  return DIAGNOSTIC_STATUS.UNKNOWN
}

export function getDiagnosticRank(status) {
  const ranks = {
    [DIAGNOSTIC_STATUS.ERROR]: 0,
    [DIAGNOSTIC_STATUS.OFFLINE]: 1,
    [DIAGNOSTIC_STATUS.DEGRADED]: 2,
    [DIAGNOSTIC_STATUS.WAITING]: 3,
    [DIAGNOSTIC_STATUS.UNKNOWN]: 4,
    [DIAGNOSTIC_STATUS.READY]: 5,
    [DIAGNOSTIC_STATUS.ONLINE]: 6,
  }

  return ranks[status] ?? ranks[DIAGNOSTIC_STATUS.UNKNOWN]
}
