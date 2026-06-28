/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Service:
 * PoseDetectionService
 *
 * Purpose:
 * Provides local MediaPipe pose detection for the MARS
 * Vision Pipeline.
 *
 * Version:
 * v0.10.4
 *
 * Date Code:
 * 280626
 * ==========================================================
 */

import {
  FilesetResolver,
  PoseLandmarker,
} from '@mediapipe/tasks-vision'

class PoseDetectionService {
  constructor() {
    this.initialised = false
    this.available = false
    this.poseLandmarker = null
    this.lastError = null
  }

  async initialise() {
    if (this.initialised && this.poseLandmarker) {
      return this.getStatus()
    }

    try {
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
      )

      this.poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task',
          delegate: 'GPU',
        },
        runningMode: 'IMAGE',
        numPoses: 1,
      })

      this.initialised = true
      this.available = true
      this.lastError = null

      return this.getStatus()
    } catch (error) {
      this.initialised = false
      this.available = false
      this.poseLandmarker = null
      this.lastError = error.message || 'Pose initialisation failed.'

      return this.getStatus()
    }
  }

  async detectPose(frame) {
    if (!frame) {
      return this.emptyResult('No frame supplied to PoseDetectionService.')
    }

    if (!this.initialised || !this.poseLandmarker) {
      await this.initialise()
    }

    if (!this.poseLandmarker) {
      return this.emptyResult(
        this.lastError || 'Pose Landmarker is not available.'
      )
    }

    try {
      const image = await this.createImageFromFrame(frame)
      const result = this.poseLandmarker.detect(image)

      const landmarks = result?.landmarks?.[0] || []
      const poseDetected = landmarks.length > 0

      return {
        status: 'success',
        provider: 'MEDIAPIPE_POSE',
        poseDetected,
        pose: poseDetected ? 'landmarks_detected' : 'not_detected',
        landmarks,
        landmarkCount: landmarks.length,
        confidence: poseDetected ? 100 : 0,
        summary: poseDetected
          ? `MediaPipe pose detected ${landmarks.length} body landmarks.`
          : 'MediaPipe pose ran successfully. No body pose detected.',
      }
    } catch (error) {
      return this.emptyResult(error.message || 'Pose detection failed.')
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
        reject(new Error('Unable to load frame image for pose detection.'))
      }

      image.src = frame.dataUrl
    })
  }

  emptyResult(message = 'No pose detected.') {
    return {
      status: 'empty',
      provider: 'MEDIAPIPE_POSE',
      poseDetected: false,
      pose: 'not_active',
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
      provider: 'MEDIAPIPE_POSE',
      lastError: this.lastError,
    }
  }
}

export default new PoseDetectionService()