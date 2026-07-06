/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Service:
 * VoiceCommandRouter
 *
 * Purpose:
 * Routes parsed voice intents to capability destinations without
 * directly executing capability logic. This preserves loose
 * coupling between Voice and Vision, Diagnostics, Memory, Robot
 * Control or future modules.
 *
 * Version:
 * v0.14.1
 * Date Code:
 * 060726
 * ==========================================================
 */

export const VOICE_ROUTE_STATUS = Object.freeze({
  ROUTED: 'routed',
  WAITING: 'waiting',
  UNKNOWN: 'unknown',
  BLOCKED: 'blocked',
  CANCELLED: 'cancelled',
})

export const VOICE_ROUTE_TARGETS = Object.freeze({
  VOICE: 'voice',
  DIAGNOSTICS: 'diagnostics',
  VISION: 'vision',
  SYSTEM: 'system',
  PROTECTED_USER: 'protected-user-alerting',
  HELP: 'help',
  NONE: 'none',
})

export const DEFAULT_VOICE_ROUTES = Object.freeze({
  WAKE_MARS: {
    target: VOICE_ROUTE_TARGETS.VOICE,
    action: 'activate-voice-routing',
    requiresFutureCapability: false,
  },
  VOICE_STATUS: {
    target: VOICE_ROUTE_TARGETS.VOICE,
    action: 'report-voice-status',
    requiresFutureCapability: false,
  },
  SYSTEM_STATUS: {
    target: VOICE_ROUTE_TARGETS.DIAGNOSTICS,
    action: 'open-system-diagnostics',
    requiresFutureCapability: false,
  },
  VISION_DESCRIBE_SCENE: {
    target: VOICE_ROUTE_TARGETS.VISION,
    action: 'request-scene-description',
    requiresFutureCapability: true,
  },
  HELP: {
    target: VOICE_ROUTE_TARGETS.HELP,
    action: 'show-available-commands',
    requiresFutureCapability: false,
  },
  CANCEL_COMMAND: {
    target: VOICE_ROUTE_TARGETS.NONE,
    action: 'cancel-active-command',
    requiresFutureCapability: false,
  },
  PROTECTED_USER_STATUS: {
    target: VOICE_ROUTE_TARGETS.PROTECTED_USER,
    action: 'request-protected-user-status',
    requiresFutureCapability: true,
  },
})

class VoiceCommandRouter {
  constructor(routes = DEFAULT_VOICE_ROUTES) {
    this.routes = { ...routes }
    this.lastRoute = null
    this.history = []
    this.maxHistory = 20
  }

  routeIntent(intentResult, options = {}) {
    const timestamp = options.timestamp || Date.now()

    if (!intentResult || !intentResult.intent) {
      return this.recordRoute({
        status: VOICE_ROUTE_STATUS.WAITING,
        intent: null,
        target: VOICE_ROUTE_TARGETS.NONE,
        action: null,
        command: null,
        timestamp,
        summary: 'No intent is available to route.',
      })
    }

    if (intentResult.intent === 'UNKNOWN_VOICE_INTENT') {
      return this.recordRoute({
        status: VOICE_ROUTE_STATUS.UNKNOWN,
        intent: intentResult.intent,
        target: VOICE_ROUTE_TARGETS.NONE,
        action: null,
        command: null,
        timestamp,
        summary: 'Voice command could not be routed because no registered intent matched.',
      })
    }

    const route = this.routes[intentResult.intent]

    if (!route) {
      return this.recordRoute({
        status: VOICE_ROUTE_STATUS.UNKNOWN,
        intent: intentResult.intent,
        target: VOICE_ROUTE_TARGETS.NONE,
        action: null,
        command: intentResult.command || null,
        timestamp,
        summary: `No route exists for voice intent ${intentResult.intent}.`,
      })
    }

    const commandStatus = intentResult.command?.status || 'active'
    const blocked = commandStatus === 'deferred'
    const cancelled = intentResult.intent === 'CANCEL_COMMAND'

    return this.recordRoute({
      status: cancelled
        ? VOICE_ROUTE_STATUS.CANCELLED
        : blocked
          ? VOICE_ROUTE_STATUS.BLOCKED
          : VOICE_ROUTE_STATUS.ROUTED,
      intent: intentResult.intent,
      target: route.target,
      action: route.action,
      command: intentResult.command || null,
      requiresFutureCapability: Boolean(route.requiresFutureCapability),
      timestamp,
      summary: cancelled
        ? 'Voice command route cancelled.'
        : blocked
          ? `Intent ${intentResult.intent} is recognised but blocked until its future capability is implemented.`
          : `Intent ${intentResult.intent} routed to ${route.target}.`,
    })
  }

  recordRoute(routeResult) {
    this.lastRoute = routeResult
    this.history = [routeResult, ...this.history].slice(0, this.maxHistory)
    return routeResult
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
      version: 'v0.14.1',
      service: 'VoiceCommandRouter',
      ready: true,
      routeCount: Object.keys(this.routes).length,
      supportedIntents: Object.keys(this.routes),
      lastRoute: this.lastRoute,
      historyCount: this.history.length,
      looseCoupling: true,
      executesCapabilityLogic: false,
    }
  }
}

export default new VoiceCommandRouter()
