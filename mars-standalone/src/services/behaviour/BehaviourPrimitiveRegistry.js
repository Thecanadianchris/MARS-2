/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Registry:
 * BehaviourPrimitiveRegistry
 *
 * Purpose:
 * Defines low-level behaviour primitives that can be combined
 * into user-defined behaviour profiles.
 *
 * Version:
 * v0.13.8
 * Date Code:
 * 040726
 * ==========================================================
 */

import {
  BODY_POSITIONS,
  HEAD_DIRECTIONS,
  MOVEMENT_STATES
} from './BehaviourProfile'

export const PRIMITIVE_GROUPS = Object.freeze({
  BODY_POSITION: 'bodyPosition',
  HEAD_DIRECTION: 'headDirection',
  MOVEMENT_STATE: 'movementState',
  CONTEXT: 'context'
})

export const SYSTEM_BEHAVIOUR_PRIMITIVES = Object.freeze({
  bodyPositions: Object.freeze([
    { id: BODY_POSITIONS.STANDING, label: 'Standing', group: PRIMITIVE_GROUPS.BODY_POSITION },
    { id: BODY_POSITIONS.SITTING, label: 'Sitting', group: PRIMITIVE_GROUPS.BODY_POSITION },
    { id: BODY_POSITIONS.LYING, label: 'Lying', group: PRIMITIVE_GROUPS.BODY_POSITION },
    { id: BODY_POSITIONS.FLOOR, label: 'On floor', group: PRIMITIVE_GROUPS.BODY_POSITION },
    { id: BODY_POSITIONS.UNKNOWN, label: 'Unknown body position', group: PRIMITIVE_GROUPS.BODY_POSITION }
  ]),
  headDirections: Object.freeze([
    { id: HEAD_DIRECTIONS.FORWARD, label: 'Forward', group: PRIMITIVE_GROUPS.HEAD_DIRECTION },
    { id: HEAD_DIRECTIONS.UP, label: 'Up', group: PRIMITIVE_GROUPS.HEAD_DIRECTION },
    { id: HEAD_DIRECTIONS.DOWN, label: 'Down', group: PRIMITIVE_GROUPS.HEAD_DIRECTION },
    { id: HEAD_DIRECTIONS.LEFT, label: 'Left', group: PRIMITIVE_GROUPS.HEAD_DIRECTION },
    { id: HEAD_DIRECTIONS.RIGHT, label: 'Right', group: PRIMITIVE_GROUPS.HEAD_DIRECTION },
    { id: HEAD_DIRECTIONS.UP_LEFT, label: 'Up left', group: PRIMITIVE_GROUPS.HEAD_DIRECTION },
    { id: HEAD_DIRECTIONS.UP_RIGHT, label: 'Up right', group: PRIMITIVE_GROUPS.HEAD_DIRECTION },
    { id: HEAD_DIRECTIONS.UNKNOWN, label: 'Unknown head direction', group: PRIMITIVE_GROUPS.HEAD_DIRECTION }
  ]),
  movementStates: Object.freeze([
    { id: MOVEMENT_STATES.MOVING, label: 'Moving', group: PRIMITIVE_GROUPS.MOVEMENT_STATE },
    { id: MOVEMENT_STATES.STILL, label: 'Still', group: PRIMITIVE_GROUPS.MOVEMENT_STATE },
    { id: MOVEMENT_STATES.INACTIVE, label: 'Inactive', group: PRIMITIVE_GROUPS.MOVEMENT_STATE },
    { id: MOVEMENT_STATES.FALL_DETECTED, label: 'Fall sign', group: PRIMITIVE_GROUPS.MOVEMENT_STATE },
    { id: MOVEMENT_STATES.UNUSUAL, label: 'Unusual movement', group: PRIMITIVE_GROUPS.MOVEMENT_STATE },
    { id: MOVEMENT_STATES.UNKNOWN, label: 'Unknown movement', group: PRIMITIVE_GROUPS.MOVEMENT_STATE }
  ])
})

class BehaviourPrimitiveRegistry {
  listAll() {
    return [
      ...SYSTEM_BEHAVIOUR_PRIMITIVES.bodyPositions,
      ...SYSTEM_BEHAVIOUR_PRIMITIVES.headDirections,
      ...SYSTEM_BEHAVIOUR_PRIMITIVES.movementStates
    ]
  }

  listByGroup(group) {
    return this.listAll().filter((primitive) => primitive.group === group)
  }

  hasPrimitive(id) {
    return this.listAll().some((primitive) => primitive.id === id)
  }
}

export default new BehaviourPrimitiveRegistry()
