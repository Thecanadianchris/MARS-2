/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Engine:
 * PersonalObservationEngine
 *
 * Purpose:
 * Evaluates the neutral Vision Observation Stream against
 * configurable person-specific observation profiles.
 *
 * This is NOT a medical diagnosis engine.
 * It does not detect seizures, diagnose health conditions or
 * make emergency decisions. It only identifies configured
 * personal observation markers that may be useful to the
 * future Decision Engine.
 *
 * Version:
 * v0.11.2
 *
 * Date Code:
 * 280626
 * ==========================================================
 */

import {
  OBSERVATIONS,
  createObservation,
} from '@/core/observations/ObservationRegistry'

const DEFAULT_PROFILE_ID = 'finley'

const PERSONAL_PROFILES = {
  finley: {
    id: 'finley',
    displayName: 'Finley',
    enabled: true,
    markers: [
      {
        id: 'finley_head_up_left',
        label: 'Finley head raised and turned left',
        observationIds: [OBSERVATIONS.HEAD_UP_LEFT],
        requiredSeconds: 3,
        priority: 'watch',
        confidenceThreshold: 70,
      },
      {
        id: 'finley_head_up_right',
        label: 'Finley head raised and turned right',
        observationIds: [OBSERVATIONS.HEAD_UP_RIGHT],
        requiredSeconds: 3,
        priority: 'watch',
        confidenceThreshold: 70,
      },
      {
        id: 'finley_prolonged_stillness',
        label: 'Finley prolonged stillness',
        observationIds: [OBSERVATIONS.MOVEMENT_STATIONARY],
        requiredSeconds: 20,
        priority: 'watch',
        confidenceThreshold: 60,
      },
    ],
  },
}

class PersonalObservationEngine {
  constructor() {
    this.markerHistory = new Map()
  }

  evaluate(observationStream, options = {}) {
    const profileId = options.profileId || DEFAULT_PROFILE_ID
    const profile = PERSONAL_PROFILES[profileId]

    if (!profile || !profile.enabled) {
      return this.emptyResult(profileId)
    }

    const observations = observationStream?.observations || []
    const observationIds = new Set(observations.map((observation) => observation.id))
    const markerResults = profile.markers.map((marker) =>
      this.evaluateMarker(marker, observations, observationIds)
    )

    const activeMarkers = markerResults.filter((marker) => marker.active)
    const watchMarkers = markerResults.filter((marker) => marker.priority === 'watch')
    const highestPriority = this.getHighestPriority(activeMarkers)

    return {
      status: 'success',
      profile: {
        id: profile.id,
        displayName: profile.displayName,
      },
      markerCount: markerResults.length,
      activeMarkerCount: activeMarkers.length,
      highestPriority,
      markers: markerResults,
      observations: this.createPersonalObservations(profile, activeMarkers),
      riskModifier: this.calculateRiskModifier(activeMarkers),
      summary: this.createSummary(profile, activeMarkers, watchMarkers),
    }
  }

  evaluateMarker(marker, observations, observationIds) {
    const now = Date.now()
    const matchedObservations = observations.filter((observation) =>
      marker.observationIds.includes(observation.id)
    )

    const bestConfidence = matchedObservations.reduce(
      (highest, observation) => Math.max(highest, observation.confidence || 0),
      0
    )

    const currentlyObserved =
      matchedObservations.length > 0 &&
      bestConfidence >= (marker.confidenceThreshold || 0)

    const history = this.getMarkerHistory(marker.id)

    if (currentlyObserved) {
      if (!history.startedAt) {
        history.startedAt = now
      }

      history.lastSeenAt = now
      history.lastConfidence = bestConfidence
    } else {
      history.startedAt = null
      history.lastSeenAt = null
      history.lastConfidence = 0
    }

    const durationMs = history.startedAt ? now - history.startedAt : 0
    const requiredMs = (marker.requiredSeconds || 0) * 1000
    const active = currentlyObserved && durationMs >= requiredMs

    this.markerHistory.set(marker.id, history)

    return {
      id: marker.id,
      label: marker.label,
      priority: marker.priority || 'info',
      active,
      currentlyObserved,
      confidence: Math.round(bestConfidence),
      durationSeconds: Math.round(durationMs / 1000),
      requiredSeconds: marker.requiredSeconds || 0,
      matchedObservationIds: matchedObservations.map((observation) => observation.id),
      matchedObservationLabels: matchedObservations.map(
        (observation) => observation.label
      ),
    }
  }

  getMarkerHistory(markerId) {
    return (
      this.markerHistory.get(markerId) || {
        startedAt: null,
        lastSeenAt: null,
        lastConfidence: 0,
      }
    )
  }

  createPersonalObservations(profile, activeMarkers) {
    const observations = [
      createObservation(OBSERVATIONS.PERSONAL_PROFILE_ACTIVE, 100, {
        profileId: profile.id,
        displayName: profile.displayName,
      }),
    ]

    activeMarkers.forEach((marker) => {
      observations.push(
        createObservation(OBSERVATIONS.PERSONAL_MARKER_ACTIVE, marker.confidence, {
          markerId: marker.id,
          markerLabel: marker.label,
          priority: marker.priority,
          durationSeconds: marker.durationSeconds,
          profileId: profile.id,
        })
      )
    })

    return observations
  }

  calculateRiskModifier(activeMarkers) {
    if (!activeMarkers.length) {
      return 0
    }

    const priorityScores = {
      info: 0,
      watch: 1,
      concern: 2,
      urgent: 3,
    }

    return Math.min(
      3,
      activeMarkers.reduce(
        (total, marker) => total + (priorityScores[marker.priority] || 0),
        0
      )
    )
  }

  getHighestPriority(activeMarkers) {
    const priorityOrder = ['urgent', 'concern', 'watch', 'info']

    return (
      priorityOrder.find((priority) =>
        activeMarkers.some((marker) => marker.priority === priority)
      ) || 'normal'
    )
  }

  createSummary(profile, activeMarkers, watchMarkers) {
    if (!activeMarkers.length) {
      return `Personal observation: ${profile.displayName} profile active. No personal markers active.`
    }

    return `Personal observation: ${profile.displayName} marker active - ${activeMarkers
      .map((marker) => marker.label)
      .join(', ')}.`
  }

  emptyResult(profileId) {
    return {
      status: 'not_available',
      profile: {
        id: profileId || 'unknown',
        displayName: 'Unknown',
      },
      markerCount: 0,
      activeMarkerCount: 0,
      highestPriority: 'normal',
      markers: [],
      observations: [
        createObservation(OBSERVATIONS.PERSONAL_PROFILE_UNKNOWN, 0, {
          profileId,
        }),
      ],
      riskModifier: 0,
      summary: 'Personal observation: no active profile available.',
    }
  }

  reset() {
    this.markerHistory = new Map()
  }
}

export default new PersonalObservationEngine()
