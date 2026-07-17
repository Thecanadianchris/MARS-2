/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Service:
 * NotificationManager
 *
 * Purpose:
 * Backward-compatible notification manager plus M2.5 routing
 * through NotificationEngine.
 *
 * Version:
 * v0.13.9
 * Date Code:
 * 040726
 * ==========================================================
 */

import NotificationPolicy from './NotificationPolicy'
import NotificationQueue from './NotificationQueue'
import NotificationEngine from './NotificationEngine'
import NotificationHistory from './NotificationHistory'
import {
  NOTIFICATION_TARGET,
  NOTIFICATION_TARGET_STATUS,
  NOTIFICATION_TARGETS,
  getNotificationTarget
} from './NotificationTargets'

class NotificationManager {
  createFromDecision(decision = {}, userContext = {}, authorisedUsers = []) {
    const safeDecision = decision || {}
    const safeUserContext = userContext || {}
    const policy = NotificationPolicy.evaluate(safeDecision, safeUserContext)

    if (!policy.allowed) {
      return {
        status: 'not_required',
        provider: 'LOCAL_NOTIFICATION_MANAGER',
        version: 'v0.13.9',
        policy,
        notification: null
      }
    }

    const recipients = NotificationPolicy.getAuthorisedRecipients(
      authorisedUsers,
      policy.type
    )

    const notification = NotificationQueue.enqueue({
      type: policy.type,
      priority: policy.priority,
      title: this.createTitle(policy),
      message: this.createMessage(policy, safeDecision, safeUserContext),
      channels: policy.channels,
      recipients,
      decision: safeDecision,
      userContext: safeUserContext,
      medicalDiagnosis: false
    })

    return {
      status: 'queued',
      provider: 'LOCAL_NOTIFICATION_MANAGER',
      version: 'v0.13.9',
      policy,
      notification
    }
  }

  evaluateDecision(decision, profileId) {
    return NotificationEngine.evaluateDecision(decision, profileId)
  }

  createTitle(policy) {
    switch (policy.type) {
      case 'UNKNOWN_PERSON':
        return 'MARS noticed an unknown person'
      case 'PROTECTED_USER_ATTENTION':
        return 'MARS protected user attention notice'
      case 'BLOCKED_USER':
        return 'MARS blocked user alert'
      default:
        return 'MARS notification'
    }
  }

  createMessage(policy, decision, userContext) {
    const userName = userContext?.user?.displayName || 'Unknown User'
    const decisionSummary = decision?.summary || decision?.recommendation || policy.reason

    return `${policy.reason} User: ${userName}. Decision: ${decisionSummary}`
  }

  getQueue() {
    return NotificationQueue.getAll()
  }

  /**
   * Real notification-framework status for diagnostics.
   *
   * DiagnosticsManager.evaluateNotificationStatus() has probed for this
   * method since v0.13.6 (`typeof NotificationManager.getStatus ===
   * 'function'`) but it never existed, so the diagnostics tile always
   * showed a hardcoded fallback instead of live state. This reports
   * honestly: readiness booleans are derived from the actual
   * NOTIFICATION_TARGETS statuses (only an ACTIVE target counts as
   * ready — none are today, matching what the fallback claimed), and
   * queue/history counts are the real stores' contents.
   */
  getStatus() {
    const trustedContactTarget = getNotificationTarget(NOTIFICATION_TARGET.TRUSTED_CONTACT)
    const watchTarget = getNotificationTarget(NOTIFICATION_TARGET.GALAXY_WATCH)

    return {
      status: 'available',
      provider: 'LOCAL_NOTIFICATION_MANAGER',
      version: 'v0.13.9',
      internalNotificationsReady: true,
      trustedContactAlertsReady:
        trustedContactTarget?.status === NOTIFICATION_TARGET_STATUS.ACTIVE,
      watchInputReady: watchTarget?.status === NOTIFICATION_TARGET_STATUS.ACTIVE,
      queueCount: NotificationQueue.getAll().length,
      historyCount: NotificationHistory.all().length,
      targetCount: NOTIFICATION_TARGETS.length,
      activeTargetCount: NOTIFICATION_TARGETS.filter(
        (target) => target.status === NOTIFICATION_TARGET_STATUS.ACTIVE
      ).length,
      medicalDiagnosis: false
    }
  }

  reset() {
    NotificationQueue.clear()
    NotificationEngine.clearHistory()
  }
}

export default new NotificationManager()
