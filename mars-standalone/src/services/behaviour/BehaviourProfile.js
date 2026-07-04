/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Module:
 * BehaviourProfile
 *
 * Purpose:
 * Defines the local behaviour profile model used by the
 * MARS Behaviour Intelligence Foundation.
 *
 * Behaviour profiles describe observed patterns only.
 * They do not diagnose medical conditions or make clinical
 * conclusions.
 *
 * Version:
 * v0.13.3
 *
 * Date Code:
 * 040726
 * ==========================================================
 */

export const BODY_POSITIONS = Object.freeze({
  STANDING: 'standing',
  SITTING: 'sitting',
  LYING: 'lying',
  FLOOR: 'floor',
  UNKNOWN: 'unknown'
})

export const HEAD_DIRECTIONS = Object.freeze({
  FORWARD: 'forward',
  UP: 'up',
  DOWN: 'down',
  LEFT: 'left',
  RIGHT: 'right',
  UP_LEFT: 'up_left',
  UP_RIGHT: 'up_right',
  UNKNOWN: 'unknown'
})

export const MOVEMENT_STATES = Object.freeze({
  MOVING: 'moving',
  STILL: 'still',
  INACTIVE: 'inactive',
  FALL_DETECTED: 'fall_detected',
  UNUSUAL: 'unusual',
  UNKNOWN: 'unknown'
})

export const BEHAVIOUR_CONCERN_LEVELS = Object.freeze({
  NONE: 'none',
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high'
})

export const BEHAVIOUR_ACTIONS = Object.freeze({
  OBSERVE: 'observe',
  LOG: 'log',
  NOTIFY: 'notify'
})

class BehaviourProfile {
  constructor(profile = {}) {
    const safeProfile = profile || {}

    this.profileId = safeProfile.profileId || safeProfile.id || 'behaviour-profile-unknown'
    this.personId = safeProfile.personId || safeProfile.profileId || safeProfile.id || 'unknown-person'
    this.displayName = safeProfile.displayName || 'Unknown person'
    this.protectedUser = Boolean(safeProfile.protectedUser || safeProfile.protected)
    this.baseline = {
      normalBodyPositions: Array.isArray(safeProfile.baseline?.normalBodyPositions)
        ? [...safeProfile.baseline.normalBodyPositions]
        : [BODY_POSITIONS.STANDING, BODY_POSITIONS.SITTING],
      normalHeadDirections: Array.isArray(safeProfile.baseline?.normalHeadDirections)
        ? [...safeProfile.baseline.normalHeadDirections]
        : [HEAD_DIRECTIONS.FORWARD],
      normalMovementStates: Array.isArray(safeProfile.baseline?.normalMovementStates)
        ? [...safeProfile.baseline.normalMovementStates]
        : [MOVEMENT_STATES.MOVING, MOVEMENT_STATES.STILL],
      inactivityConcernSeconds: Number(safeProfile.baseline?.inactivityConcernSeconds ?? 180),
      floorConcernSeconds: Number(safeProfile.baseline?.floorConcernSeconds ?? 30)
    }
    this.observationHistory = Array.isArray(safeProfile.observationHistory)
      ? [...safeProfile.observationHistory]
      : []
    this.createdAt = safeProfile.createdAt || Date.now()
    this.updatedAt = safeProfile.updatedAt || this.createdAt
  }

  addObservation(observation = {}) {
    const safeObservation = observation || {}
    const record = {
      timestamp: safeObservation.timestamp || Date.now(),
      type: safeObservation.type || 'behaviour_observation',
      bodyPosition: safeObservation.bodyPosition || BODY_POSITIONS.UNKNOWN,
      headDirection: safeObservation.headDirection || HEAD_DIRECTIONS.UNKNOWN,
      movementState: safeObservation.movementState || MOVEMENT_STATES.UNKNOWN,
      confidence: Number(safeObservation.confidence ?? 0),
      concernLevel: safeObservation.concernLevel || BEHAVIOUR_CONCERN_LEVELS.NONE,
      notes: safeObservation.notes || []
    }

    this.observationHistory.push(record)
    this.updatedAt = record.timestamp

    return record
  }

  isBodyPositionNormal(bodyPosition) {
    return this.baseline.normalBodyPositions.includes(bodyPosition)
  }

  isHeadDirectionNormal(headDirection) {
    return this.baseline.normalHeadDirections.includes(headDirection)
  }

  isMovementStateNormal(movementState) {
    return this.baseline.normalMovementStates.includes(movementState)
  }

  toJSON() {
    return {
      profileId: this.profileId,
      personId: this.personId,
      displayName: this.displayName,
      protectedUser: this.protectedUser,
      baseline: { ...this.baseline },
      observationHistory: [...this.observationHistory],
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    }
  }

  static create(profile = {}) {
    return new BehaviourProfile(profile)
  }
}

export default BehaviourProfile
