/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Engine:
 * ObservationStreamEngine
 *
 * Purpose:
 * Combines structured outputs from the Vision Perception Stack
 * into a single neutral observation stream.
 *
 * This engine does not make personal, medical or alerting
 * decisions. It only normalises observations so future engines
 * such as the Personal Observation Engine and Decision Engine
 * can consume one consistent vocabulary.
 *
 * Version:
 * v0.11.1
 *
 * Date Code:
 * 280626
 * ==========================================================
 */

import {
  OBSERVATIONS,
  createObservation,
} from '@/core/observations/ObservationRegistry'

class ObservationStreamEngine {
  evaluate(visionResult) {
    const observations = []

    observations.push(...this.createPersonObservations(visionResult))
    observations.push(...this.createBodyObservations(visionResult))
    observations.push(...this.createMovementObservations(visionResult))
    observations.push(...this.createActivityObservations(visionResult))
    observations.push(...this.createFaceObservations(visionResult))
    observations.push(...this.createRiskObservations(visionResult))

    const uniqueObservations = this.deduplicate(observations)

    return {
      status: 'success',
      observationCount: uniqueObservations.length,
      observations: uniqueObservations,
      labels: uniqueObservations.map((observation) => observation.label),
      ids: uniqueObservations.map((observation) => observation.id),
      summary: this.createSummary(uniqueObservations),
    }
  }

  createPersonObservations(visionResult) {
    const people = visionResult?.detections?.people || 0

    if (people > 0) {
      return [
        createObservation(OBSERVATIONS.PERSON_PRESENT, 95, {
          people,
        }),
      ]
    }

    return [createObservation(OBSERVATIONS.PERSON_NOT_VISIBLE, 80)]
  }

  createBodyObservations(visionResult) {
    const posture = visionResult?.bodyState?.posture || visionResult?.detections?.pose
    const confidence = visionResult?.bodyState?.confidence || 0

    if (posture === 'standing' || posture === 'standing_or_sitting') {
      return [createObservation(OBSERVATIONS.BODY_STANDING, confidence)]
    }

    if (posture === 'sitting') {
      return [createObservation(OBSERVATIONS.BODY_SITTING, confidence)]
    }

    if (posture === 'lying') {
      return [createObservation(OBSERVATIONS.BODY_LYING, confidence)]
    }

    return [createObservation(OBSERVATIONS.BODY_UNKNOWN, confidence)]
  }

  createMovementObservations(visionResult) {
    const movement = visionResult?.movement

    if (!movement) {
      return [createObservation(OBSERVATIONS.MOVEMENT_UNKNOWN, 0)]
    }

    const observations = []
    const confidence = movement.confidence || 0

    if (movement.movement === 'moving') {
      observations.push(createObservation(OBSERVATIONS.MOVEMENT_MOVING, confidence))
    } else if (movement.movement === 'stationary') {
      observations.push(createObservation(OBSERVATIONS.MOVEMENT_STATIONARY, confidence))
    } else {
      observations.push(createObservation(OBSERVATIONS.MOVEMENT_UNKNOWN, confidence))
    }

    const directionObservation = this.getMovementDirectionObservation(
      movement.direction
    )

    if (directionObservation) {
      observations.push(
        createObservation(directionObservation, confidence, {
          direction: movement.direction,
          delta: movement.delta,
        })
      )
    }

    return observations
  }

  createActivityObservations(visionResult) {
    const activity = visionResult?.activityRecognition

    if (!activity) {
      return [createObservation(OBSERVATIONS.ACTIVITY_UNKNOWN, 0)]
    }

    const activityText = String(
      activity.activity || activity.activityDisplay || ''
    ).toLowerCase()

    const confidence = activity.confidence || 0

    if (activityText.includes('walking')) {
      return [createObservation(OBSERVATIONS.ACTIVITY_WALKING, confidence)]
    }

    if (activityText.includes('approach')) {
      return [createObservation(OBSERVATIONS.ACTIVITY_APPROACHING, confidence)]
    }

    if (activityText.includes('leav')) {
      return [createObservation(OBSERVATIONS.ACTIVITY_LEAVING, confidence)]
    }

    if (activityText.includes('waiting')) {
      return [createObservation(OBSERVATIONS.ACTIVITY_WAITING, confidence)]
    }

    if (activityText.includes('rest')) {
      return [createObservation(OBSERVATIONS.ACTIVITY_RESTING, confidence)]
    }

    if (activityText.includes('standing')) {
      return [createObservation(OBSERVATIONS.ACTIVITY_STANDING, confidence)]
    }

    return [
      createObservation(OBSERVATIONS.ACTIVITY_UNKNOWN, confidence, {
        activity: activity.activity || activity.activityDisplay,
      }),
    ]
  }

  createFaceObservations(visionResult) {
    return visionResult?.faceFoundation?.observations || []
  }

  createRiskObservations(visionResult) {
    const riskLabel = visionResult?.risk?.label || 'unknown'
    const confidence = visionResult?.risk?.confidence || 0

    const riskMap = {
      normal: OBSERVATIONS.RISK_NORMAL,
      low: OBSERVATIONS.RISK_LOW,
      medium: OBSERVATIONS.RISK_MEDIUM,
      high: OBSERVATIONS.RISK_HIGH,
      critical: OBSERVATIONS.RISK_CRITICAL,
    }

    const observationId = riskMap[riskLabel]

    if (!observationId) {
      return []
    }

    return [
      createObservation(observationId, confidence, {
        level: visionResult?.risk?.level,
        label: riskLabel,
      }),
    ]
  }

  getMovementDirectionObservation(direction) {
    const directionMap = {
      left: OBSERVATIONS.MOVEMENT_LEFT,
      right: OBSERVATIONS.MOVEMENT_RIGHT,
      up: OBSERVATIONS.MOVEMENT_UP,
      down: OBSERVATIONS.MOVEMENT_DOWN,
    }

    return directionMap[direction] || null
  }

  deduplicate(observations) {
    const observationMap = new Map()

    observations.filter(Boolean).forEach((observation) => {
      const existingObservation = observationMap.get(observation.id)

      if (
        !existingObservation ||
        observation.confidence > existingObservation.confidence
      ) {
        observationMap.set(observation.id, observation)
      }
    })

    return Array.from(observationMap.values())
  }

  createSummary(observations) {
    if (!observations.length) {
      return 'Observation stream: no observations available.'
    }

    return `Observation stream: ${observations
      .map((observation) => observation.label)
      .join(', ')}.`
  }
}

export default new ObservationStreamEngine()
