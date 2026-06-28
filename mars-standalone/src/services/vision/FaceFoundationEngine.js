/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Service:
 * FaceFoundationEngine
 *
 * Purpose:
 * Provides the first face/head foundation layer for the MARS
 * Vision Pipeline.
 *
 * This is NOT face recognition.
 * This engine estimates whether a head/face is visible and
 * derives approximate head orientation from MediaPipe pose
 * landmarks. It produces structured observations for future
 * Personal Observation Engine work.
 *
 * Version:
 * v0.11.0b
 *
 * Date Code:
 * 280626
 * ==========================================================
 */

import {
  OBSERVATIONS,
  createObservation,
} from '@/core/observations/ObservationRegistry'

const HEAD_THRESHOLDS = {
  yawLeft: -0.12,
  yawRight: 0.12,
  pitchUp: 0.14,
  pitchDown: -0.14,
  rollLeft: -0.045,
  rollRight: 0.045,
  smoothingFrames: 5,
}

class FaceFoundationEngine {
  constructor() {
    this.history = []
  }

  evaluate(poseResult, poseSummary) {
    const landmarks = poseResult?.landmarks || []

    if (!poseResult?.poseDetected || landmarks.length < 13) {
      return this.emptyResult('No pose landmarks available for head orientation.')
    }

    const nose = landmarks[0]
    const leftEyeInner = landmarks[1]
    const leftEye = landmarks[2]
    const leftEyeOuter = landmarks[3]
    const rightEyeInner = landmarks[4]
    const rightEye = landmarks[5]
    const rightEyeOuter = landmarks[6]
    const leftEar = landmarks[7]
    const rightEar = landmarks[8]
    const leftMouth = landmarks[9]
    const rightMouth = landmarks[10]
    const leftShoulder = landmarks[11]
    const rightShoulder = landmarks[12]

    const leftEyePoint = this.bestVisible([leftEye, leftEyeOuter, leftEyeInner])
    const rightEyePoint = this.bestVisible([rightEye, rightEyeOuter, rightEyeInner])
    const mouthMid = this.midpoint(leftMouth, rightMouth)
    const eyeMid = this.midpoint(leftEyePoint, rightEyePoint)
    const shoulderMid = this.midpoint(leftShoulder, rightShoulder)

    const headLandmarks = [
      nose,
      leftEyePoint,
      rightEyePoint,
      leftEar,
      rightEar,
      leftMouth,
      rightMouth,
    ]

    const visibleHeadLandmarks = headLandmarks.filter((landmark) =>
      this.isVisible(landmark)
    )

    const faceDetected = this.isVisible(nose) && visibleHeadLandmarks.length >= 2

    if (!faceDetected) {
      return this.emptyResult('Head landmarks are not visible enough for estimation.')
    }

    const shoulderWidth = Math.max(
      0.01,
      Math.abs((leftShoulder?.x || 0) - (rightShoulder?.x || 0))
    )

    const faceWidth = this.calculateFaceWidth(
      leftEyePoint,
      rightEyePoint,
      leftEar,
      rightEar,
      shoulderWidth
    )

    const rawYawScore = this.calculateYawScore({
      nose,
      eyeMid,
      shoulderMid,
      faceWidth,
      leftEar,
      rightEar,
    })

    const rawPitchScore = this.calculatePitchScore({
      nose,
      eyeMid,
      mouthMid,
      shoulderMid,
      faceWidth,
      shoulderWidth,
    })

    const rawRollScore = this.calculateRollScore(leftEyePoint, rightEyePoint)

    const smoothedScores = this.smoothScores({
      pitchScore: rawPitchScore,
      yawScore: rawYawScore,
      rollScore: rawRollScore,
    })

    const yaw = this.classifyYaw(smoothedScores.yawScore)
    const pitch = this.classifyPitch(smoothedScores.pitchScore)
    const roll = this.classifyRoll(smoothedScores.rollScore)
    const orientation = this.getOrientationLabel(pitch, yaw)
    const observations = this.createHeadObservations(pitch, yaw)

    const confidence = this.calculateConfidence(
      visibleHeadLandmarks.length,
      poseSummary,
      faceWidth,
      shoulderWidth
    )

    return {
      status: 'success',
      faceDetected,
      faceCount: 1,
      confidence,
      head: {
        visible: true,
        pitch,
        yaw,
        roll,

        pitchScore: Number(smoothedScores.pitchScore.toFixed(3)),
        yawScore: Number(smoothedScores.yawScore.toFixed(3)),
        rollScore: Number(smoothedScores.rollScore.toFixed(3)),

        rawPitchScore: Number(rawPitchScore.toFixed(3)),
        rawYawScore: Number(rawYawScore.toFixed(3)),
        rawRollScore: Number(rawRollScore.toFixed(3)),

        faceWidth: Number(faceWidth.toFixed(3)),
        shoulderWidth: Number(shoulderWidth.toFixed(3)),
        orientation,
      },
      observations,
      riskModifier: 0,
      summary: `Face foundation: ${orientation} (${confidence}% confidence).`,
    }
  }

