/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Service:
 * IdentityTimelineService
 *
 * Purpose:
 * Maintains lightweight identity timelines for tracked people.
 * Timelines support diagnostics, future memory, future learning
 * and future notification reasoning without coupling Identity
 * to those subsystems.
 *
 * Version:
 * v0.13.1
 *
 * Date Code:
 * 040726
 * ==========================================================
 */

class IdentityTimelineService {
  constructor() {
    this.timelines = new Map()
  }

  addEvent(trackingId, event = {}) {
    if (!trackingId) {
      return null
    }

    const safeEvent = event || {}
    const timeline = this.timelines.get(trackingId) || []

    const entry = {
      id: `${trackingId}-EVT-${String(timeline.length + 1).padStart(4, '0')}`,
      trackingId,
      timestamp: safeEvent.timestamp || Date.now(),
      type: safeEvent.type || 'identity_event',
      label: safeEvent.label || 'Identity event recorded.',
      state: safeEvent.state || null,
      confidence: safeEvent.confidence ?? null,
      metadata: safeEvent.metadata || {},
    }

    timeline.push(entry)
    this.timelines.set(trackingId, timeline)

    return entry
  }

  getTimeline(trackingId) {
    if (!trackingId) {
      return []
    }

    return [...(this.timelines.get(trackingId) || [])]
  }

  getLatestEvent(trackingId) {
    const timeline = this.getTimeline(trackingId)
    return timeline[timeline.length - 1] || null
  }

  clearTimeline(trackingId) {
    if (!trackingId) {
      return false
    }

    return this.timelines.delete(trackingId)
  }

  reset() {
    this.timelines.clear()
  }
}

export default new IdentityTimelineService()
