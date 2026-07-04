/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Hook:
 * useIdentityFoundation
 *
 * Purpose:
 * Provides UI-ready Identity Foundation state for the MARS
 * v0.13.5 M2.2 Identity Panel.
 *
 * Identity answers who MARS may be observing. It does not make
 * medical, permission or alerting decisions.
 *
 * Version:
 * v0.13.5
 *
 * Date Code:
 * 040726
 * ==========================================================
 */

import { useMemo, useState } from 'react'
import IdentityEngine from '@/services/identity/IdentityEngine'
import PersonRegistry from '@/services/identity/PersonRegistry'

const IDENTITY_SCENARIOS = Object.freeze({
  NO_PERSON: 'no_person',
  UNKNOWN_PERSON: 'unknown_person',
  CHRISTIAN: 'christian',
  ANN: 'ann',
  FINLEY: 'finley',
})

export default function useIdentityFoundation() {
  const [scenario, setScenario] = useState(IDENTITY_SCENARIOS.NO_PERSON)
  const [refreshToken, setRefreshToken] = useState(0)

  const profiles = useMemo(() => PersonRegistry.listProfiles(), [refreshToken])
  const pendingProfiles = useMemo(() => PersonRegistry.listPendingProfiles(), [refreshToken])

  const identityResult = useMemo(() => {
    if (scenario === IDENTITY_SCENARIOS.NO_PERSON) {
      return IdentityEngine.evaluate(null)
    }

    if (scenario === IDENTITY_SCENARIOS.UNKNOWN_PERSON) {
      return IdentityEngine.evaluate(createMockPerceptionResult(), {
        trackingOptions: {
          trackingId: 'ui-demo-unknown',
        },
      })
    }

    return IdentityEngine.evaluate(createMockPerceptionResult(), {
      profileId: scenario,
      trackingOptions: {
        trackingId: `ui-demo-${scenario}`,
      },
    })
  }, [scenario, refreshToken])

  const diagnostics = useMemo(() => IdentityEngine.getDiagnostics(), [refreshToken])

  const capabilities = useMemo(
    () => [
      {
        id: 'identity-state-machine',
        label: 'Identity State Machine',
        ready: Boolean(diagnostics.capabilities?.identityStateMachine),
        summary: 'Converts neutral perception into safe identity states.',
      },
      {
        id: 'local-profile-registry',
        label: 'Local Profile Registry',
        ready: Boolean(diagnostics.capabilities?.localProfileRegistry),
        summary: 'Stores current local profiles for known household users.',
      },
      {
        id: 'pending-profile-workflow',
        label: 'Pending Profile Workflow',
        ready: Boolean(diagnostics.capabilities?.pendingProfileWorkflow),
        summary: 'Allows unknown people to become pending profiles without trust.',
      },
      {
        id: 'face-recognition-provider',
        label: 'Face Recognition Provider',
        ready: Boolean(diagnostics.capabilities?.faceRecognition),
        planned: true,
        summary: 'Planned identity sensor. Face recognition is part of Identity but not the whole subsystem.',
      },
      {
        id: 'voice-recognition-provider',
        label: 'Voice Recognition Provider',
        ready: Boolean(diagnostics.capabilities?.voiceRecognition),
        planned: true,
        summary: 'Planned identity sensor for future speaker recognition.',
      },
      {
        id: 'watch-association',
        label: 'Wearable Association',
        ready: false,
        planned: true,
        summary: 'Future Galaxy Watch link for heart-rate and emergency-trigger input.',
      },
    ],
    [diagnostics]
  )

  const selectScenario = (nextScenario) => {
    setScenario(nextScenario)
  }

  const refresh = () => {
    setRefreshToken((value) => value + 1)
  }

  return {
    scenario,
    scenarios: IDENTITY_SCENARIOS,
    profiles,
    pendingProfiles,
    identityResult,
    diagnostics,
    capabilities,
    selectScenario,
    refresh,
  }
}

function createMockPerceptionResult() {
  return {
    status: 'success',
    provider: 'IDENTITY_PANEL_UI_SIMULATION',
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