  calculateYawScore({
    nose,
    eyeMid,
    shoulderMid,
    faceWidth,
    leftEar,
    rightEar,
  }) {
    const referenceX = Number.isFinite(eyeMid?.x)
      ? eyeMid.x
      : shoulderMid?.x

    const scale = Math.max(0.01, faceWidth)
    const noseOffset = ((nose?.x || 0) - (referenceX || 0)) / scale

    const leftEarVisibility = this.visibility(leftEar)
    const rightEarVisibility = this.visibility(rightEar)

    // Ear visibility becomes useful when one side of the head turns away.
    const earVisibilityBalance = (rightEarVisibility - leftEarVisibility) * 0.18

    return noseOffset + earVisibilityBalance
  }

  calculatePitchScore({
    nose,
    eyeMid,
    mouthMid,
    shoulderMid,
    faceWidth,
    shoulderWidth,
  }) {
    const scale = Math.max(0.01, faceWidth || shoulderWidth * 0.25)

    const noseToEye = Number.isFinite(eyeMid?.y)
      ? ((eyeMid.y || 0) - (nose?.y || 0)) / scale
      : 0

    const noseToMouth = Number.isFinite(mouthMid?.y)
      ? ((mouthMid.y || 0) - (nose?.y || 0)) / scale
      : 0

    const noseToShoulder = Number.isFinite(shoulderMid?.y)
      ? ((shoulderMid.y || 0) - (nose?.y || 0)) / Math.max(0.01, shoulderWidth)
      : 0

    /*
     * Positive pitch means head raised.
     * Negative pitch means head lowered.
     *
     * This is intentionally relative, not absolute, because camera angle,
     * body height and distance from camera all affect MediaPipe pose landmarks.
     */
    return noseToShoulder * 0.35 + noseToMouth * 0.12 - noseToEye * 0.08 - 0.28
  }

  calculateRollScore(leftEye, rightEye) {
    if (!this.isVisible(leftEye) || !this.isVisible(rightEye)) {
      return 0
    }

    return (leftEye.y || 0) - (rightEye.y || 0)
  }

  smoothScores(scores) {
    this.history.push(scores)

    if (this.history.length > HEAD_THRESHOLDS.smoothingFrames) {
      this.history.shift()
    }

    return {
      pitchScore: this.average(this.history.map((item) => item.pitchScore)),
      yawScore: this.average(this.history.map((item) => item.yawScore)),
      rollScore: this.average(this.history.map((item) => item.rollScore)),
    }
  }

  classifyYaw(score) {
    if (score <= HEAD_THRESHOLDS.yawLeft) return 'left'
    if (score >= HEAD_THRESHOLDS.yawRight) return 'right'
    return 'centre'
  }

  classifyPitch(score) {
    if (score >= HEAD_THRESHOLDS.pitchUp) return 'up'
    if (score <= HEAD_THRESHOLDS.pitchDown) return 'down'
    return 'level'
  }

  classifyRoll(score) {
    if (score <= HEAD_THRESHOLDS.rollLeft) return 'tilted_left'
    if (score >= HEAD_THRESHOLDS.rollRight) return 'tilted_right'
    return 'level'
  }

