/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Hook:
 * useDecisionIntelligence
 *
 * Purpose:
 * Provides UI-facing state for v0.13.7 M2.4 Decision
 * Intelligence.
 *
 * Decision Intelligence consumes Observation, Identity and
 * Behaviour context. It produces priority and recommendation
 * output, but does not execute actions or send alerts.
 *
 * Version:
 * v0.13.7
 * Date Code:
 * 040726
 * ==========================================================
 */

import { useMemo, useState } from 'react'
import DecisionIntelligenceService from '@/services/decision/DecisionIntelligenceService'

const SCENARIOS = Object.freeze({
  NORMAL: 'normal',
  WATCH: 'watch',
  ASSIST: 'assist',
  FINLEY_ALERT: 'finley_alert'
})

const SCENARIO_LABELS = Object.freeze({
  [SCENARIOS.NORMAL]: 'Normal',
  [SCENARIOS.WATCH]: 'Watch',
  [SCENARIOS.ASSIST]: 'Assist',
  [SCENARIOS.FINLEY_ALERT]: 'Finley alert'
})

const SCENARIO_INPUTS = Object.freeze({
  [SCENARIOS.NORMAL]: {
    profile: {
      id: 'christian',
      displayName: 'Christian',
      highestPriority: 'normal',
      protected: false
    },
    observations: ['person_present', 'body_standing', 'movement_moving', 'personal_profile_active'],
    bodyState: {
      posture: 'standing',
      confidence: 88
    },
    movement: {
      movement: 'moving',
      direction: 'forward',
      confidence: 86
    },
    behaviourPattern: {
      pattern: 'stable',
      transition: 'none',
      confidence: 84
    },
    behaviourHistory: {
      behaviourState: 'active',
      sampleCount: 4
    },
    activityRecognition: {
      activity: 'standing',
      activityDisplay: 'Standing',
      confidence: 84
    },
    risk: {
      level: 1,
      label: 'normal',
      confidence: 86
    }
  },
  [SCENARIOS.WATCH]: {
    profile: {
      id: 'unknown-person',
      displayName: 'Unknown person',
      highestPriority: 'normal',
      protected: false
    },
    observations: ['person_present', 'body_sitting'],
    bodyState: {
      posture: 'sitting',
      confidence: 72
    },
    movement: {
      movement: 'stationary',
      direction: 'none',
      confidence: 73
    },
    behaviourPattern: {
      pattern: 'standing_still',
      transition: 'none',
      confidence: 72
    },
    behaviourHistory: {
      behaviourState: 'inactive',
      sampleCount: 24
    },
    activityRecognition: {
      activity: 'inactive',
      activityDisplay: 'Inactive',
      confidence: 70
    },
    risk: {
      level: 3,
      label: 'watch',
      confidence: 72
    }
  },
  [SCENARIOS.ASSIST]: {
    profile: {
      id: 'unknown-person',
      displayName: 'Unknown person',
      highestPriority: 'normal',
      protected: false
    },
    observations: ['person_present', 'body_lying'],
    bodyState: {
      posture: 'lying',
      confidence: 78
    },
    movement: {
      movement: 'stationary',
      direction: 'none',
      confidence: 75
    },
    behaviourPattern: {
      pattern: 'floor_stillness',
      transition: 'downward',
      confidence: 78
    },
    behaviourHistory: {
      behaviourState: 'floor',
      sampleCount: 9
    },
    activityRecognition: {
      activity: 'lying',
      activityDisplay: 'Lying',
      confidence: 78
    },
    risk: {
      level: 5,
      label: 'review',
      confidence: 78
    }
  },
  [SCENARIOS.FINLEY_ALERT]: {
    profile: {
      id: 'finley',
      displayName: 'Finley',
      highestPriority: 'high',
      protected: true
    },
    observations: ['person_present', 'body_sitting', 'personal_profile_active'],
    identity: {
      state: 'known_protected_user',
      confidence: 86,
      known: true,
      trusted: true,
      protected: true,
      userType: 'protected_user'
    },
    bodyState: {
      posture: 'sitting',
      confidence: 82
    },
    movement: {
      movement: 'unusual',
      direction: 'up-left',
      confidence: 79
    },
    behaviourPattern: {
      pattern: 'unusual_head_direction',
      transition: 'up_left',
      confidence: 79
    },
    behaviourHistory: {
      behaviourState: 'unusual',
      sampleCount: 12
    },
    activityRecognition: {
      activity: 'unusual_sign',
      activityDisplay: 'Unusual sign',
      direction: 'up-left',
      confidence: 79
    },
    faceFoundation: {
      faceDetected: true,
      faceCount: 1,
      confidence: 82,
      head: {
        orientation: 'up-left',
        pitch: 'up',
        yaw: 'left',
        roll: 'unknown'
      }
    },
    risk: {
      level: 8,
      label: 'high',
      confidence: 82
    }
  }
})

function createObservationObjects(ids) {
  return ids.map((id) => ({
    id,
    label: id
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }))
}

