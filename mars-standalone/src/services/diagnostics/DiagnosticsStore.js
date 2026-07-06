/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Store:
 * DiagnosticsStore
 *
 * Purpose:
 * Holds the latest diagnostics snapshot for the local MARS UI.
 * Stores a bounded snapshot history so diagnostics stability can
 * be reviewed without adding external persistence.
 *
 * Version:
 * v0.13.6
 *
 * Date Code:
 * 050726
 * ==========================================================
 */

class DiagnosticsStore {
  constructor() {
    this.snapshot = null
    this.history = []
    this.maxHistory = 30
  }

  getSnapshot() {
    return this.snapshot
  }

  saveSnapshot(snapshot) {
    const savedSnapshot = {
      ...snapshot,
      savedAt: Date.now(),
    }

    this.snapshot = savedSnapshot
    this.history = [savedSnapshot, ...this.history].slice(0, this.maxHistory)
    return this.snapshot
  }

  getHistory() {
    return [...this.history]
  }

  getStatus() {
    return {
      hasSnapshot: Boolean(this.snapshot),
      historyCount: this.history.length,
      maxHistory: this.maxHistory,
      latestStatus: this.snapshot?.status || 'waiting',
      latestTimestamp: this.snapshot?.timestamp || null,
    }
  }

  clear() {
    this.snapshot = null
    this.history = []
  }
}

export default new DiagnosticsStore()
