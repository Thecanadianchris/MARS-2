/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Hook:
 * useBehaviourIntelligence
 *
 * Purpose:
 * Provides the UI-facing state for the v0.13.7a capability
 * state integrity update.
 *
 * Behaviour Intelligence describes observed activity patterns
 * only. It does not diagnose medical conditions.
 *
 * EP-012 — Live Data Integrity:
 * Simulated information shall never be presented as live robot
 * observations.
 *
 * Version:
 * v0.13.8
 * Date Code:
 * 040726
 * ==========================================================
 */

import { useMemo, useState } from 'react'
import {
  BEHAVIOUR_ACTIONS,
  BEHAVIOUR_CONCERN_LEVELS,
  BODY_POSITIONS,
  BehaviourPatternEngine,
  BehaviourProfileMatcher,
  BehaviourProfileRegistry,
  HEAD_DIRECTIONS,
  MOVEMENT_STATES
} from '@/services/behaviour'
import { createSimulationState, createWaitingState } from '@/services/capabilityState'

const SCENARIOS = Object.freeze({
  WAITING: 'waiting',
  NORMAL: 'normal',
  INACTIVE: 'inactive',
  FLOOR: 'floor',
  FINLEY_HEAD_UP_LEFT: 'finley_head_up_left',
  LAYING_IN_BED: 'laying_in_bed'
})

const SCENARIO_LABELS = Object.freeze({
  [SCENARIOS.WAITING]: 'Live waiting',
  [SCENARIOS.NORMAL]: 'Normal simulation',
  [SCENARIOS.INACTIVE]: 'Inactive simulation',
  [SCENARIOS.FLOOR]: 'Floor simulation',
  [SCENARIOS.FINLEY_HEAD_UP_LEFT]: 'Finley sign simulation',
  [SCENARIOS.LAYING_IN_BED]: 'Laying in bed simulation'
})

const SCENARIO_INPUTS = Object.freeze({
  [SCENARIOS.NORMAL]: {
    identityResult: {
      protected: false,
      profile: {
        id: 'christian',
        displayName: 'Christian',
        role: 'owner',
        protected: false
      }
    },
    perceptionResult: {
      bodyPosition: BODY_POSITIONS.STANDING,
      headDirection: HEAD_DIRECTIONS.FORWARD,
      movementState: MOVEMENT_STATES.MOVING,
      confidence: 0.86
    },
    options: {
      inactiveDurationSeconds: 0
    }
  },
  [SCENARIOS.INACTIVE]: {
    identityResult: {
      protected: false,
      profile: {
        id: 'unknown-person',
        displayName: 'Unknown person',
        protected: false
      }
    },
    perceptionResult: {
      bodyPosition: BODY_POSITIONS.SITTING,
      headDirection: HEAD_DIRECTIONS.FORWARD,
      movementState: MOVEMENT_STATES.INACTIVE,
      confidence: 0.68
    },
    options: {
      inactiveDurationSeconds: 210
    }
  },
  [SCENARIOS.FLOOR]: {
    identityResult: {
      protected: false,
      profile: {
        id: 'unknown-person',
        displayName: 'Unknown person',
        protected: false
      }
    },
    perceptionResult: {
      bodyPosition: BODY_POSITIONS.FLOOR,
      headDirection: HEAD_DIRECTIONS.UNKNOWN,
      movementState: MOVEMENT_STATES.STILL,
      confidence: 0.72
    },
    options: {
      inactiveDurationSeconds: 45
    }
  },
  [SCENARIOS.FINLEY_HEAD_UP_LEFT]: {
    identityResult: {
      protected: true,
      profile: {
        id: 'finley',
        displayName: 'Finley',
        role: 'protected_user',
        protected: true
      }
    },
    perceptionResult: {
      bodyPosition: BODY_POSITIONS.SITTING,
      headDirection: HEAD_DIRECTIONS.UP_LEFT,
      movementState: MOVEMENT_STATES.UNUSUAL,
      confidence: 0.78
    },
    options: {
      inactiveDurationSeconds: 30
    }
  },
  [SCENARIOS.LAYING_IN_BED]: {
    identityResult: {
      protected: true,
      profile: {
        id: 'finley',
        displayName: 'Finley',
        role: 'protected_user',
        protected: true
      }
    },
    perceptionResult: {
      bodyPosition: BODY_POSITIONS.LYING,
      headDirection: HEAD_DIRECTIONS.FORWARD,
      movementState: MOVEMENT_STATES.STILL,
      confidence: 0.82
    },
    options: {
      inactiveDurationSeconds: 60,
      behaviourContexts: ['bed', 'bedroom', 'night']
    },
    baseline: {
      normalBodyPositions: [BODY_POSITIONS.LYING, BODY_POSITIONS.SITTING],
      normalHeadDirections: [HEAD_DIRECTIONS.FORWARD, HEAD_DIRECTIONS.LEFT, HEAD_DIRECTIONS.RIGHT, HEAD_DIRECTIONS.UNKNOWN],
      normalMovementStates: [MOVEMENT_STATES.STILL, MOVEMENT_STATES.INACTIVE],
      inactivityConcernSeconds: 28800,
      floorConcernSeconds: 30
    }
  }
})