function createPipelineResult(scenarioConfig) {
  const observations = createObservationObjects(scenarioConfig.observations)
  const profile = scenarioConfig.profile

  return {
    status: 'success',
    provider: 'M2_4_DECISION_PANEL_SIMULATOR',
    timestamp: Date.now(),
    frame: {
      width: 640,
      height: 480,
      timestamp: Date.now()
    },
    detections: {
      people: 1,
      faces: scenarioConfig.faceFoundation?.faceCount || 0,
      objects: 0,
      pose: scenarioConfig.bodyState.posture
    },
    bodyState: scenarioConfig.bodyState,
    movement: scenarioConfig.movement,
    behaviourPattern: scenarioConfig.behaviourPattern,
    behaviourHistory: scenarioConfig.behaviourHistory,
    activityRecognition: scenarioConfig.activityRecognition,
    faceFoundation: scenarioConfig.faceFoundation || {
      faceDetected: false,
      faceCount: 0,
      confidence: 0
    },
    observationStream: {
      observationCount: observations.length,
      ids: scenarioConfig.observations,
      labels: observations.map((observation) => observation.label),
      observations,
      summary: 'Decision panel simulation observation stream.'
    },
    personalObservation: {
      profile: {
        id: profile.id,
        displayName: profile.displayName
      },
      activeMarkerCount: profile.protected ? 1 : 0,
      highestPriority: profile.highestPriority,
      markers: profile.protected ? ['protected_user_policy'] : [],
      summary: `${profile.displayName} profile context available.`
    },
    identity: {
      state: scenarioConfig.identity?.state || 'known_user',
      confidence: scenarioConfig.identity?.confidence || 80,
      profile: {
        id: profile.id,
        displayName: profile.displayName
      },
      userType: scenarioConfig.identity?.userType || 'standard_user',
      known: scenarioConfig.identity?.known ?? profile.id !== 'unknown-person',
      trusted: scenarioConfig.identity?.trusted ?? false,
      protected: scenarioConfig.identity?.protected ?? profile.protected,
      blocked: false,
      requiresTrustedUserConfirmation: false
    },
    risk: scenarioConfig.risk
  }
}

function derivePanelStatus(highestPriority) {
  const score = highestPriority?.score || 0

  if (score >= 70) return 'attention'
  if (score >= 45) return 'review'
  if (score >= 20) return 'watch'
  return 'ready'
}

function createMetrics(result) {
  const decisionCount = result.decisionResult?.decisionCount || 0
  const priorityCount = result.priorityResult?.priorityCount || 0
  const recommendationCount = result.recommendationResult?.recommendationCount || 0
  const highestPriority = result.priorityResult?.highestPriority
  const status = derivePanelStatus(highestPriority)

  return [
    {
      id: 'context',
      label: 'Context',
      value: result.context?.status === 'success' ? 'Ready' : 'Waiting',
      detail: result.context?.summary || 'No decision context available.',
      status: result.context?.status === 'success' ? 'ready' : 'blocked'
    },
    {
      id: 'decisions',
      label: 'Decisions',
      value: String(decisionCount),
      detail: 'Decision candidates produced from current context.',
      status
    },
    {
      id: 'priorities',
      label: 'Priorities',
      value: String(priorityCount),
      detail: 'Ranked priorities produced by the local priority engine.',
      status
    },
    {
      id: 'recommendations',
      label: 'Actions',
      value: String(recommendationCount),
      detail: 'Recommended next actions only. Nothing is executed here.',
      status
    }
  ]
}

function createCapabilityStatus() {
  return [
    {
      id: 'context-engine',
      title: 'Context Engine',
      status: 'ready',
      description: 'Converts perception, identity and behaviour outputs into decision-ready context.'
    },
    {
      id: 'decision-engine',
      title: 'Decision Engine',
      status: 'ready',
      description: 'Creates neutral decision candidates without executing any action.'
    },
    {
      id: 'priority-engine',
      title: 'Priority Engine',
      status: 'ready',
      description: 'Ranks decision candidates using confidence, risk and identity context.'
    },
    {
      id: 'recommendation-engine',
      title: 'Recommendation Engine',
      status: 'ready',
      description: 'Produces suggested assistive next actions for later layers.'
    },
    {
      id: 'notification-handoff',
      title: 'Notification Handoff',
      status: 'planned',
      description: 'M2.5 will convert approved recommendations into alert routing decisions.'
    },
    {
      id: 'watch-correlation',
      title: 'Watch Correlation Input',
      status: 'planned',
      description: 'Future watch heart-rate and emergency-trigger data may influence priority context.'
    }
  ]
}

export default function useDecisionIntelligence() {
  const [scenario, setScenario] = useState(SCENARIOS.NORMAL)
  const [refreshToken, setRefreshToken] = useState(0)

  return useMemo(() => {
    const scenarioConfig = SCENARIO_INPUTS[scenario] || SCENARIO_INPUTS[SCENARIOS.NORMAL]
    const pipelineResult = createPipelineResult(scenarioConfig)
    const result = DecisionIntelligenceService.evaluate(pipelineResult)
    const highestPriority = result.priorityResult?.highestPriority || null
    const highestRecommendation = result.recommendationResult?.highestRecommendation || null
    const status = derivePanelStatus(highestPriority)

    return {
      version: 'v0.13.7',
      module: 'M2.4 Decision Intelligence',
      status,
      scenario,
      scenarios: SCENARIOS,
      scenarioLabels: SCENARIO_LABELS,
      refreshToken,
      setScenario,
      refresh: () => setRefreshToken((value) => value + 1),

      context: result.context,
      decisions: result.decisionResult?.decisions || [],
      priorities: result.priorityResult?.priorities || [],
      recommendations: result.recommendationResult?.recommendations || [],
      highestPriority,
      highestRecommendation,
      metrics: createMetrics(result),
      capabilityStatus: createCapabilityStatus(),

      diagnosticStatement:
        result.summary ||
        'Decision Intelligence is available. No action is currently required.',
      safetyBoundary:
        'Decision Intelligence recommends only. Notifications and escalation are handled by M2.5.'
    }
  }, [scenario, refreshToken])
}
