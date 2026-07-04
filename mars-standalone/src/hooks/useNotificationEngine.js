/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Hook:
 * useNotificationEngine
 *
 * Purpose:
 * Provides UI-facing state for v0.13.9 M2.5 Notification
 * & Alerting.
 *
 * Notifications consume Decision Intelligence output. They do
 * not decide, diagnose or deliver external alerts directly.
 *
 * Version:
 * v0.13.9
 * Date Code:
 * 040726
 * ==========================================================
 */

import { useMemo, useState } from 'react'
import { NotificationEngine, NOTIFICATION_PRIORITY } from '@/services/notifications'

const SCENARIOS = Object.freeze({
  WAITING: 'waiting',
  INFO: 'info',
  ATTENTION: 'attention',
  ASSIST: 'assist',
  CRITICAL: 'critical'
})

const SCENARIO_LABELS = Object.freeze({
  [SCENARIOS.WAITING]: 'Live waiting',
  [SCENARIOS.INFO]: 'Info simulation',
  [SCENARIOS.ATTENTION]: 'Attention simulation',
  [SCENARIOS.ASSIST]: 'Assist simulation',
  [SCENARIOS.CRITICAL]: 'Critical simulation'
})

const SCENARIO_DECISIONS = Object.freeze({
  [SCENARIOS.INFO]: {
    dataState: 'simulation',
    status: 'ready',
    notificationPriority: NOTIFICATION_PRIORITY.INFORMATION,
    diagnosticStatement: 'Simulation: system information event produced by Decision Intelligence.',
    highestRecommendation: {
      label: 'Record event',
      executionTarget: 'local-history'
    },
    source: 'notification-panel-simulation'
  },
  [SCENARIOS.ATTENTION]: {
    dataState: 'simulation',
    status: 'review',
    notificationPriority: NOTIFICATION_PRIORITY.ATTENTION,
    diagnosticStatement: 'Simulation: behaviour differs from learned profile and may need review.',
    highestRecommendation: {
      label: 'Request user review',
      executionTarget: 'owner'
    },
    source: 'notification-panel-simulation'
  },
  [SCENARIOS.ASSIST]: {
    dataState: 'simulation',
    status: 'attention',
    notificationPriority: NOTIFICATION_PRIORITY.ASSIST,
    diagnosticStatement: 'Simulation: assistive alert recommended by Decision Intelligence.',
    highestRecommendation: {
      label: 'Notify trusted contact',
      executionTarget: 'trusted-contact'
    },
    source: 'notification-panel-simulation'
  },
  [SCENARIOS.CRITICAL]: {
    dataState: 'simulation',
    status: 'attention',
    notificationPriority: NOTIFICATION_PRIORITY.CRITICAL,
    diagnosticStatement: 'Simulation: critical assistive escalation recommended by Decision Intelligence.',
    highestRecommendation: {
      label: 'Escalate assistive alert',
      executionTarget: 'trusted-contact'
    },
    source: 'notification-panel-simulation'
  }
})

function createMetrics(result, scenario) {
  const notification = result.notification
  const targetCount = notification?.targets?.length || 0
  const historyCount = result.history?.length || 0

  return [
    {
      id: 'state',
      label: 'State',
      value: result.status === 'waiting' ? 'Waiting' : 'Ready',
      detail: result.summary,
      status: result.status === 'waiting' ? 'waiting' : 'ready'
    },
    {
      id: 'priority',
      label: 'Priority',
      value: notification?.priorityLabel || 'None',
      detail: notification ? 'Priority generated from Decision output.' : 'No active notification priority.',
      status: notification ? 'active' : 'waiting'
    },
    {
      id: 'targets',
      label: 'Targets',
      value: String(targetCount),
      detail: targetCount > 0 ? 'Targets selected by notification profile.' : 'No delivery targets active.',
      status: targetCount > 0 ? 'active' : 'waiting'
    },
    {
      id: 'history',
      label: 'History',
      value: String(historyCount),
      detail: scenario === SCENARIOS.WAITING ? 'History remains idle in waiting mode.' : 'Simulation history retained for this session.',
      status: historyCount > 0 ? 'active' : 'waiting'
    }
  ]
}

function createCapabilityStatus(result) {
  const waiting = result.status === 'waiting'

  return [
    {
      id: 'decision-handoff',
      title: 'Decision Handoff',
      status: waiting ? 'waiting' : 'ready',
      description: 'Consumes Decision Intelligence output only. It does not create decisions.'
    },
    {
      id: 'routing-engine',
      title: 'Routing Engine',
      status: waiting ? 'waiting' : 'ready',
      description: 'Maps priority and user profile to notification destinations.'
    },
    {
      id: 'trusted-contacts',
      title: 'Trusted Contacts',
      status: 'planned',
      description: 'Future delivery route for family members, carers and authorised users.'
    },
    {
      id: 'watch-alerts',
      title: 'Galaxy Watch Alerts',
      status: 'planned',
      description: 'Future watch output and heart-rate input correlation.'
    },
    {
      id: 'base-station',
      title: 'Base Station Relay',
      status: 'planned',
      description: 'Optional local relay, history, diagnostics and escalation services.'
    }
  ]
}

export default function useNotificationEngine() {
  const [scenario, setScenario] = useState(SCENARIOS.WAITING)
  const [profileId, setProfileId] = useState('owner-default')
  const [refreshToken, setRefreshToken] = useState(0)

  return useMemo(() => {
    const decision = SCENARIO_DECISIONS[scenario] || null
    const result = decision
      ? NotificationEngine.evaluateDecision(decision, profileId)
      : NotificationEngine.createWaitingState()

    return {
      version: 'v0.13.9',
      module: 'M2.5 Notification & Alerting',
      status: result.status,
      capabilityState: result.capabilityState,
      scenario,
      scenarios: SCENARIOS,
      scenarioLabels: SCENARIO_LABELS,
      setScenario,
      clearSimulation: () => setScenario(SCENARIOS.WAITING),
      profileId,
      setProfileId,
      refreshToken,
      refresh: () => setRefreshToken((value) => value + 1),
      notification: result.notification,
      targets: result.targets,
      profiles: result.profiles,
      history: result.history,
      metrics: createMetrics(result, scenario),
      capabilityStatus: createCapabilityStatus(result),
      diagnosticStatement: result.summary,
      safetyBoundary: 'Notification & Alerting communicates Decision output only. It does not diagnose, decide or directly deliver external alerts in M2.5.'
    }
  }, [scenario, profileId, refreshToken])
}
