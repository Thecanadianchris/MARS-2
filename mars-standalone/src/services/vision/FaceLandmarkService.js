/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Service:
 * FaceLandmarkService
 *
 * Purpose:
 * Provides local MediaPipe face-mesh landmark detection for the
 * MARS v0.16 Face Recognition Foundation.
 *
 * This is a separate model from PoseDetectionService's body pose
 * landmarks — FaceFoundationEngine derives head orientation from
 * ~11 coarse pose points and is explicitly not recognition.
 * FaceLandmarkService loads MediaPipe's dedicated FaceLandmarker
 * (up to 478 dense face-mesh points) so FaceSignatureEngine has
 * enough geometry to compute a meaningful face signature.
 *
 * Mirrors PoseDetectionService's graceful-degrade pattern: any
 * failure (no camera, model load failure, no face) returns an
 * empty/unavailable result rather than throwing, so the vision
 * pipeline keeps running with plain head-orientation data only.
 *
 * Version:
 * v0.16.0
 *
 * Date Code:
 * 130726
 * ==========================================================
 */

import {
  FaceLandmarker,
  FilesetResolver,
} from '@mediapipe/tasks-vision'

class FaceLandmarkService {
  constructor() {
    this.initialised = false
    this.available = false
    this.faceLandmarker = null
    this.lastError = null
  }

  async initialise() {
    if (this.initialised && this.faceLandmarker) {
      return this.getStatus()
    }

    try {
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm'
      )

      this.faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
          delegate: 'GPU',
        },
        runningMode: 'IMAGE',
        numFaces: 1,
        outputFaceBlendshapes: false,
        outputFacialTransformationMatrixes: false,
      })

      this.initialised = true
      this.available = true
      this.lastError = null

      return this.getStatus()
    } catch (error) {
      this.initialised = false
      this.available = false
      this.faceLandmarker = null
      this.lastError = error.message || 'Face landmark initialisation failed.'

      return this.getStatus()
    }
  }

  async detectFace(frame) {
    if (!frame) {
      return this.emptyResult('No frame supplied to FaceLandmarkService.')
    }

    if (!this.initialised || !this.faceLandmarker) {
      await this.initialise()
    }

    if (!this.faceLandmarker) {
      return this.emptyResult(
        this.lastError || 'Face Landmarker is not available.'
      )
    }

    try {
      const image = await this.createImageFromFrame(frame)
      const result = this.faceLandmarker.detect(image)

      const landmarks = result?.faceLandmarks?.[0] || []
      const faceDetected = landmarks.length > 0

      return {
        status: 'success',
        provider: 'MEDIAPIPE_FACE_LANDMARKER',
        faceDetected,
        landmarks,
        landmarkCount: landmarks.length,
        confidence: faceDetected ? 100 : 0,
        summary: faceDetected
          ? `MediaPipe face landmarker detected ${landmarks.length} face-mesh points.`
          : 'MediaPipe face landmarker ran successfully. No face mesh detected.',
      }
    } catch (error) {
      return this.emptyResult(error.message || 'Face landmark detection failed.')
    }
  }

  createImageFromFrame(frame) {
    return new Promise((resolve, reject) => {
      if (!frame.dataUrl) {
        reject(new Error('Frame does not contain image data.'))
        return
      }

      const image = new Image()

      image.onload = () => {
        resolve(image)
      }

      image.onerror = () => {
        reject(new Error('Unable to load frame image for face landmark detection.'))
      }

      image.src = frame.dataUrl
    })
  }

  emptyResult(message = 'No face detected.') {
    return {
      status: 'empty',
      provider: 'MEDIAPIPE_FACE_LANDMARKER',
      faceDetected: false,
      landmarks: [],
      landmarkCount: 0,
      confidence: 0,
      summary: message,
    }
  }

  getStatus() {
    return {
      initialised: this.initialised,
      available: this.available,
      provider: 'MEDIAPIPE_FACE_LANDMARKER',
      lastError: this.lastError,
    }
  }

  reset() {
    this.initialised = false
    this.available = false
    this.faceLandmarker = null
    this.lastError = null
  }
}

export default new FaceLandmarkService()