function createCapabilityStatus(dataState) {
  const waiting = dataState?.isWaiting

  return [
    {
      id: 'live-data-integrity',
      title: 'Live Data Integrity',
      status: 'ready',
      description: 'EP-012 active. Waiting, live and simulation behaviour states are kept separate.'
    },
    {
      id: 'behaviour-pattern-engine',
      title: 'Behaviour Pattern Engine',
      status: waiting ? 'waiting' : 'ready',
      description: 'Converts neutral observations into behaviour intelligence.'
    },
    {
      id: 'body-position-tracking',
      title: 'Body Position Tracking',
      status: waiting ? 'waiting' : 'ready',
      description: 'Tracks standing, sitting, lying, floor and unknown states.'
    },
    {
      id: 'head-direction-tracking',
      title: 'Head Direction Tracking',
      status: waiting ? 'waiting' : 'ready',
      description: 'Supports forward, up, down, left, right and diagonal observations.'
    },
    {
      id: 'movement-state-tracking',
      title: 'Movement State Tracking',
      status: waiting ? 'waiting' : 'ready',
      description: 'Tracks moving, still, inactive, unusual and fall-detected signals.'
    },
    {
      id: 'protected-user-policy',
      title: 'Protected User Policy',
      status: waiting ? 'waiting' : 'ready',
      description: 'Raises observation priority for protected users without diagnosis.'
    },
    {
      id: 'baseline-learning',
      title: 'Behaviour Baseline Learning',
      status: 'planned',
      description: 'Future local learning of normal behaviour patterns per person.'
    },
    {
      id: 'watch-correlation',
      title: 'Watch Data Correlation',
      status: 'planned',
      description: 'Future correlation with watch heart-rate and emergency-trigger input.'
    }
  ]
}

function getStatusFromConcern(concernLevel, capabilityState) {
  if (capabilityState?.isWaiting) return 'waiting'

  if (concernLevel === BEHAVIOUR_CONCERN_LEVELS.HIGH) {
    return 'attention'
  }

  if (concernLevel === BEHAVIOUR_CONCERN_LEVELS.MEDIUM) {
    return 'review'
  }

  if (concernLevel === BEHAVIOUR_CONCERN_LEVELS.LOW) {
    return 'watch'
  }

  return 'ready'
}

function createTimeline(result, capabilityState) {
  if (capabilityState?.isWaiting) {
    return [
      {
        id: 'body-position',
        label: 'Body position',
        value: 'waiting',
        status: 'waiting',
        detail: 'No live posture observation is available.'
      },
      {
        id: 'head-direction',
        label: 'Head direction',
        value: 'waiting',
        status: 'waiting',
        detail: 'No live head orientation signal is available.'
      },
      {
        id: 'movement-state',
        label: 'Movement state',
        value: 'waiting',
        status: 'waiting',
        detail: 'No live movement state is available.'
      },
      {
        id: 'concern-level',
        label: 'Concern level',
        value: 'none',
        status: 'waiting',
        detail: 'No behaviour concern can be calculated without live observation data.'
      }
    ]
  }

  const currentObservation = result.currentObservation || {}
  const observationStream = result.observationStream || {}

  return [
    {
      id: 'body-position',
      label: 'Body position',
      value: observationStream.bodyPosition || BODY_POSITIONS.UNKNOWN,
      status: 'ready',
      detail: 'Neutral posture observation from the selected simulation frame.'
    },
    {
      id: 'head-direction',
      label: 'Head direction',
      value: observationStream.headDirection || HEAD_DIRECTIONS.UNKNOWN,
      status: 'ready',
      detail: 'Head orientation signal. This is a sign only, not a diagnosis.'
    },
    {
      id: 'movement-state',
      label: 'Movement state',
      value: observationStream.movementState || MOVEMENT_STATES.UNKNOWN,
      status: 'ready',
      detail: 'Current activity or motion state reported to Behaviour Intelligence.'
    },
    {
      id: 'concern-level',
      label: 'Concern level',
      value: result.risk?.concernLevel || BEHAVIOUR_CONCERN_LEVELS.NONE,
      status: getStatusFromConcern(result.risk?.concernLevel),
      detail: currentObservation.notes?.[0] || 'No immediate behaviour concern recorded.'
    }
  ]
}

