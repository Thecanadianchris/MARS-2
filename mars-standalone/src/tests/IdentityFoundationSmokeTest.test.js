/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Smoke Test:
 * IdentityFoundationSmokeTest
 *
 * Purpose:
 * Vitest smoke test for the MARS v0.13.0 Identity Foundation.
 *
 * Version:
 * v0.13.0
 *
 * Date Code:
 * 030726
 * ==========================================================
 */

import { describe, expect, it } from 'vitest'
import IdentityEngine from '../services/identity/IdentityEngine.js'
import PersonRegistry from '../services/identity/PersonRegistry.js'
import { IDENTITY_STATES, IDENTITY_USER_TYPES } from '../services/identity/IdentityTypes.js'

describe('Identity Foundation Smoke Test', () => {
  it('handles missing perception input safely', () => {
    const result = IdentityEngine.evaluate(null)

    expect(result).toBeDefined()
    expect(result.status).toBe('success')
    expect(result.state).toBe(IDENTITY_STATES.NO_PERSON)
    expect(result.profile.displayName).toBe('No person')
  })

  it('keeps a visible but unrecognised person unknown once recognition patience runs out', () => {
    IdentityEngine.reset()

    // v0.16: a face is given a short patience window (SEARCHING state)
    // before the state machine settles on UNKNOWN — exhaust it here on
    // a fixed tracking id to reach the same steady-state this test
    // originally asserted on the very first frame.
    const trackingOptions = { trackingId: 'foundation-unrecognised-test' }
    IdentityEngine.evaluate(createMockPerceptionResult(), { trackingOptions })
    IdentityEngine.evaluate(createMockPerceptionResult(), { trackingOptions })
    const result = IdentityEngine.evaluate(createMockPerceptionResult(), { trackingOptions })

    expect(result.status).toBe('success')
    expect(result.state).toBe(IDENTITY_STATES.UNKNOWN)
    expect(result.known).toBe(false)
    expect(result.trusted).toBe(false)
    expect(result.requiresTrustedUserConfirmation).toBe(true)
  })

  it('recognises a supplied protected profile without diagnosis', () => {
    const result = IdentityEngine.evaluate(createMockPerceptionResult(), {
      profileId: 'finley',
    })

    expect(result.status).toBe('success')
    expect(result.state).toBe(IDENTITY_STATES.PROTECTED)
    expect(result.profile.id).toBe('finley')
    expect(result.profile.userType).toBe(IDENTITY_USER_TYPES.PROTECTED_USER)
    expect(result.protected).toBe(true)
  })

  it('never auto-promotes a pending profile to trusted', () => {
    IdentityEngine.reset()

    const pendingResult = IdentityEngine.createPendingProfile({
      displayName: 'Unknown visitor',
    })

    expect(pendingResult.status).toBe('success')
    expect(pendingResult.profile.trusted).toBe(false)
    expect(pendingResult.profile.userType).toBe(IDENTITY_USER_TYPES.UNKNOWN)
    expect(pendingResult.requiresTrustedUserConfirmation).toBe(true)
  })

  it('requires a trusted actor before confirming a pending profile', () => {
    IdentityEngine.reset()

    const pendingResult = IdentityEngine.createPendingProfile({
      displayName: 'Possible guest',
    })

    const rejected = IdentityEngine.confirmPendingProfile(
      pendingResult.profile.id,
      {
        displayName: 'Possible guest',
        userType: IDENTITY_USER_TYPES.GUEST,
      },
      {
        userType: IDENTITY_USER_TYPES.UNKNOWN,
        trusted: false,
      }
    )

    expect(rejected.status).toBe('rejected')

    const approved = IdentityEngine.confirmPendingProfile(
      pendingResult.profile.id,
      {
        id: 'guest-001',
        displayName: 'Possible guest',
        userType: IDENTITY_USER_TYPES.GUEST,
        trusted: false,
      },
      PersonRegistry.getProfile('christian')
    )

    expect(approved.status).toBe('success')
    expect(approved.profile.trusted).toBe(false)
    expect(approved.profile.userType).toBe(IDENTITY_USER_TYPES.GUEST)
  })
})

function createMockPerceptionResult() {
  return {
    status: 'success',
    provider: 'IDENTITY_SMOKE_TEST',
    timestamp: Date.now(),
    detections: {
      people: 1,
      faces: 1,
    },
    faceFoundation: {
      faceDetected: true,
      faceCount: 1,
      confidence: 80,
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
          confidence: 80,
        },
      ],
    },
  }
}
