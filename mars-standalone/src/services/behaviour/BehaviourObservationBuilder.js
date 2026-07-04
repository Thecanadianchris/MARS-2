/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Module:
 * BehaviourObservationBuilder
 *
 * Purpose:
 * Converts body, pose, movement and identity inputs into
 * neutral behaviour observations for the MARS Behaviour
 * Intelligence Foundation.
 *
 * This builder observes signs and patterns only. It does not
 * diagnose seizures, dementia, falls or any medical condition.
 *
 * Version:
 * v0.13.3
 *
 * Date Code:
 * 040726
 * ==========================================================
 */

import {
  BODY_POSITIONS,
  HEAD_DIRECTIONS,
  MOVEMENT_STATES
} from './BehaviourProfile'

class BehaviourObservationBuilder {
  build(input = {}) {
    const safeInput = input || {}
    const perceptionResult = safeInput.perceptionResult || {}
    const identityResult = safeInput.identityResult || {}
    const options = safeInput.options || {}
    const timestamp = options.timestamp || Date.now()

    const bodyPosition = this.resolveBodyPosition(perceptionResult, options)
    const headDirection = this.resolveHeadDirection(perceptionResult, options)
    const movementState = this.resolveMovementState(perceptionResult, options)
    const inactiveDurationSeconds = Number(
      options.inactiveDurationSeconds ??
      perceptionResult.inactiveDurationSeconds ??
      perceptionResult.movement?.inactiveDurationSeconds ??
      0
    )

    const observations = []

    observations.push(this.createObservation({
      id: 'behaviour_body_position',
      type: 'body_position',
      value: bodyPosition,
      confidence: this.resolveConfidence(perceptionResult, options),
      timestamp
    }))

    observations.push(this.createObservation({
      id: 'behaviour_head_direction',
      type: 'head_direction',
      value: headDirection,
      confidence: this.resolveConfidence(perceptionResult, options),
      timestamp
    }))

    observations.push(this.createObservation({
      id: 'behaviour_movement_state',
      type: 'movement_state',
      value: movementState,
      confidence: this.resolveConfidence(perceptionResult, options),
      timestamp
    }))

    if (bodyPosition === BODY_POSITIONS.FLOOR || bodyPosition === BODY_POSITIONS.LYING) {
      observations.push(this.createObservation({
        id: 'behaviour_floor_or_lying_position',
        type: 'possible_concern_sign',
        value: bodyPosition,
        confidence: 0.8,
        timestamp,
        notes: ['Person appears to be low, lying or on the floor.']
      }))
    }

    if (headDirection === HEAD_DIRECTIONS.UP_LEFT || headDirection === HEAD_DIRECTIONS.UP_RIGHT) {
      observations.push(this.createObservation({
        id: 'behaviour_unusual_head_direction',
        type: 'possible_concern_sign',
        value: headDirection,
        confidence: 0.75,
        timestamp,
        notes: ['Head direction differs from normal forward-facing observation.']
      }))
    }

    if (movementState === MOVEMENT_STATES.FALL_DETECTED || movementState === MOVEMENT_STATES.UNUSUAL) {
      observations.push(this.createObservation({
        id: 'behaviour_unusual_movement',
        type: 'possible_concern_sign',
        value: movementState,
        confidence: 0.85,
        timestamp,
        notes: ['Movement pattern is unusual and should be reviewed.']
      }))
    }

    if (inactiveDurationSeconds > 0) {
      observations.push(this.createObservation({
        id: 'behaviour_inactivity_duration',
        type: 'inactivity_duration',
        value: inactiveDurationSeconds,
        confidence: 0.9,
        timestamp,
        notes: [`Observed inactivity duration: ${inactiveDurationSeconds} seconds.`]
      }))
    }

    return {
      status: 'success',
      provider: 'LOCAL_BEHAVIOUR_OBSERVATION_BUILDER',
      version: 'v0.13.3',
      timestamp,
      identity: {
        profileId: identityResult.profile?.id || identityResult.profileId || 'unknown',
        displayName: identityResult.profile?.displayName || identityResult.displayName || 'Unknown',
        protectedUser: Boolean(identityResult.protected || identityResult.profile?.protected)
      },
      bodyPosition,
      headDirection,
      movementState,
      inactiveDurationSeconds,
      observations,
      ids: observations.map((observation) => observation.id)
    }
  }

  createObservation(data = {}) {
    return {
      id: data.id,
      type: data.type,
      value: data.value,
      confidence: Number(data.confidence ?? 0),
      timestamp: data.timestamp || Date.now(),
      notes: Array.isArray(data.notes) ? [...data.notes] : []
    }
  }

  resolveBodyPosition(perceptionResult = {}, options = {}) {
    return (
      options.bodyPosition ||
      perceptionResult.bodyPosition ||
      perceptionResult.bodyState ||
      perceptionResult.pose?.bodyPosition ||
      perceptionResult.posture?.bodyPosition ||
      BODY_POSITIONS.UNKNOWN
    )
  }

  resolveHeadDirection(perceptionResult = {}, options = {}) {
    return (
      options.headDirection ||
      perceptionResult.headDirection ||
      perceptionResult.pose?.headDirection ||
      perceptionResult.faceFoundation?.headDirection ||
      HEAD_DIRECTIONS.UNKNOWN
    )
  }

  resolveMovementState(perceptionResult = {}, options = {}) {
    return (
      options.movementState ||
      perceptionResult.movementState ||
      perceptionResult.movement?.state ||
      perceptionResult.activity?.movementState ||
      MOVEMENT_STATES.UNKNOWN
    )
  }

  resolveConfidence(perceptionResult = {}, options = {}) {
    const value = Number(
      options.confidence ??
      perceptionResult.confidence ??
      perceptionResult.pose?.confidence ??
      0.5
    )

    if (Number.isNaN(value)) {
      return 0.5
    }

    return Math.max(0, Math.min(1, value))
  }
}

export default new BehaviourObservationBuilder()
