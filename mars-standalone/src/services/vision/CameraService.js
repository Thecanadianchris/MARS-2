/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Module:
 * CameraService
 *
 * Purpose:
 * Provides browser/mobile camera access for MARS Vision.
 *
 * Version:
 * v0.10.0
 *
 * Date Code:
 * 270626
 * ==========================================================
 */

class CameraService {
  constructor() {
    this.stream = null
    this.videoElement = null
  }

  async startCamera(videoElement) {
    if (!videoElement) {
      throw new Error('CameraService requires a video element.')
    }

    this.videoElement = videoElement

    this.stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: 'environment',
      },
      audio: false,
    })

    this.videoElement.srcObject = this.stream
    await this.videoElement.play()

    return {
      cameraAvailable: true,
      cameraActive: true,
    }
  }

  stopCamera() {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop())
      this.stream = null
    }

    if (this.videoElement) {
      this.videoElement.srcObject = null
    }

    return {
      cameraActive: false,
    }
  }

  isCameraActive() {
    return Boolean(this.stream)
  }
}

export default new CameraService()