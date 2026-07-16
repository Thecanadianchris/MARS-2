/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Hook:
 * useFaceEnrollment
 *
 * Purpose:
 * v0.16.1 Face Registration & Known Person Database — gives the
 * Identity Panel a real "enroll this person" control instead of
 * the browser-console-only path used to bootstrap testing in
 * v0.16/v0.16.0.1. Reads the live camera's most recent face
 * embedding straight from LivePipelineStore (same source the ID
 * tab's live identity display already polls) and calls
 * FaceRecognitionService.enroll() a few times in a row to build up
 * FaceEnrollmentStore's per-person sample set.
 *
 * This hook owns no face-recognition logic itself — it's UI
 * plumbing around FaceRecognitionService/FaceEnrollmentStore,
 * same separation of concerns as useIdentityFoundation.
 *
 * Version:
 * v0.16.1
 *
 * Date Code:
 * 140726
 * ==========================================================
 */

import { useEffect, useMemo, useState } from 'react'
import LivePipelineStore from '@/services/livePipeline/LivePipelineStore'
import FaceRecognitionService from '@/services/identity/FaceRecognitionService'
import FaceEnrollmentStore from '@/services/identity/FaceEnrollmentStore'
import FaceCaptureUiStore from '@/services/vision/FaceCaptureUiStore'

const LIVE_POLL_INTERVAL_MS = 500
const SAMPLE_COUNT = 4
const SAMPLE_INTERVAL_MS = 600

export default function useFaceEnrollment() {
  const [liveTick, setLiveTick] = useState(0)
  const [enrollmentTick, setEnrollmentTick] = useState(0)
  const [capturingPersonId, setCapturingPersonId] = useState(null)
  const [captureProgress, setCaptureProgress] = useState(0)
  const [lastResult, setLastResult] = useState(null)

  useEffect(() => {
    const interval = setInterval(() => {
      setLiveTick((value) => value + 1)
    }, LIVE_POLL_INTERVAL_MS)

    return () => clearInterval(interval)
  }, [])

  const livePipelineStatus = useMemo(
    () => LivePipelineStore.getStatus(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [liveTick]
  )
  const livePipelineResult = useMemo(
    () => LivePipelineStore.getLatestResult(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [liveTick]
  )

  const cameraReady = Boolean(
    livePipelineStatus.healthy &&
      !livePipelineStatus.stale &&
      livePipelineResult?.faceEmbedding?.length
  )

  const enrollmentStatus = useMemo(
    () => FaceEnrollmentStore.getStatus(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [enrollmentTick, liveTick]
  )

  const getPersonStatus = (personId) => ({
    isEnrolled: FaceEnrollmentStore.isEnrolled(personId),
    sampleCount: FaceEnrollmentStore.getSamples(personId).length,
  })

  const enrollPerson = async (personId) => {
    if (!personId || capturingPersonId) {
      return { status: 'rejected', reason: 'busy_or_invalid' }
    }

    setCapturingPersonId(personId)
    setCaptureProgress(0)
    setLastResult(null)
    // v0.16.4: signals VisionFaceOverlay (Vision tab, always-mounted
    // camera) to draw the landmark-point overlay on the primary face
    // for the duration of this capture, so there's a visible cue that
    // a face is actually being scanned right now.
    FaceCaptureUiStore.startCapture(personId)

    const results = []

    try {
      for (let sampleIndex = 0; sampleIndex < SAMPLE_COUNT; sampleIndex += 1) {
        await sleep(SAMPLE_INTERVAL_MS)

        const latest = LivePipelineStore.getLatestResult()
        const embedding = latest?.faceEmbedding

        if (embedding && embedding.length) {
          results.push(FaceRecognitionService.enroll(personId, embedding))
        } else {
          results.push({ status: 'skipped_no_embedding' })
        }

        setCaptureProgress(sampleIndex + 1)
      }
    } finally {
      FaceCaptureUiStore.stopCapture()
    }

    const samplesCaptured = results.filter((result) => result.status === 'success').length

    const summary = {
      status: samplesCaptured > 0 ? 'success' : 'failed',
      personId,
      samplesCaptured,
      samplesAttempted: SAMPLE_COUNT,
      reason: samplesCaptured > 0 ? null : 'no_face_embedding_available',
    }

    setLastResult(summary)
    setCapturingPersonId(null)
    setCaptureProgress(0)
    setEnrollmentTick((value) => value + 1)

    return summary
  }

  const clearPerson = (personId) => {
    const removed = FaceEnrollmentStore.clearPerson(personId)
    setEnrollmentTick((value) => value + 1)
    return removed
  }

  return {
    cameraReady,
    enrollmentStatus,
    getPersonStatus,
    enrollPerson,
    clearPerson,
    capturingPersonId,
    captureProgress,
    sampleCount: SAMPLE_COUNT,
    lastResult,
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