  createHeadObservations(pitch, yaw) {
    const observations = [createObservation(OBSERVATIONS.HEAD_VISIBLE, 90)]

    if (pitch === 'up') {
      observations.push(createObservation(OBSERVATIONS.HEAD_UP, 85))
    }

    if (yaw === 'left') {
      observations.push(createObservation(OBSERVATIONS.HEAD_LEFT, 85))
    }

    if (yaw === 'right') {
      observations.push(createObservation(OBSERVATIONS.HEAD_RIGHT, 85))
    }

    if (pitch === 'up' && yaw === 'left') {
      observations.push(createObservation(OBSERVATIONS.HEAD_UP_LEFT, 80))
    }

    if (pitch === 'up' && yaw === 'right') {
      observations.push(createObservation(OBSERVATIONS.HEAD_UP_RIGHT, 80))
    }

    if (pitch === 'level' && yaw === 'centre') {
      observations.push(createObservation(OBSERVATIONS.HEAD_LEVEL, 80))
    }

    return observations
  }

  getOrientationLabel(pitch, yaw) {
    if (pitch === 'up' && yaw === 'left') return 'Head up and left'
    if (pitch === 'up' && yaw === 'right') return 'Head up and right'
    if (pitch === 'up') return 'Head raised'
    if (pitch === 'down') return 'Head lowered'
    if (yaw === 'left') return 'Looking left'
    if (yaw === 'right') return 'Looking right'
    return 'Head level'
  }

  calculateConfidence(visibleHeadLandmarks, poseSummary, faceWidth, shoulderWidth) {
    const landmarkScore = Math.min(70, visibleHeadLandmarks * 10)
    const bodyScore = poseSummary?.bodyVisible ? 15 : 0
    const stabilityScore = poseSummary?.confidence
      ? Math.min(10, poseSummary.confidence / 10)
      : 0
    const geometryScore = faceWidth > shoulderWidth * 0.03 ? 5 : 0

    return Math.round(
      Math.min(100, landmarkScore + bodyScore + stabilityScore + geometryScore)
    )
  }

  calculateFaceWidth(leftEye, rightEye, leftEar, rightEar, shoulderWidth) {
    if (this.isVisible(leftEar) && this.isVisible(rightEar)) {
      return Math.max(0.01, Math.abs(leftEar.x - rightEar.x))
    }

    if (this.isVisible(leftEye) && this.isVisible(rightEye)) {
      return Math.max(0.01, Math.abs(leftEye.x - rightEye.x) * 2.4)
    }

    return Math.max(0.01, shoulderWidth * 0.28)
  }

  midpoint(first, second) {
    const x = this.average([first?.x, second?.x])
    const y = this.average([first?.y, second?.y])

    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      return null
    }

    return { x, y }
  }

  bestVisible(landmarks) {
    return landmarks
      .filter(Boolean)
      .sort((a, b) => this.visibility(b) - this.visibility(a))[0]
  }

  average(values) {
    const validValues = values.filter((value) => Number.isFinite(value))

    if (!validValues.length) {
      return 0
    }

    return validValues.reduce((sum, value) => sum + value, 0) / validValues.length
  }

  visibility(landmark) {
    if (!landmark) return 0
    if (typeof landmark.visibility === 'number') return landmark.visibility
    if (typeof landmark.presence === 'number') return landmark.presence
    return 1
  }

  isVisible(landmark) {
    return Boolean(landmark) && this.visibility(landmark) >= 0.35
  }

  reset() {
    this.history = []
  }

  emptyResult(message) {
    return {
      status: 'not_available',
      faceDetected: false,
      faceCount: 0,
      confidence: 0,
      head: {
        visible: false,
        pitch: 'unknown',
        yaw: 'unknown',
        roll: 'unknown',
        pitchScore: 0,
        yawScore: 0,
        rollScore: 0,
        rawPitchScore: 0,
        rawYawScore: 0,
        rawRollScore: 0,
        faceWidth: 0,
        shoulderWidth: 0,
        orientation: 'Unknown',
      },
      observations: [createObservation(OBSERVATIONS.HEAD_NOT_VISIBLE, 0)],
      riskModifier: 0,
      summary: `Face foundation: ${message}`,
    }
  }
}

export default new FaceFoundationEngine()
