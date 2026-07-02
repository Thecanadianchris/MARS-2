/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Service:
 * IdentityTimelineService
 *
 * Purpose:
 * Maintains a lightweight in-memory timeline of identity events
 * for diagnostics and future learning integration.
 *
 * This service is intentionally non-persistent in v0.13.0.
 * Persistent learning belongs to v0.13.1 Identity Learning.
 *
 * Version:
 * v0.13.0
 *
 * Date Code:
 * 010726
 * ==========================================================
 */

class IdentityTimelineService {
  constructor(options = {}) {
    this.maxEvents = options.maxEvents || 25
    this.events = []
  }

  record(identityResult = {}) {
    const event = {
      id: `IDENTITY-EVENT-${String(this.events.length + 1).padStart(3, '0')}`,
      status: identityResult.status || 'not_available',
      personId: identityResult.person?.id || null,
      personName: identityResult.person?.name || null,
      confidence: this.normaliseConfidence(identityResult.confidence),
      trackingId: identityResult.tracking?.primaryTrackId || null,
      faceQuality: identityResult.faceQuality?.label || 'unknown',
      source: identityResult.source || 'unknown',
      timestamp: Date.now(),
    }

    this.events = [...this.events, event].slice(-this.maxEvents)

    return this.getTimelineState()
  }

  getTimelineState() {
    return {
      status: 'active',
      persistent: false,
      eventCount: this.events.length,
      latestEvent: this.events[this.events.length - 1] || null,
      events: [...this.events],
    }
  }

  normaliseConfidence(value) {
    const confidence = Number.isFinite(value) ? value : 0
    return Math.max(0, Math.min(100, Math.round(confidence)))
  }
}

export default IdentityTimelineService
