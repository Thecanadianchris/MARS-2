/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Store:
 * CameraStreamStore
 *
 * Purpose:
 * v0.16.6. Holds a reference to the active camera MediaStream so
 * more than one <video> element can show the same live feed at
 * once — specifically, the pop-up enrollment preview rendered on
 * the Identity tab (EnrollmentCameraPreview.jsx) alongside the
 * main feed on the Vision tab (VisionPanel.jsx). A MediaStream can
 * be attached to multiple <video> elements' srcObject simultaneously,
 * so this store just needs to hand out the same stream reference —
 * same singleton-service pattern as LivePipelineStore/FaceCaptureUiStore.
 *
 * v0.16.9: added a registered "start handler" so a control OUTSIDE
 * the Vision tab (the Identity tab's Enroll button) can turn the
 * camera on without the user first switching tabs. Christian hit
 * this live: the Enroll button was simply disabled with no
 * explanation beyond a small warning banner if the camera hadn't
 * been started on the Vision tab yet — "it needs to activate if not
 * active, from there." VisionPanel.jsx registers its own
 * startCamera() here via setStartHandler() on mount (through a ref,
 * so it's never a stale closure even as VisionPanel re-renders);
 * requestStart() calls whatever's currently registered and resolves
 * immediately if a stream already exists, so callers can safely
 * await it without caring whether the camera was already running.
 *
 * v0.16.15: added reset() (test-only utility, same convention as
 * every other singleton service in Identity/Vision — e.g.
 * IdentityTrackingService.reset()) so smoke tests can start each case
 * from a clean slate instead of leaking stream/handler/listener state
 * across tests via the shared singleton instance.
 *
 * Version:
 * v0.16.15
 *
 * Date Code:
 * 170726
 * ==========================================================
 */

class CameraStreamStore {
  constructor() {
    this.stream = null
    this.listeners = new Set()
    this.startHandler = null
  }

  setStream(stream) {
    this.stream = stream || null
    this.emit()
  }

  clearStream() {
    this.stream = null
    this.emit()
  }

  getStream() {
    return this.stream
  }

  setStartHandler(handler) {
    this.startHandler = typeof handler === 'function' ? handler : null
  }

  /**
   * Ensures the camera is active, starting it if necessary. Resolves
   * with a status string — never throws, so callers (e.g.
   * useFaceEnrollment) can always await it safely.
   */
  async requestStart() {
    if (this.stream) {
      return { status: 'already-active' }
    }

    if (!this.startHandler) {
      return { status: 'no-handler' }
    }

    try {
      await this.startHandler()
      return { status: this.stream ? 'started' : 'start-failed' }
    } catch {
      return { status: 'start-failed' }
    }
  }

  subscribe(listener) {
    if (typeof listener !== 'function') {
      return () => {}
    }

    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  emit() {
    this.listeners.forEach((listener) => {
      try {
        listener(this.stream)
      } catch {
        // A bad listener shouldn't break camera start/stop.
      }
    })
  }

  /**
   * v0.16.15. Test-only utility — resets the shared singleton back to
   * a clean slate (no stream, no start handler, no listeners) so
   * smoke tests don't leak state across cases. Not used by any
   * production code path.
   */
  reset() {
    this.stream = null
    this.startHandler = null
    this.listeners.clear()
  }
}

export default new CameraStreamStore()
