/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Service:
 * NotificationEngine
 *
 * Purpose:
 * Converts Decision Intelligence output into notification
 * routing plans. It does not deliver alerts directly.
 *
 * Version:
 * v0.13.9
 * Date Code:
 * 040726
 * ==========================================================
 */

import {
  createSimulationState,
  createWaitingState
} from '@/services/capabilityState'
import {
  getNotificationPriorityLabel,
  getNotificationPriorityScore,
  normaliseNotificationPriority,
  NOTIFICATION_PRIORITY
} from './NotificationPriority'
import { DEFAULT_NOTIFICATION_PROFILES, getNotificationProfile } from './NotificationProfiles'
import { NOTIFICATION_TARGETS } from './NotificationTargets'
import NotificationHistory from './NotificationHistory'

function derivePriorityFromDecision(decision = {}) {
  const priority = decision.notificationPriority || decision.priority || decision.highestPriority?.originalPriority
  const score = decision.highestPriority?.score || decision.score || 0

  if (score >= 85) return NOTIFICATION_PRIORITY.CRITICAL
  if (score >= 65) return NOTIFICATION_PRIORITY.ASSIST
  if (score >= 40) return NOTIFICATION_PRIORITY.ATTENTION
  if (score >= 20) return NOTIFICATION_PRIORITY.OBSERVATION

  return normaliseNotificationPriority(priority)
}

function shouldNotify(priority, profile) {
  const priorityScore = getNotificationPriorityScore(priority)
  const minimumScore = getNotificationPriorityScore(profile.minimumPriority)
  return priorityScore >= minimumScore
}

class NotificationEngine {
  createWaitingState() {
    return {
      status: 'waiting',
      version: 'v0.13.9',
      provider: 'LOCAL_NOTIFICATION_ENGINE',
      capabilityState: createWaitingState({
        label: 'Notification',
        source: 'decision-intelligence',
        message: 'Waiting for Decision Intelligence output. No notification will be generated.'
      }),
      notification: null,
      targets: NOTIFICATION_TARGETS,
      profiles: DEFAULT_NOTIFICATION_PROFILES,
      history: NotificationHistory.all(),
      summary: 'Notification Engine is waiting for an upstream decision.'
    }
  }

  evaluateDecision(decision = null, profileId = 'owner-default') {
    if (!decision || decision.dataState === 'waiting' || decision.status === 'waiting') {
      return this.createWaitingState()
    }

    const profile = getNotificationProfile(profileId)
    const priority = derivePriorityFromDecision(decision)
    const allowed = shouldNotify(priority, profile)

    const plan = {
      id: `NOTIF-${Date.now()}`,
      type: decision.type || 'decision_output',
      priority,
      priorityLabel: getNotificationPriorityLabel(priority),
      title: this.createTitle(priority, decision),
      message: this.createMessage(priority, decision),
      targets: allowed ? profile.targets : [],
      profile,
      allowed,
      medicalDiagnosis: false,
      source: decision.source || 'decision-intelligence',
      createdAt: Date.now(),
      status: allowed ? 'queued' : 'not_required'
    }

    const stored = allowed ? NotificationHistory.add(plan) : plan

    return {
      status: allowed ? 'queued' : 'not_required',
      version: 'v0.13.9',
      provider: 'LOCAL_NOTIFICATION_ENGINE',
      capabilityState: createSimulationState({
        label: 'Notification',
        source: 'notification-simulation',
        message: 'Developer simulation is active. Notification routing is not live delivery.'
      }),
      notification: stored,
      targets: NOTIFICATION_TARGETS,
      profiles: DEFAULT_NOTIFICATION_PROFILES,
      history: NotificationHistory.all(),
      summary: allowed
        ? `Notification queued for ${plan.priorityLabel}. Delivery targets: ${plan.targets.length}.`
        : `No notification required for ${plan.priorityLabel}.`
    }
  }

  createTitle(priority, decision = {}) {
    if (priority === NOTIFICATION_PRIORITY.CRITICAL) return 'MARS critical assistive alert'
    if (priority === NOTIFICATION_PRIORITY.ASSIST) return 'MARS assistive alert'
    if (priority === NOTIFICATION_PRIORITY.ATTENTION) return 'MARS attention notice'
    if (priority === NOTIFICATION_PRIORITY.OBSERVATION) return 'MARS observation notice'
    return decision.title || 'MARS information notice'
  }

  createMessage(priority, decision = {}) {
    const recommendation = decision.highestRecommendation?.label || decision.recommendation || 'No action recommendation available.'
    const context = decision.summary || decision.diagnosticStatement || 'Decision context supplied by MARS.'
    return `${context} Recommendation: ${recommendation}. This is assistive alerting only, not a medical diagnosis.`
  }

  clearHistory() {
    NotificationHistory.clear()
  }
}

export default new NotificationEngine()
