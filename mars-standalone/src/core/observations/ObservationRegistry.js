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
 * movement, posture and orientation only. It does not diagnose
 * or make medical conclusions.
 *
 * Version:
 * v0.11.0
 *
 * Date Code:
 * 280626
 * ==========================================================
 */

export const OBSERVATIONS = {
  PERSON_PRESENT: 'person_present',
  PERSON_NOT_VISIBLE: 'person_not_visible',

  HEAD_VISIBLE: 'head_visible',
  HEAD_NOT_VISIBLE: 'head_not_visible',
  HEAD_UP: 'head_up',
  HEAD_DOWN: 'head_down',
  HEAD_LEFT: 'head_left',
  HEAD_RIGHT: 'head_right',
  HEAD_LEVEL: 'head_level',
  HEAD_UP_LEFT: 'head_up_left',
  HEAD_UP_RIGHT: 'head_up_right',

  WALKING: 'walking',
  APPROACHING: 'approaching',
  LEAVING: 'leaving',
  WAITING: 'waiting',
  RESTING: 'resting',

  PROLONGED_STILLNESS: 'prolonged_stillness',
  LYING_DOWN: 'lying_down',
  POSSIBLE_FALL: 'possible_fall',
  REPETITIVE_MOVEMENT: 'repetitive_movement',
}

export const OBSERVATION_LABELS = {
  [OBSERVATIONS.PERSON_PRESENT]: 'Person present',
  [OBSERVATIONS.PERSON_NOT_VISIBLE]: 'Person not visible',

  [OBSERVATIONS.HEAD_VISIBLE]: 'Head visible',
  [OBSERVATIONS.HEAD_NOT_VISIBLE]: 'Head not visible',
  [OBSERVATIONS.HEAD_UP]: 'Head raised',
  [OBSERVATIONS.HEAD_DOWN]: 'Head lowered',
  [OBSERVATIONS.HEAD_LEFT]: 'Head turned left',
  [OBSERVATIONS.HEAD_RIGHT]: 'Head turned right',
  [OBSERVATIONS.HEAD_LEVEL]: 'Head level',
  [OBSERVATIONS.HEAD_UP_LEFT]: 'Head raised and turned left',
  [OBSERVATIONS.HEAD_UP_RIGHT]: 'Head raised and turned right',

  [OBSERVATIONS.WALKING]: 'Walking',
  [OBSERVATIONS.APPROACHING]: 'Approaching',
  [OBSERVATIONS.LEAVING]: 'Leaving',
  [OBSERVATIONS.WAITING]: 'Waiting',
  [OBSERVATIONS.RESTING]: 'Resting',

  [OBSERVATIONS.PROLONGED_STILLNESS]: 'Prolonged stillness',
  [OBSERVATIONS.LYING_DOWN]: 'Lying down',
  [OBSERVATIONS.POSSIBLE_FALL]: 'Possible fall observation',
  [OBSERVATIONS.REPETITIVE_MOVEMENT]: 'Repetitive movement',
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
