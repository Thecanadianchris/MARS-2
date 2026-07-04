/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Registry:
 * BehaviourProfileRegistry
 *
 * Purpose:
 * Stores user-extensible behaviour profiles such as laying in
 * bed, sitting on sofa, pacing, rocking or individually learned
 * visual warning signs.
 *
 * Profiles are neutral observation labels only. They do not
 * diagnose medical conditions.
 *
 * Version:
 * v0.13.8
 * Date Code:
 * 040726
 * ==========================================================
 */

import {
  BEHAVIOUR_CONCERN_LEVELS,
  BODY_POSITIONS,
  HEAD_DIRECTIONS,
  MOVEMENT_STATES
} from './BehaviourProfile'

export const BEHAVIOUR_PROFILE_ORIGINS = Object.freeze({
  SYSTEM: 'system',
  USER: 'user',
  LEARNED: 'learned'
})

const DEFAULT_BEHAVIOUR_PROFILES = Object.freeze([
  {
    id: 'laying-in-bed',
    label: 'Laying in bed',
    description: 'User-defined normal rest pattern. Usually body lying and movement still in bed context.',
    origin: BEHAVIOUR_PROFILE_ORIGINS.USER,
    normal: true,
    concernLevel: BEHAVIOUR_CONCERN_LEVELS.NONE,
    conditions: {
      bodyPositions: [BODY_POSITIONS.LYING],
      movementStates: [MOVEMENT_STATES.STILL, MOVEMENT_STATES.INACTIVE],
      headDirections: [HEAD_DIRECTIONS.FORWARD, HEAD_DIRECTIONS.LEFT, HEAD_DIRECTIONS.RIGHT, HEAD_DIRECTIONS.UNKNOWN],
      contexts: ['bed', 'bedroom', 'night']
    }
  },
  {
    id: 'lying-on-sofa',
    label: 'Lying on sofa',
    description: 'User-defined normal rest pattern for lounge or sofa context.',
    origin: BEHAVIOUR_PROFILE_ORIGINS.USER,
    normal: true,
    concernLevel: BEHAVIOUR_CONCERN_LEVELS.NONE,
    conditions: {
      bodyPositions: [BODY_POSITIONS.LYING],
      movementStates: [MOVEMENT_STATES.STILL, MOVEMENT_STATES.INACTIVE],
      contexts: ['sofa', 'lounge']
    }
  },
  {
    id: 'looking-up-left-sign',
    label: 'Looking up left sign',
    description: 'Individually learned visual sign. This is a sign only, not a diagnosis.',
    origin: BEHAVIOUR_PROFILE_ORIGINS.USER,
    normal: false,
    concernLevel: BEHAVIOUR_CONCERN_LEVELS.MEDIUM,
    conditions: {
      headDirections: [HEAD_DIRECTIONS.UP_LEFT],
      movementStates: [MOVEMENT_STATES.UNUSUAL, MOVEMENT_STATES.STILL]
    }
  },
  {
    id: 'floor-stillness',
    label: 'Floor stillness',
    description: 'Person appears to be on the floor with little or no movement.',
    origin: BEHAVIOUR_PROFILE_ORIGINS.SYSTEM,
    normal: false,
    concernLevel: BEHAVIOUR_CONCERN_LEVELS.HIGH,
    conditions: {
      bodyPositions: [BODY_POSITIONS.FLOOR],
      movementStates: [MOVEMENT_STATES.STILL, MOVEMENT_STATES.INACTIVE, MOVEMENT_STATES.FALL_DETECTED]
    }
  }
])

let behaviourProfiles = DEFAULT_BEHAVIOUR_PROFILES.map(cloneProfile)

function cloneProfile(profile) {
  return {
    ...profile,
    conditions: {
      bodyPositions: [...(profile.conditions?.bodyPositions || [])],
      headDirections: [...(profile.conditions?.headDirections || [])],
      movementStates: [...(profile.conditions?.movementStates || [])],
      contexts: [...(profile.conditions?.contexts || [])]
    }
  }
}

function normaliseProfile(profile = {}) {
  const label = String(profile.label || '').trim()

  if (!label) {
    throw new Error('Behaviour profile label is required.')
  }

  return {
    id: profile.id || label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
    label,
    description: profile.description || 'User-defined behaviour profile.',
    origin: profile.origin || BEHAVIOUR_PROFILE_ORIGINS.USER,
    normal: Boolean(profile.normal),
    concernLevel: profile.concernLevel || BEHAVIOUR_CONCERN_LEVELS.NONE,
    conditions: {
      bodyPositions: [...(profile.conditions?.bodyPositions || [])],
      headDirections: [...(profile.conditions?.headDirections || [])],
      movementStates: [...(profile.conditions?.movementStates || [])],
      contexts: [...(profile.conditions?.contexts || [])]
    }
  }
}

class BehaviourProfileRegistry {
  listProfiles() {
    return behaviourProfiles.map(cloneProfile)
  }

  getProfile(profileId) {
    const match = behaviourProfiles.find((profile) => profile.id === profileId)
    return match ? cloneProfile(match) : null
  }

  addProfile(profile) {
    const nextProfile = normaliseProfile(profile)
    const existingIndex = behaviourProfiles.findIndex((item) => item.id === nextProfile.id)

    if (existingIndex >= 0) {
      behaviourProfiles = behaviourProfiles.map((item, index) => (index === existingIndex ? nextProfile : item))
    } else {
      behaviourProfiles = [...behaviourProfiles, nextProfile]
    }

    return cloneProfile(nextProfile)
  }

  resetDefaults() {
    behaviourProfiles = DEFAULT_BEHAVIOUR_PROFILES.map(cloneProfile)
    return this.listProfiles()
  }
}

export default new BehaviourProfileRegistry()
