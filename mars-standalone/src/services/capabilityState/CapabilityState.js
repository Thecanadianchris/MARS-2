/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Service:
 * CapabilityState
 *
 * Purpose:
 * Shared state model for MARS capability panels.
 *
 * EP-012 — Live Data Integrity:
 * Every capability panel shall clearly distinguish between
 * LIVE, WAITING and SIMULATION states. Simulated information
 * shall never be presented as live robot observations.
 *
 * Version:
 * v0.13.7a
 * Date Code:
 * 040726
 * ==========================================================
 */

export const CAPABILITY_STATE = Object.freeze({
  LIVE: 'live',
  WAITING: 'waiting',
  SIMULATION: 'simulation'
})

export const CAPABILITY_STATE_LABELS = Object.freeze({
  [CAPABILITY_STATE.LIVE]: 'Live',
  [CAPABILITY_STATE.WAITING]: 'Waiting',
  [CAPABILITY_STATE.SIMULATION]: 'Simulation'
})

export function createCapabilityState({
  state = CAPABILITY_STATE.WAITING,
  source = 'unknown',
  confidence = 0,
  message = 'Waiting for live data.',
  lastUpdate = null,
  live = false,
  simulation = false
} = {}) {
  const safeState = normaliseCapabilityState(state)

  return Object.freeze({
    state: safeState,
    label: CAPABILITY_STATE_LABELS[safeState],
    source,
    confidence: Number.isFinite(confidence) ? confidence : 0,
    message,
    lastUpdate,
    isLive: live || safeState === CAPABILITY_STATE.LIVE,
    isWaiting: safeState === CAPABILITY_STATE.WAITING,
    isSimulation: simulation || safeState === CAPABILITY_STATE.SIMULATION
  })
}

export function createWaitingState(message = 'Waiting for live upstream data.', source = 'mars-pipeline') {
  return createCapabilityState({
    state: CAPABILITY_STATE.WAITING,
    source,
    confidence: 0,
    message,
    live: false,
    simulation: false
  })
}

export function createSimulationState(message = 'Developer simulation is active.', source = 'ui-simulation') {
  return createCapabilityState({
    state: CAPABILITY_STATE.SIMULATION,
    source,
    confidence: 100,
    message,
    lastUpdate: Date.now(),
    live: false,
    simulation: true
  })
}

export function createLiveState({ message = 'Live robot data is available.', source = 'mars-pipeline', confidence = 0 } = {}) {
  return createCapabilityState({
    state: CAPABILITY_STATE.LIVE,
    source,
    confidence,
    message,
    lastUpdate: Date.now(),
    live: true,
    simulation: false
  })
}

export function normaliseCapabilityState(state) {
  const value = String(state || '').toLowerCase()

  if (value === CAPABILITY_STATE.LIVE) return CAPABILITY_STATE.LIVE
  if (value === CAPABILITY_STATE.SIMULATION) return CAPABILITY_STATE.SIMULATION
  return CAPABILITY_STATE.WAITING
}

export function isLiveState(capabilityState) {
  return normaliseCapabilityState(capabilityState?.state) === CAPABILITY_STATE.LIVE
}

export function isWaitingState(capabilityState) {
  return normaliseCapabilityState(capabilityState?.state) === CAPABILITY_STATE.WAITING
}

export function isSimulationState(capabilityState) {
  return normaliseCapabilityState(capabilityState?.state) === CAPABILITY_STATE.SIMULATION
}
