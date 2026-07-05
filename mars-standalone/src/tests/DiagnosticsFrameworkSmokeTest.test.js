/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Smoke Test:
 * DiagnosticsFrameworkSmokeTest
 *
 * Purpose:
 * Vitest smoke test for the MARS v0.13.5 Live Pipeline
 * Diagnostics Framework.
 *
 * Version:
 * v0.13.5
 *
 * Date Code:
 * 050726
 * ==========================================================
 */

import { describe, expect, it } from 'vitest'
import { DiagnosticsManager, DIAGNOSTIC_STATUS } from '../services/diagnostics/index.js'

describe('Diagnostics Framework Smoke Test', () => {
  it('creates a safe diagnostics snapshot', () => {
    const snapshot = DiagnosticsManager.runDiagnostics()

    expect(snapshot).toBeDefined()
    expect(snapshot.version).toBe('v0.13.5')
    expect(snapshot.module).toBe('Live Pipeline Diagnostics Framework')
    expect(snapshot.status).toBeDefined()
    expect(snapshot.items.length).toBeGreaterThan(0)
    expect(snapshot.counts.total).toBe(snapshot.items.length)
  })

  it('reports robot, live pipeline, identity, behaviour, decision and notification capability areas', () => {
    const snapshot = DiagnosticsManager.runDiagnostics()
    const ids = snapshot.items.map((item) => item.id)

    expect(ids).toContain('robot-onboard-platform')
    expect(ids).toContain('live-pipeline-wiring')
    expect(ids).toContain('identity-foundation')
    expect(ids).toContain('behaviour-live-intelligence')
    expect(ids).toContain('decision-engine')
    expect(ids).toContain('notification-alerting')
  })

  it('keeps optional base station and cloud services non-blocking', () => {
    const snapshot = DiagnosticsManager.runDiagnostics()
    const baseStation = snapshot.items.find((item) => item.id === 'base-station')
    const cloud = snapshot.items.find((item) => item.id === 'optional-cloud-services')

    expect(baseStation).toBeDefined()
    expect(cloud).toBeDefined()
    expect(baseStation.status).toBe(DIAGNOSTIC_STATUS.WAITING)
    expect(cloud.status).toBe(DIAGNOSTIC_STATUS.WAITING)
    expect(snapshot.status).not.toBe(DIAGNOSTIC_STATUS.ERROR)
  })
})
