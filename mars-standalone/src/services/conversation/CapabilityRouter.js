/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Service:
 * CapabilityRouter
 *
 * Purpose:
 * Central capability dispatcher for the Natural Conversation
 * Engine.
 *
 * Conversation never calls Vision, Memory, Identity or Robot
 * directly.
 *
 * Instead it creates a conversation plan which is dispatched
 * through this router.
 *
 * v0.14.2
 * ==========================================================
 */

import VoiceCommandRouter from '@/services/voice/VoiceCommandRouter'
import MemoryIntelligenceService from '@/services/memory/MemoryIntelligenceService'

export const CAPABILITY_TARGETS = Object.freeze({
  CONVERSATION: 'conversation',
  VOICE: 'voice',
  VISION: 'vision',
  MEMORY: 'memory',
  IDENTITY: 'identity',
  BEHAVIOUR: 'behaviour',
  DECISION: 'decision',
  NOTIFICATIONS: 'notifications',
  ROBOT: 'robot',
  DIAGNOSTICS: 'diagnostics',
})

class CapabilityRouter {
  constructor() {
    this.lastRoute = null
    this.history = []
    this.maxHistory = 50
  }

  route({
    plan = null,
    intentResult = null,
    routeResult = null,
    context = null,
    timestamp = Date.now(),
  } = {}) {
    let result

    switch (plan?.capability) {
      case CAPABILITY_TARGETS.VOICE:
      case 'voice':
      case 'diagnostics':
        result = VoiceCommandRouter.routeIntent(
          intentResult || {},
          { timestamp }
        )
        break

      case CAPABILITY_TARGETS.VISION:
      case 'vision':
        result = this.placeholder(
          'vision',
          'Vision capability available but conversation routing is awaiting integration.'
        )
        break

      case CAPABILITY_TARGETS.MEMORY:
      case 'memory': {
        // v0.15.2: real memory-WRITE dispatch (used by WorkingMemoryService
        // promotion). Read remains the default for any other memory route.
        if (plan?.memoryOp === 'write') {
          const { key, value, personId, category, source } = plan.payload || {}
          const entry = MemoryIntelligenceService.remember(key, value, { personId, category, source })

          result = {
            status: entry ? 'stored' : 'rejected',
            target: 'memory',
            action: 'memory-write',
            summary: entry
              ? `Stored "${entry.key}" for ${personId || 'the active person'}.`
              : 'Nothing stored — an empty key was supplied.',
            entry: entry || null,
            persistentMemory: true,
          }
          break
        }

        const memoryStatus = MemoryIntelligenceService.getStatus()
        result = {
          status: 'ready',
          target: 'memory',
          action: 'memory-read',
          summary: `Memory Intelligence store active with ${memoryStatus.entryCount} stored ${memoryStatus.entryCount === 1 ? 'fact' : 'facts'} across ${memoryStatus.personCount} ${memoryStatus.personCount === 1 ? 'person' : 'people'}.`,
          entryCount: memoryStatus.entryCount,
          personCount: memoryStatus.personCount,
          persistentMemory: true,
        }
        break
      }

      case CAPABILITY_TARGETS.IDENTITY:
      case 'identity':
        result = this.placeholder(
          'identity',
          'Identity conversation routing is planned for v0.16.'
        )
        break

      case CAPABILITY_TARGETS.ROBOT:
      case 'robot':
        result = this.placeholder(
          'robot',
          'Robot control begins in v0.18.'
        )
        break

      default:
        result = {
          status: 'conversation',
          target: 'conversation',
          action: 'answer-now',
          summary:
            'Conversation handled internally without external capability.',
        }
    }

    const record = {
      timestamp,
      plan,
      context,
      capability: plan?.capability || 'conversation',
      result,
    }

    this.lastRoute = record
    this.history = [record, ...this.history].slice(0, this.maxHistory)

    return result
  }

  placeholder(target, summary) {
    return {
      status: 'waiting',
      target,
      action: 'future-capability',
      summary,
      futureCapability: true,
    }
  }

  getLastRoute() {
    return this.lastRoute
  }

  getHistory() {
    return [...this.history]
  }

  clearHistory() {
    this.lastRoute = null
    this.history = []
  }

  getStatus() {
    return {
      version: 'v0.14.2',
      service: 'CapabilityRouter',
      ready: true,
      historyCount: this.history.length,
      supportedCapabilities: Object.values(CAPABILITY_TARGETS),
      lastRoute: this.lastRoute,
    }
  }
}

export default new CapabilityRouter()