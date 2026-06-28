/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Module:
 * FrameCaptureService
 *
 * Purpose:
 * Captures still frames from a live video element for MARS Vision.
 *
 * Version:
 * v0.10.0
 *
 * Date Code:
 * 270626
 * ==========================================================
 */

class FrameCaptureService {
  constructor() {
    this.canvas = document.createElement('canvas')
    this.context = this.canvas.getContext('2d')
  }

  captureFrame(videoElement) {
    if (!videoElement) {
      throw new Error('FrameCaptureService requires a video element.')
    }

    if (!videoElement.videoWidth || !videoElement.videoHeight) {
      throw new Error('Video is not ready for frame capture.')
    }

    this.canvas.width = videoElement.videoWidth
    this.canvas.height = videoElement.videoHeight

    this.context.drawImage(
      videoElement,
      0,
      0,
      this.canvas.width,
      this.canvas.height
    )

    const dataUrl = this.canvas.toDataURL('image/jpeg', 0.8)

    return {
      type: 'camera_frame',
      timestamp: Date.now(),
      width: this.canvas.width,
      height: this.canvas.height,
      dataUrl,
    }
  }
}

export default new FrameCaptureService()