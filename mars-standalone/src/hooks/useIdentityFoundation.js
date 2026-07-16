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

import { useEffect, useMemo, useState } from 'react'
import IdentityEngine from '@/services/identity/IdentityEngine'
import PersonRegistry from '@/services/identity/PersonRegistry'
import LivePipelineStore from '@/services/livePipeline/LivePipelineStore'
import {
  CAPABILITY_STATE,
  createCapabilityState,
  createSimulationState,
  createWaitingState,
} from '@/services/capabilityState'

// v0.16.1: poll interval for surfacing the live-camera identity result
// on the Identity tab. LivePipelineStore has no subscribe/event model,
// so this hook re-reads its snapshot on a short timer rather than
// wiring a new pub/sub layer for one consumer.
const LIVE_POLL_INTERVAL_MS = 500

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
  const [liveTick, setLiveTick] = useState(0)

  // v0.16.1: while no simulation scenario is explicitly selected, poll
  // the live camera pipeline so this panel can show the real identity
  // result instead of always sitting on the simulation-only "waiting"
  // state. An explicit simulation button still always wins.
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveTick((value) => value + 1)
    }, LIVE_POLL_INTERVAL_MS)

    return () => clearInterval(interval)
  }, [])

  const livePipelineResult = useMemo(
    () => LivePipelineStore.getLatestResult(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [liveTick]
  )
  const livePipelineStatus = useMemo(
    () => LivePipelineStore.getStatus(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [liveTick]
  )

  const liveIdentityActive = Boolean(
    livePipelineStatus.healthy &&
      !livePipelineStatus.stale &&
      livePipelineResult?.identity
  )

  const profiles = useMemo(() => PersonRegistry.listProfiles(), [refreshToken])
  const pendingProfiles = useMemo(() => PersonRegistry.listPendingProfiles(), [refreshToken])

  const identityResult = useMemo(() => {
    if (scenario === IDENTITY_SCENARIOS.NO_PERSON) {
      if (liveIdentityActive) {
        return livePipelineResult.identity
      }

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
  }, [scenario, refreshToken, liveIdentityActive, livePipelineResult])

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
        planned: false,
        summary: 'v0.16.1: on-device face-embedding matcher active (128-d descriptor, real face-verification model). Face recognition is part of Identity but not the whole subsystem.',
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

  const capabilityState = useMemo(() => {
    if (scenario === IDENTITY_SCENARIOS.NO_PERSON) {
      if (liveIdentityActive) {
        return createCapabilityState({
          state: CAPABILITY_STATE.LIVE,
          label: 'Identity',
          source: 'live-camera',
          message: livePipelineResult.identity.summary || 'Live camera identity active.',
          confidence: (livePipelineResult.identity.confidence || 0) / 100,
          lastUpdate: livePipelineResult.livePipeline?.updatedAt || null,
        })
      }

      return createWaitingState({
        label: 'Identity',
        source: 'identity-foundation',
        message: 'Waiting for a person to be observed.',
      })
    }

    return createSimulationState({
      label: 'Identity',
      source: 'identity-foundation-scenario',
      message: 'Scenario simulation is active. Not live face recognition.',
    })
  }, [scenario, liveIdentityActive, livePipelineResult])

  const selectScenario = (nextScenario) => {
    setScenario(nextScenario)
  }

  const clearSimulation = () => {
    setScenario(IDENTITY_SCENARIOS.NO_PERSON)
  }

  const refresh = () => {
    setRefreshToken((value) => value + 1)
  }

  // v0.16.8: lets the Identity tab add/remove a local profile directly
  // (the owner explicitly naming a new person), bumping refreshToken
  // so `profiles` picks up the change immediately — FaceEnrollmentPanel
  // already renders an Enroll row for whatever PersonRegistry knows
  // about, so this is the only wiring a new person needs.
  const addPerson = ({ displayName, userType }) => {
    const result = IdentityEngine.addPerson({ displayName, userType })

    if (result.status === 'success') {
      setRefreshToken((value) => value + 1)
    }

    return result
  }

  const removePerson = (profileId) => {
    const result = IdentityEngine.removePerson(profileId)

    if (result.status === 'success') {
      setRefreshToken((value) => value + 1)
    }

    return result
  }

  return {
    scenario,
    scenarios: IDENTITY_SCENARIOS,
    profiles,
    pendingProfiles,
    identityResult,
    diagnostics,
    capabilities,
    capabilityState,
    selectScenario,
    refresh,
    clearSimulation,
    addPerson,
    removePerson,
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
