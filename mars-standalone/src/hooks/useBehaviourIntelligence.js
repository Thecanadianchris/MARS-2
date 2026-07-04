/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Hook:
 * useBehaviourIntelligence
 *
 * Purpose:
 * Provides the UI-facing state for the v0.13.6 M2.3
 * Behaviour Panel.
 *
 * Behaviour Intelligence describes observed activity patterns
 * only. It does not diagnose medical conditions.
 *
 * Version:
 * v0.13.6
 *
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
  HEAD_DIRECTIONS,
  MOVEMENT_STATES
} from '@/services/behaviour'

const SCENARIOS = Object.freeze({
  NORMAL: 'normal',
  INACTIVE: 'inactive',
  FLOOR: 'floor',
  FINLEY_HEAD_UP_LEFT: 'finley_head_up_left'
})

const SCENARIO_LABELS = Object.freeze({
  [SCENARIOS.NORMAL]: 'Normal',
  [SCENARIOS.INACTIVE]: 'Inactive',
  [SCENARIOS.FLOOR]: 'Floor',
  [SCENARIOS.FINLEY_HEAD_UP_LEFT]: 'Finley sign'
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
  }
})

function createCapabilityStatus() {
  return [
    {
      id: 'behaviour-pattern-engine',
      title: 'Behaviour Pattern Engine',
      status: 'ready',
      description: 'Converts neutral observations into behaviour intelligence.'
    },
    {
      id: 'body-position-tracking',
      title: 'Body Position Tracking',
      status: 'ready',
      description: 'Tracks standing, sitting, lying, floor and unknown states.'
    },
    {
      id: 'head-direction-tracking',
      title: 'Head Direction Tracking',
      status: 'ready',
      description: 'Supports forward, up, down, left, right and diagonal observations.'
    },
    {
      id: 'movement-state-tracking',
      title: 'Movement State Tracking',
      status: 'ready',
      description: 'Tracks moving, still, inactive, unusual and fall-detected signals.'
    },
    {
      id: 'protected-user-policy',
      title: 'Protected User Policy',
      status: 'ready',
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

function getStatusFromConcern(concernLevel) {
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

function createTimeline(result) {
  const currentObservation = result.currentObservation || {}
  const observationStream = result.observationStream || {}

  return [
    {
      id: 'body-position',
      label: 'Body position',
      value: observationStream.bodyPosition || BODY_POSITIONS.UNKNOWN,
      detail: 'Neutral posture observation from the current perception frame.'
    },
    {
      id: 'head-direction',
      label: 'Head direction',
      value: observationStream.headDirection || HEAD_DIRECTIONS.UNKNOWN,
      detail: 'Head orientation signal. This is a sign only, not a diagnosis.'
    },
    {
      id: 'movement-state',
      label: 'Movement state',
      value: observationStream.movementState || MOVEMENT_STATES.UNKNOWN,
      detail: 'Current activity or motion state reported to Behaviour Intelligence.'
    },
    {
      id: 'concern-level',
      label: 'Concern level',
      value: result.risk?.concernLevel || BEHAVIOUR_CONCERN_LEVELS.NONE,
      detail: currentObservation.notes?.[0] || 'No immediate behaviour concern recorded.'
    }
  ]
}

export default function useBehaviourIntelligence() {
  const [scenario, setScenario] = useState(SCENARIOS.NORMAL)
  const [refreshVersion, setRefreshVersion] = useState(0)

  const result = useMemo(() => {
    const scenarioInput = SCENARIO_INPUTS[scenario] || SCENARIO_INPUTS[SCENARIOS.NORMAL]
    return BehaviourPatternEngine.evaluate({
      ...scenarioInput,
      options: {
        ...scenarioInput.options,
        timestamp: Date.now() + refreshVersion
      }
    })
  }, [scenario, refreshVersion])

  const capabilityStatus = useMemo(() => createCapabilityStatus(), [])
  const timeline = useMemo(() => createTimeline(result), [result])

  return {
    version: 'v0.13.6',
    status: getStatusFromConcern(result.risk?.concernLevel),
    scenario,
    scenarioLabels: SCENARIO_LABELS,
    scenarios: SCENARIOS,
    setScenario,
    refresh: () => setRefreshVersion((value) => value + 1),
    behaviourResult: result,
    profile: result.profile,
    observationStream: result.observationStream,
    risk: result.risk,
    protectedPolicy: result.protectedPolicy,
    decisionHint: result.decisionHint,
    capabilityStatus,
    timeline,
    isNotificationRecommended: result.decisionHint?.recommendedAction === BEHAVIOUR_ACTIONS.NOTIFY,
    diagnosticStatement: result.risk?.diagnosticStatement || 'No immediate behaviour notification required.'
  }
}
