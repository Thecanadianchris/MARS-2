/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Store:
 * LivePipelineStore
 *
 * Purpose:
 * Maintains the latest live Vision Pipeline result so UI,
 * diagnostics and downstream capability panels can read the
 * same authoritative pipeline state without re-running or
 * simulating capability data.
 *
 * Version:
 * v0.13.6
 *
 * Date Code:
 * 050726
 * ==========================================================
 */

const LIVE_PIPELINE_VERSION = 'v0.13.6'
const DEFAULT_STALE_AFTER_MS = 10000

class LivePipelineStore {
  constructor() {
    this.latestResult = null
    this.latestNotification = null
    this.history = []
    this.maxHistory = 30
    this.lastUpdatedAt = null
    this.lastError = null
  }

  saveResult(result = null) {
    if (!result) {
      return this.latestResult
    }

    const updatedAt = Date.now()
    const active = result.status === 'success'

    const normalisedResult = {
      ...result,
      livePipeline: {
        ...(result.livePipeline || {}),
        active,
        source: result.provider || 'LOCAL_PIPELINE',
        version: LIVE_PIPELINE_VERSION,
        updatedAt,
        staleAfterMs: DEFAULT_STALE_AFTER_MS,
      },
    }

    this.latestResult = normalisedResult
    this.lastUpdatedAt = updatedAt
    this.lastError = active ? null : result.summary || 'Latest live pipeline result was not successful.'
    this.history = [normalisedResult, ...this.history].slice(0, this.maxHistory)

    return this.latestResult
  }

  saveNotification(notificationResult = null) {
    this.latestNotification = notificationResult
    return this.latestNotification
  }

  getLatestResult() {
    return this.latestResult
  }

  getLatestNotification() {
    return this.latestNotification
  }

  getHistory() {
    return [...this.history]
  }

  getAgeMs(now = Date.now()) {
    if (!this.lastUpdatedAt) {
      return null
    }

    return Math.max(0, now - this.lastUpdatedAt)
  }

  isStale(now = Date.now(), staleAfterMs = DEFAULT_STALE_AFTER_MS) {
    const ageMs = this.getAgeMs(now)

    if (ageMs === null) {
      return false
    }

    return ageMs > staleAfterMs
  }

  getStatus(now = Date.now()) {
    const ageMs = this.getAgeMs(now)
    const stale = this.isStale(now)
    const latestStatus = this.latestResult?.status || 'waiting'

    return {
      active: Boolean(this.latestResult),
      healthy: Boolean(this.latestResult) && latestStatus === 'success' && !stale,
      stale,
      staleAfterMs: DEFAULT_STALE_AFTER_MS,
      ageMs,
      version: LIVE_PIPELINE_VERSION,
      lastUpdatedAt: this.lastUpdatedAt,
      processedFrameCount: this.latestResult?.performance?.processedFrameCount || 0,
      latestStatus,
      latestRiskLevel: this.latestResult?.risk?.level ?? null,
      latestRiskLabel: this.latestResult?.risk?.label || 'unknown',
      latestSummary: this.latestResult?.summary || 'Live pipeline has not produced a result yet.',
      notificationStatus: this.latestNotification?.status || 'waiting',
      historyCount: this.history.length,
      lastError: this.lastError,
    }
  }

  clear() {
    this.latestResult = null
    this.latestNotification = null
    this.history = []
    this.lastUpdatedAt = null
    this.lastError = null
  }
}

export { LIVE_PIPELINE_VERSION, DEFAULT_STALE_AFTER_MS }
export default new LivePipelineStore()
