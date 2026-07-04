/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Store:
 * DiagnosticsStore
 *
 * Purpose:
 * Holds the latest diagnostics snapshot for the local MARS UI.
 * This is intentionally lightweight and local-only for v0.13.4.
 *
 * Version:
 * v0.13.4
 *
 * Date Code:
 * 040726
 * ==========================================================
 */

class DiagnosticsStore {
  constructor() {
    this.snapshot = null
    this.history = []
    this.maxHistory = 20
  }

  getSnapshot() {
    return this.snapshot
  }

  saveSnapshot(snapshot) {
    this.snapshot = snapshot
    this.history = [snapshot, ...this.history].slice(0, this.maxHistory)
    return this.snapshot
  }

  getHistory() {
    return [...this.history]
  }

  clear() {
    this.snapshot = null
    this.history = []
  }
}

export default new DiagnosticsStore()
