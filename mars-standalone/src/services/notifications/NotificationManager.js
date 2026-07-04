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

  reset() {
    NotificationQueue.clear()
    NotificationEngine.clearHistory()
  }
}

export default new NotificationManager()
