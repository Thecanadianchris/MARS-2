/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Registry:
 * ObservationRegistry
 *
 * Purpose:
 * Defines the standard observation identifiers used by the
 * MARS perception, personal observation and decision layers.
 *
 * This registry is deliberately neutral. It describes observed
 * movement, posture, activity and orientation only. It does not
 * diagnose or make medical conclusions.
 *
 * Version:
 * v0.11.2
 *
 * Date Code:
 * 280626
 * ==========================================================
 */

export const OBSERVATIONS = {
  PERSON_PRESENT: 'person_present',
  PERSON_NOT_VISIBLE: 'person_not_visible',

  BODY_STANDING: 'body_standing',
  BODY_SITTING: 'body_sitting',
  BODY_LYING: 'body_lying',
  BODY_UNKNOWN: 'body_unknown',

  MOVEMENT_MOVING: 'movement_moving',
  MOVEMENT_STATIONARY: 'movement_stationary',
  MOVEMENT_LEFT: 'movement_left',
  MOVEMENT_RIGHT: 'movement_right',
  MOVEMENT_UP: 'movement_up',
  MOVEMENT_DOWN: 'movement_down',
  MOVEMENT_UNKNOWN: 'movement_unknown',

  HEAD_VISIBLE: 'head_visible',
  HEAD_NOT_VISIBLE: 'head_not_visible',
  HEAD_UP: 'head_up',
  HEAD_DOWN: 'head_down',
  HEAD_LEFT: 'head_left',
  HEAD_RIGHT: 'head_right',
  HEAD_LEVEL: 'head_level',
  HEAD_UP_LEFT: 'head_up_left',
  HEAD_UP_RIGHT: 'head_up_right',

  ACTIVITY_STANDING: 'activity_standing',
  ACTIVITY_WALKING: 'activity_walking',
  ACTIVITY_APPROACHING: 'activity_approaching',
  ACTIVITY_LEAVING: 'activity_leaving',
  ACTIVITY_WAITING: 'activity_waiting',
  ACTIVITY_RESTING: 'activity_resting',
  ACTIVITY_UNKNOWN: 'activity_unknown',

  WALKING: 'walking',
  APPROACHING: 'approaching',
  LEAVING: 'leaving',
  WAITING: 'waiting',
  RESTING: 'resting',

  PROLONGED_STILLNESS: 'prolonged_stillness',
  LYING_DOWN: 'lying_down',
  POSSIBLE_FALL: 'possible_fall',
  REPETITIVE_MOVEMENT: 'repetitive_movement',

  PERSONAL_MARKER_ACTIVE: 'personal_marker_active',
  PERSONAL_MARKER_INACTIVE: 'personal_marker_inactive',
  PERSONAL_PROFILE_ACTIVE: 'personal_profile_active',
  PERSONAL_PROFILE_UNKNOWN: 'personal_profile_unknown',

  RISK_NORMAL: 'risk_normal',
  RISK_LOW: 'risk_low',
  RISK_MEDIUM: 'risk_medium',
  RISK_HIGH: 'risk_high',
  RISK_CRITICAL: 'risk_critical',
}

export const OBSERVATION_LABELS = {
  [OBSERVATIONS.PERSON_PRESENT]: 'Person present',
  [OBSERVATIONS.PERSON_NOT_VISIBLE]: 'Person not visible',

  [OBSERVATIONS.BODY_STANDING]: 'Body standing',
  [OBSERVATIONS.BODY_SITTING]: 'Body sitting',
  [OBSERVATIONS.BODY_LYING]: 'Body lying',
  [OBSERVATIONS.BODY_UNKNOWN]: 'Body posture unknown',

  [OBSERVATIONS.MOVEMENT_MOVING]: 'Movement detected',
  [OBSERVATIONS.MOVEMENT_STATIONARY]: 'Person stationary',
  [OBSERVATIONS.MOVEMENT_LEFT]: 'Movement left',
  [OBSERVATIONS.MOVEMENT_RIGHT]: 'Movement right',
  [OBSERVATIONS.MOVEMENT_UP]: 'Movement up',
  [OBSERVATIONS.MOVEMENT_DOWN]: 'Movement down',
  [OBSERVATIONS.MOVEMENT_UNKNOWN]: 'Movement unknown',

  [OBSERVATIONS.HEAD_VISIBLE]: 'Head visible',
  [OBSERVATIONS.HEAD_NOT_VISIBLE]: 'Head not visible',
  [OBSERVATIONS.HEAD_UP]: 'Head raised',
  [OBSERVATIONS.HEAD_DOWN]: 'Head lowered',
  [OBSERVATIONS.HEAD_LEFT]: 'Head turned left',
  [OBSERVATIONS.HEAD_RIGHT]: 'Head turned right',
  [OBSERVATIONS.HEAD_LEVEL]: 'Head level',
  [OBSERVATIONS.HEAD_UP_LEFT]: 'Head raised and turned left',
  [OBSERVATIONS.HEAD_UP_RIGHT]: 'Head raised and turned right',

  [OBSERVATIONS.ACTIVITY_STANDING]: 'Activity standing',
  [OBSERVATIONS.ACTIVITY_WALKING]: 'Activity walking',
  [OBSERVATIONS.ACTIVITY_APPROACHING]: 'Activity approaching',
  [OBSERVATIONS.ACTIVITY_LEAVING]: 'Activity leaving',
  [OBSERVATIONS.ACTIVITY_WAITING]: 'Activity waiting',
  [OBSERVATIONS.ACTIVITY_RESTING]: 'Activity resting',
  [OBSERVATIONS.ACTIVITY_UNKNOWN]: 'Activity unknown',

  [OBSERVATIONS.WALKING]: 'Walking',
  [OBSERVATIONS.APPROACHING]: 'Approaching',
  [OBSERVATIONS.LEAVING]: 'Leaving',
  [OBSERVATIONS.WAITING]: 'Waiting',
  [OBSERVATIONS.RESTING]: 'Resting',

  [OBSERVATIONS.PROLONGED_STILLNESS]: 'Prolonged stillness',
  [OBSERVATIONS.LYING_DOWN]: 'Lying down',
  [OBSERVATIONS.POSSIBLE_FALL]: 'Possible fall observation',
  [OBSERVATIONS.REPETITIVE_MOVEMENT]: 'Repetitive movement',

  [OBSERVATIONS.PERSONAL_MARKER_ACTIVE]: 'Personal marker active',
  [OBSERVATIONS.PERSONAL_MARKER_INACTIVE]: 'Personal marker inactive',
  [OBSERVATIONS.PERSONAL_PROFILE_ACTIVE]: 'Personal profile active',
  [OBSERVATIONS.PERSONAL_PROFILE_UNKNOWN]: 'Personal profile unknown',

  [OBSERVATIONS.RISK_NORMAL]: 'Risk normal',
  [OBSERVATIONS.RISK_LOW]: 'Risk low',
  [OBSERVATIONS.RISK_MEDIUM]: 'Risk medium',
  [OBSERVATIONS.RISK_HIGH]: 'Risk high',
  [OBSERVATIONS.RISK_CRITICAL]: 'Risk critical',
}

export function getObservationLabel(observationId) {
  return OBSERVATION_LABELS[observationId] || observationId || 'Unknown observation'
}

export function createObservation(observationId, confidence = 0, details = {}) {
  return {
    id: observationId,
    label: getObservationLabel(observationId),
    confidence: Math.round(confidence),
    details,
    timestamp: Date.now(),
  }
}
