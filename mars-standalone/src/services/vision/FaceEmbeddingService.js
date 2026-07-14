/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Service:
 * FaceEmbeddingService
 *
 * Purpose:
 * Real, on-device face-embedding provider for the v0.16.1
 * Face Recognition matcher upgrade.
 *
 * v0.16 shipped a "Foundation-grade" matcher (FaceSignatureEngine)
 * built from 8 basic facial-proportion ratios derived from
 * MediaPipe's face-mesh landmarks. A live test (14 July 2026,
 * Christian) showed this is not discriminative enough: an
 * unenrolled person's ratios can land close enough to an enrolled
 * person's to be misidentified. This service replaces that
 * approach with a real face-embedding neural network
 * (@vladmandic/face-api, TensorFlow.js-based, fully on-device —
 * same "never leaves this process" posture as the rest of
 * Identity), producing a 128-dimension descriptor per face that
 * is actually trained to tell different people apart, not just
 * measure proportions.
 *
 * Mirrors PoseDetectionService/FaceLandmarkService's graceful-
 * degrade pattern exactly: no camera/model/face available never
 * throws, it returns an empty result the caller can check.
 *
 * @vladmandic/face-api is loaded via a *dynamic* import inside
 * initialise(), not a static top-level import. Its bundled
 * TensorFlow.js runs browser-backend registration as a side effect
 * of merely being imported — under Vitest (Node environment, no
 * window/self), that side effect throws immediately at module-load
 * time, before any of our own code even runs. A static import would
 * therefore break every test that transitively imports VisionPipeline,
 * not just ones that actually exercise face embedding. Deferring the
 * import to initialise() means it's only ever touched by real browser
 * use or a test that explicitly calls initialise()/computeEmbedding().
 *
 * Version:
 * v0.16.1
 *
 * Date Code:
 * 140726
 * ==========================================================
 */

// Pinned to a specific published version, not @latest — same lesson
// already applied to the MediaPipe CDN paths earlier in this project.
const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.15/model'

class FaceEmbeddingService {
  constructor() {
    this.initialised = false
    this.available = false
    this.lastError = null
    this.loadingPromise = null
    this.faceapi = null
  }

  async initialise() {
    if (this.initialised && this.available) {
      return this.getStatus()
    }

    if (this.loadingPromise) {
      await this.loadingPromise
      return this.getStatus()
    }

    this.loadingPromise = (async () => {
      try {
        const faceapi = await import('@vladmandic/face-api')

        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        ])

        this.faceapi = faceapi
        this.initialised = true
        this.available = true
        this.lastError = null
      } catch (error) {
        this.faceapi = null
        this.initialised = false
        this.available = false
        this.lastError = error?.message || 'Face embedding model initialisation failed.'
      }
    })()

    await this.loadingPromise
    this.loadingPromise = null

    return this.getStatus()
  }

  /**
   * Computes a 128-d face-embedding descriptor from a captured
   * frame (the same { dataUrl, width, height } shape FrameCaptureService
   * produces). Never throws — returns an empty result on any failure
   * so a bad frame or slow model load can't break VisionPipeline.
   */
  async computeEmbedding(frame) {
    if (!frame?.dataUrl) {
      return this.emptyResult('No frame supplied to FaceEmbeddingService.')
    }

    if (!this.initialised || !this.available) {
      await this.initialise()
    }

    if (!this.available || !this.faceapi) {
      return this.emptyResult(this.lastError || 'Face embedding model is not available.')
    }

    try {
      const faceapi = this.faceapi
      const image = await this.loadImage(frame.dataUrl)

      const detection = await faceapi
        .detectSingleFace(image, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor()

      if (!detection?.descriptor) {
        return this.emptyResult('No face embedding detected in this frame.')
      }

      const descriptor = Array.from(detection.descriptor)

      return {
        status: 'success',
        provider: 'FACE_EMBEDDING_NET',
        faceDetected: true,
        descriptor,
        descriptorLength: descriptor.length,
        confidence: detection.detection?.score ?? 0,
        summary: `Face embedding computed (${descriptor.length}-d descriptor).`,
      }
    } catch (error) {
      return this.emptyResult(error?.message || 'Face embedding computation failed.')
    }
  }

  loadImage(dataUrl) {
    return new Promise((resolve, reject) => {
      const image = new Image()

      image.onload = () => resolve(image)
      image.onerror = () => reject(new Error('Unable to load frame image for face embedding.'))

      image.src = dataUrl
    })
  }

  emptyResult(message = 'No face embedding available.') {
    return {
      status: 'empty',
      provider: 'FACE_EMBEDDING_NET',
      faceDetected: false,
      descriptor: null,
      descriptorLength: 0,
      confidence: 0,
      summary: message,
    }
  }

  getStatus() {
    return {
      initialised: this.initialised,
      available: this.available,
      provider: 'FACE_EMBEDDING_NET',
      lastError: this.lastError,
    }
  }
}

export default new FaceEmbeddingService()
