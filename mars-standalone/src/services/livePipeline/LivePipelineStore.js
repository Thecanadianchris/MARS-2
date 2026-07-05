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
 * v0.13.5
 *
 * Date Code:
 * 050726
 * ==========================================================
 */

class LivePipelineStore {
  constructor() {
    this.latestResult = null
    this.latestNotification = null
    this.history = []
    this.maxHistory = 30
    this.lastUpdatedAt = null
  }

  saveResult(result = null) {
    if (!result) {
      return this.latestResult
    }

    const normalisedResult = {
      ...result,
      livePipeline: {
        active: result.status === 'success',
        source: result.provider || 'LOCAL_PIPELINE',
        version: 'v0.13.5',
        updatedAt: Date.now(),
      },
    }

    this.latestResult = normalisedResult
    this.lastUpdatedAt = normalisedResult.livePipeline.updatedAt
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

  getStatus() {
    return {
      active: Boolean(this.latestResult),
      version: 'v0.13.5',
      lastUpdatedAt: this.lastUpdatedAt,
      processedFrameCount: this.latestResult?.performance?.processedFrameCount || 0,
      latestStatus: this.latestResult?.status || 'waiting',
      latestRiskLevel: this.latestResult?.risk?.level ?? null,
      latestRiskLabel: this.latestResult?.risk?.label || 'unknown',
      latestSummary: this.latestResult?.summary || 'Live pipeline has not produced a result yet.',
      notificationStatus: this.latestNotification?.status || 'waiting',
    }
  }

  clear() {
    this.latestResult = null
    this.latestNotification = null
    this.history = []
    this.lastUpdatedAt = null
  }
}

export default new LivePipelineStore()
