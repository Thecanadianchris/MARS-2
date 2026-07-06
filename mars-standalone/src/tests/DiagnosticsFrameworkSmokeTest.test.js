/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Smoke Test:
 * DiagnosticsFrameworkSmokeTest
 *
 * Purpose:
 * Vitest smoke test for the MARS v0.13.6 Diagnostics
 * Stabilisation Framework.
 *
 * Version:
 * v0.13.6
 *
 * Date Code:
 * 050726
 * ==========================================================
 */

import { describe, expect, it } from 'vitest'
import { DiagnosticsManager, DIAGNOSTIC_STATUS } from '../services/diagnostics/index.js'
import LivePipelineStore from '../services/livePipeline/LivePipelineStore.js'

describe('Diagnostics Framework Smoke Test', () => {
  it('creates a safe diagnostics snapshot', () => {
    const snapshot = DiagnosticsManager.runDiagnostics()

    expect(snapshot).toBeDefined()
    expect(snapshot.version).toBe('v0.13.6')
    expect(snapshot.module).toBe('Diagnostics Stabilisation Framework')
    expect(snapshot.status).toBeDefined()
    expect(snapshot.items.length).toBeGreaterThan(0)
    expect(snapshot.counts.total).toBe(snapshot.items.length)
    expect(snapshot.stability.objective).toBe('Diagnostics Stabilisation')
  })

  it('reports robot, live pipeline, stability, identity, behaviour, decision and notification capability areas', () => {
    const snapshot = DiagnosticsManager.runDiagnostics()
    const ids = snapshot.items.map((item) => item.id)

    expect(ids).toContain('robot-onboard-platform')
    expect(ids).toContain('live-pipeline-wiring')
    expect(ids).toContain('diagnostics-stabilisation')
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

  it('marks diagnostics stabilisation as waiting before the first live pipeline frame', () => {
    LivePipelineStore.clear()

    const snapshot = DiagnosticsManager.runDiagnostics()
    const stability = snapshot.items.find((item) => item.id === 'diagnostics-stabilisation')

    expect(stability).toBeDefined()
    expect(stability.status).toBe(DIAGNOSTIC_STATUS.WAITING)
    expect(stability.details.liveResultAvailable).toBe(false)
    expect(stability.details.missingFields.length).toBeGreaterThan(0)
  })
})
