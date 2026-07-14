/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Smoke Test:
 * IdentityPanelSmokeTest
 *
 * Purpose:
 * Confirms the v0.13.5 M2.2 Identity Panel has safe data
 * sources for known users, protected users, unknown users and
 * planned identity sensors.
 *
 * Version:
 * v0.13.5
 *
 * Date Code:
 * 040726
 * ==========================================================
 */

import { describe, expect, it } from 'vitest'
import IdentityEngine from '../services/identity/IdentityEngine.js'
import IdentityDiagnosticsService from '../services/identity/IdentityDiagnosticsService.js'
import PersonRegistry from '../services/identity/PersonRegistry.js'
import { IDENTITY_STATES, IDENTITY_USER_TYPES } from '../services/identity/IdentityTypes.js'

describe('Identity Panel Smoke Test', () => {
  it('provides local profiles for the Identity Panel', () => {
    IdentityEngine.reset()

    const profiles = PersonRegistry.listProfiles()

    expect(profiles.length).toBeGreaterThanOrEqual(3)
    expect(profiles.map((profile) => profile.id)).toContain('christian')
    expect(profiles.map((profile) => profile.id)).toContain('ann')
    expect(profiles.map((profile) => profile.id)).toContain('finley')
  })

  it('surfaces protected user identity state safely', () => {
    const result = IdentityEngine.evaluate(createMockPerceptionResult(), {
      profileId: 'finley',
    })

    expect(result.status).toBe('success')
    expect(result.state).toBe(IDENTITY_STATES.PROTECTED)
    expect(result.profile.userType).toBe(IDENTITY_USER_TYPES.PROTECTED_USER)
    expect(result.protected).toBe(true)
    expect(result.summary.toLowerCase()).not.toContain('diagnosis')
  })

  it('keeps an unrecognised person in a confirmation workflow once recognition patience runs out', () => {
    IdentityEngine.reset()

    const trackingOptions = { trackingId: 'unrecognised-confirmation-test' }

    // v0.16: the same face is given a short patience window (SEARCHING)
    // before the state machine gives up and reports UNKNOWN — a brief
    // glance shouldn't immediately read as "unrecognised". First frame:
    const firstFrame = IdentityEngine.evaluate(createMockPerceptionResult(), { trackingOptions })
    expect(firstFrame.state).toBe(IDENTITY_STATES.SEARCHING)
    expect(firstFrame.requiresTrustedUserConfirmation).toBe(false)

    // Run out the patience window on the same tracked face.
    IdentityEngine.evaluate(createMockPerceptionResult(), { trackingOptions })
    const result = IdentityEngine.evaluate(createMockPerceptionResult(), { trackingOptions })

    expect(result.status).toBe('success')
    expect(result.state).toBe(IDENTITY_STATES.UNKNOWN)
    expect(result.known).toBe(false)
    expect(result.requiresTrustedUserConfirmation).toBe(true)
  })

  it('reports face recognition active (v0.16) and voice recognition still planned', () => {
    const diagnostics = IdentityDiagnosticsService.evaluate(null)

    expect(diagnostics.capabilities.identityStateMachine).toBe(true)
    expect(diagnostics.capabilities.localProfileRegistry).toBe(true)
    expect(diagnostics.capabilities.pendingProfileWorkflow).toBe(true)
    expect(diagnostics.capabilities.faceRecognition).toBe(true)
    expect(diagnostics.capabilities.voiceRecognition).toBe(false)
  })
})

function createMockPerceptionResult() {
  return {
    status: 'success',
    provider: 'IDENTITY_PANEL_SMOKE_TEST',
    timestamp: Date.now(),
    personPresent: true,
    faceVisible: true,
    detections: {
      people: 1,
      faces: 1,
    },
    faceFoundation: {
      faceDetected: true,
      faceCount: 1,
      confidence: 82,
    },
    observationStream: {
      ids: ['person_present', 'head_visible'],
      observations: [
        {
          id: 'person_present',
          label: 'Person present',
          confidence: 90,
        },
        {
          id: 'head_visible',
          label: 'Head visible',
          confidence: 82,
        },
      ],
    },
  }
}
