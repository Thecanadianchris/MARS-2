/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Hook:
 * useVisionDiagnostics
 *
 * Purpose:
 * Normalises live Vision Pipeline, Observation and Personal
 * Observation data for developer diagnostics display.
 *
 * Version:
 * v0.13.5
 *
 * Date Code:
 * 050726
 * ==========================================================
 */

import { useMemo } from 'react'
import { IDENTITY_STATES } from '@/services/identity/IdentityTypes'

const IDENTIFIED_STATES = [
  IDENTITY_STATES.KNOWN,
  IDENTITY_STATES.TRUSTED,
  IDENTITY_STATES.PROTECTED,
]

function normaliseConfidence(value) {
  if (typeof value !== 'number') {
    return 0
  }

  return value > 1 ? value / 100 : value
}

function getBodyState(visionResult, observation) {
  return (
    observation?.bodyState ||
    visionResult?.bodyState?.posture ||
    visionResult?.bodyState?.state ||
    visionResult?.poseSummary?.posture ||
    visionResult?.bodyState ||
    'unknown'
  )
}

function getMovementState(visionResult, observation) {
  return (
    observation?.movement ||
    visionResult?.movement?.state ||
    visionResult?.movement?.direction ||
    visionResult?.movement ||
    'unknown'
  )
}

function getActivityState(visionResult, observation) {
  return (
    observation?.activity ||
    visionResult?.activityRecognition?.activity ||
    visionResult?.activityRecognition?.state ||
    visionResult?.activity ||
    'unknown'
  )
}

function getFaceState(visionResult, observation) {
  return (
    observation?.faceState ||
    visionResult?.faceFoundation?.state ||
    visionResult?.faceFoundation?.summary ||
    visionResult?.faceState ||
    'unknown'
  )
}

export default function useVisionDiagnostics({
  visionResult = null,
  observation = null,
  personalObservation = null,
  frameStatus = null,
} = {}) {
  return useMemo(() => {
    const personDetected =
      observation?.personPresent ??
      Boolean(visionResult?.detections?.people) ??
      visionResult?.personDetected ??
      false

    const bodyState = getBodyState(visionResult, observation)
    const movement = getMovementState(visionResult, observation)
    const activity = getActivityState(visionResult, observation)
    const faceState = getFaceState(visionResult, observation)

    const confidence = normaliseConfidence(
      observation?.confidence ??
        visionResult?.risk?.confidence ??
        visionResult?.confidence ??
        0
    )

    const timestamp =
      observation?.timestamp ??
      visionResult?.timestamp ??
      null

    const liveFrameCount = visionResult?.performance?.processedFrameCount || 0

    // v0.16.1: say who, not just whether. `visionResult.identity` is the
    // full IdentityEngine result VisionPipeline attaches to every live
    // frame — reuse it here instead of just the person/face detection
    // booleans, same source of truth as the ID tab's live identity read.
    const identity = visionResult?.identity || null
    const isIdentified = Boolean(identity && IDENTIFIED_STATES.includes(identity.state))
    const identifiedName = isIdentified ? identity.profile?.displayName : null

    const personValue = !personDetected
      ? 'No Person'
      : identifiedName || 'Person Unknown'

    return {
      camera: {
        value: frameStatus?.cameraReady ? 'Active' : 'Inactive',
        status: frameStatus?.cameraReady ? 'good' : 'warning',
        subtitle: liveFrameCount
          ? `${frameStatus?.message ?? 'Camera readiness state'} · Frame ${liveFrameCount}`
          : frameStatus?.message ?? 'Camera readiness state',
      },

      person: {
        value: personValue,
        status: !personDetected ? 'neutral' : identifiedName ? 'good' : 'warning',
        subtitle: `Confidence: ${Math.round(confidence * 100)}%`,
      },

      body: {
        value: bodyState,
        status: bodyState === 'unknown' ? 'warning' : 'info',
        subtitle: visionResult?.bodyState?.summary || 'Current body state',
      },

      movement: {
        value: movement,
        status: movement === 'unknown' ? 'warning' : 'info',
        subtitle: visionResult?.movement?.summary || 'Current movement state',
      },

      activity: {
        value: activity,
        status: activity === 'unknown' ? 'neutral' : 'info',
        subtitle: visionResult?.activityRecognition?.summary || 'Recognised activity',
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
