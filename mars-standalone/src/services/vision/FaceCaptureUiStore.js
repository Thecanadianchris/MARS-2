/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Store:
 * FaceCaptureUiStore
 *
 * Purpose:
 * v0.16.4. Tiny cross-tab signal so the live video overlay
 * (rendered in VisionPanel, on the Vision tab) knows when a face
 * enrollment capture is running (started from useFaceEnrollment,
 * used on the Identity tab). The camera is always mounted (see
 * v0.16.1's Vision-tab-independent camera lifecycle), so this is
 * the same "singleton service both sides read/write" pattern as
 * LivePipelineStore — no React context, no prop drilling across
 * unrelated tabs.
 *
 * Version:
 * v0.16.4
 *
 * Date Code:
 * 160726
 * ==========================================================
 */

class FaceCaptureUiStore {
  constructor() {
    this.capturing = false
    this.personId = null
  }

  startCapture(personId = null) {
    this.capturing = true
    this.personId = personId
  }

  stopCapture() {
    this.capturing = false
    this.personId = null
  }

  isCapturing() {
    return this.capturing
  }

  getCapturingPersonId() {
    return this.personId
  }
}

export default new FaceCaptureUiStore()
