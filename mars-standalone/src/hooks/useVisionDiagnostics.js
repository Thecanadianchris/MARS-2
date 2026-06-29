/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Hook:
 * useVisionDiagnostics
 *
 * Purpose:
 * Normalises Vision, Observation and Personal Observation data
 * for developer diagnostics display.
 *
 * Version:
 * v0.11.3
 *
 * Date Code:
 * 290626
 * ==========================================================
 */

import { useMemo } from 'react'

export default function useVisionDiagnostics({
  visionResult = null,
  observation = null,
  personalObservation = null,
  frameStatus = null,
} = {}) {
  return useMemo(() => {
    const personDetected =
      observation?.personPresent ??
      visionResult?.personDetected ??
      false

    const bodyState =
      observation?.bodyState ??
      visionResult?.bodyState ??
      'unknown'

    const movement =
      observation?.movement ??
      visionResult?.movement ??
      'unknown'

    const activity =
      observation?.activity ??
      visionResult?.activity ??
      'unknown'

    const faceState =
      observation?.faceState ??
      visionResult?.faceState ??
      'unknown'

    const confidence =
      observation?.confidence ??
      visionResult?.confidence ??
      0

    const timestamp =
      observation?.timestamp ??
      visionResult?.timestamp ??
      null

    return {
      camera: {
        value: frameStatus?.cameraReady ? 'Active' : 'Inactive',
        status: frameStatus?.cameraReady ? 'good' : 'warning',
        subtitle: frameStatus?.message ?? 'Camera readiness state',
      },

      person: {
        value: personDetected ? 'Person Detected' : 'No Person',
        status: personDetected ? 'good' : 'neutral',
        subtitle: `Confidence: ${Math.round(confidence * 100)}%`,
      },

      body: {
        value: bodyState,
        status: bodyState === 'unknown' ? 'warning' : 'info',
        subtitle: 'Current body state',
      },

      movement: {
        value: movement,
        status: movement === 'unknown' ? 'warning' : 'info',
        subtitle: 'Current movement state',
      },

      activity: {
        value: activity,
        status: activity === 'unknown' ? 'neutral' : 'info',
        subtitle: 'Recognised activity',
      },

      face: {
        value: faceState,
        status: faceState === 'unknown' ? 'neutral' : 'info',
        subtitle: 'Face foundation status',
      },

      observation: {
        value: observation?.type ?? 'No observation',
        status: observation ? 'good' : 'neutral',
        subtitle: timestamp
          ? new Date(timestamp).toLocaleTimeString()
          : 'No timestamp available',
      },

      personalObservation: {
        value:
          personalObservation?.summary ??
          personalObservation?.description ??
          'No personal observation',
        status: personalObservation ? 'good' : 'neutral',
        subtitle: 'Personal observation engine output',
      },
    }
  }, [visionResult, observation, personalObservation, frameStatus])
}