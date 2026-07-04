/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Service:
 * capabilityState
 *
 * Purpose:
 * Shared capability state model for LIVE / WAITING /
 * SIMULATION UI integrity.
 *
 * Version:
 * v0.13.8
 * Date Code:
 * 040726
 * ==========================================================
 */

export const CAPABILITY_STATE = Object.freeze({
  LIVE: 'live',
  WAITING: 'waiting',
  SIMULATION: 'simulation'
})

export function normaliseCapabilityState(state) {
  if (!state) return CAPABILITY_STATE.WAITING

  const value = String(state).toLowerCase()

  if (value === CAPABILITY_STATE.LIVE) return CAPABILITY_STATE.LIVE
  if (value === CAPABILITY_STATE.SIMULATION) return CAPABILITY_STATE.SIMULATION

  return CAPABILITY_STATE.WAITING
}

export function createCapabilityState({
  state = CAPABILITY_STATE.WAITING,
  label = '',
  source = 'unknown',
  confidence = 0,
  message = 'Waiting for capability data.',
  lastUpdate = null
} = {}) {
  return {
    state: normaliseCapabilityState(state),
    label,
    source,
    confidence,
    message,
    lastUpdate
  }
}

export function isLiveCapabilityState(state) {
  return normaliseCapabilityState(state?.state || state) === CAPABILITY_STATE.LIVE
}

export function isSimulationCapabilityState(state) {
  return normaliseCapabilityState(state?.state || state) === CAPABILITY_STATE.SIMULATION
}

export function isWaitingCapabilityState(state) {
  return normaliseCapabilityState(state?.state || state) === CAPABILITY_STATE.WAITING
}
export function createWaitingState({
  label = 'Waiting',
  source = 'unknown',
  message = 'Waiting for capability data.',
  confidence = 0,
  lastUpdate = null
} = {}) {
  return createCapabilityState({
    state: CAPABILITY_STATE.WAITING,
    label,
    source,
    message,
    confidence,
    lastUpdate
  })
}

export function createSimulationState({
  label = 'Simulation',
  source = 'simulation',
  message = 'Simulation data is active.',
  confidence = 1,
  lastUpdate = null
} = {}) {
  return createCapabilityState({
    state: CAPABILITY_STATE.SIMULATION,
    label,
    source,
    message,
    confidence,
    lastUpdate
  })
}