function createWaitingResult() {
  return {
    profile: {
      displayName: 'Waiting for identity',
      protectedUser: false,
      observationHistory: []
    },
    observationStream: {
      bodyPosition: BODY_POSITIONS.UNKNOWN,
      headDirection: HEAD_DIRECTIONS.UNKNOWN,
      movementState: MOVEMENT_STATES.UNKNOWN
    },
    risk: {
      concernLevel: BEHAVIOUR_CONCERN_LEVELS.NONE,
      diagnosticStatement: 'Waiting for live observation and identity context.'
    },
    protectedPolicy: {
      priority: 'normal'
    },
    decisionHint: {
      recommendedAction: BEHAVIOUR_ACTIONS.OBSERVE,
      notifyAuthorisedUser: false,
      concernLevel: BEHAVIOUR_CONCERN_LEVELS.NONE
    },
    matchedBehaviourProfile: null
  }
}

export default function useBehaviourIntelligence() {
  const [scenario, setScenario] = useState(SCENARIOS.WAITING)
  const [refreshVersion, setRefreshVersion] = useState(0)

  const capabilityState = useMemo(() => {
    if (scenario === SCENARIOS.WAITING) {
      return createWaitingState(
        'No live behaviour observation is available. Waiting for Vision, Identity and Observation input.',
        'behaviour-intelligence'
      )
    }

    return createSimulationState(
      'Behaviour developer simulation is active. Displayed behaviour is not live robot data.',
      'behaviour-panel-simulation'
    )
  }, [scenario])

  const result = useMemo(() => {
    if (scenario === SCENARIOS.WAITING) {
      return createWaitingResult()
    }

    const scenarioInput = SCENARIO_INPUTS[scenario] || SCENARIO_INPUTS[SCENARIOS.NORMAL]
    return BehaviourPatternEngine.evaluate({
      ...scenarioInput,
      options: {
        ...scenarioInput.options,
        timestamp: Date.now() + refreshVersion
      }
    })
  }, [scenario, refreshVersion])

  const behaviourProfiles = useMemo(() => BehaviourProfileRegistry.listProfiles(), [refreshVersion])

  const matchedBehaviourProfile = useMemo(() => {
    if (capabilityState.isWaiting) return null

    const contexts = SCENARIO_INPUTS[scenario]?.options?.behaviourContexts || []
    return BehaviourProfileMatcher.match(result.observationStream, { contexts })
  }, [capabilityState, result, scenario])

  const capabilityStatus = useMemo(() => createCapabilityStatus(capabilityState), [capabilityState])
  const timeline = useMemo(() => createTimeline(result, capabilityState), [result, capabilityState])

  const clearSimulation = () => setScenario(SCENARIOS.WAITING)

  return {
    version: 'v0.13.8',
    status: getStatusFromConcern(result.risk?.concernLevel, capabilityState),
    scenario,
    scenarioLabels: SCENARIO_LABELS,
    scenarios: SCENARIOS,
    setScenario,
    clearSimulation,
    refresh: () => setRefreshVersion((value) => value + 1),
    capabilityState,
    isWaiting: capabilityState.isWaiting,
    isSimulation: capabilityState.isSimulation,
    behaviourResult: result,
    behaviourProfiles,
    matchedBehaviourProfile,
    profile: result.profile,
    observationStream: result.observationStream,
    risk: result.risk,
    protectedPolicy: result.protectedPolicy,
    decisionHint: result.decisionHint,
    capabilityStatus,
    timeline,
    isNotificationRecommended: !capabilityState.isWaiting && result.decisionHint?.recommendedAction === BEHAVIOUR_ACTIONS.NOTIFY,
    diagnosticStatement: capabilityState.isWaiting
      ? capabilityState.message
      : matchedBehaviourProfile?.matched
        ? `Behaviour profile matched: ${matchedBehaviourProfile.profile.label}. ${matchedBehaviourProfile.profile.normal ? 'Normal user-defined pattern.' : 'Review user-defined sign.'}`
        : result.risk?.diagnosticStatement || 'No immediate behaviour notification required.'
  }
}
