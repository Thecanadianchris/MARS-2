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
 * v0.16.5: replaced the blind "grab 4 frames 600ms apart" loop with
 * a short guided pose sequence (frontal, left turn, right turn, chin
 * down, step back). A live test (16 July 2026, Christian) showed the
 * old flow captured only near-identical frontal frames — no real
 * pose/distance diversity for matchBest() (FaceRecognitionService.js)
 * to actually use, even though it already does nearest-neighbor
 * matching across every stored sample per person. Each step exposes
 * its instruction text via currentStepLabel so the UI can prompt the
 * person through it instead of a silent countdown.
 *
 * v0.16.6: two more issues from that same live test. First, there
 * was no way to see yourself while enrolling from the Identity tab —
 * fixed by EnrollmentCameraPreview.jsx (a pop-up feed, not owned by
 * this hook). Second, each step advanced on a blind timer regardless
 * of whether a usable frame actually landed — "frames go quickly...
 * it should only go to the next frame when it has identified it has
 * taken the picture correctly." Replaced the fixed holdMs sleep with
 * waitForUsableFrame(): actively polls LivePipelineStore for the next
 * *new* processed frame (by performance.processedFrameCount, so a
 * stale pre-instruction frame is never reused) that actually carries
 * a face embedding, up to a timeout, before enrolling it. stepStatus
 * ('waiting' | 'captured' | 'timeout') lets the UI confirm each
 * capture before moving on instead of silently marching ahead.
 *
 * v0.16.7: still "way too quick" even with stepStatus confirmation —
 * a fixed 800ms settle pause isn't remotely enough time for a person
 * to actually read an instruction and move into a new pose (turning
 * the head, tilting the chin, stepping back). Christian asked for
 * the app to speak each instruction out loud instead. Now each step
 * is narrated via SpeechOutputService before we start checking for a
 * usable frame — real speech duration paces the wait naturally (a
 * short instruction takes less time to say than a long one, same as
 * it would coming from a person), which is a far more honest pause
 * than any fixed constant, plus it answers "what is required" for
 * each pose out loud, not just as on-screen text.
 *
 * v0.16.9: Christian hit the next problem live — the Enroll button
 * was simply disabled if the camera hadn't been started on the
 * Vision tab yet, with no way to turn it on from here. "It needs to
 * activate if not active, from there." `enrollPerson()` now calls
 * `ensureCameraActive()` first, which requests a start via
 * `CameraStreamStore` (see that file for how VisionPanel registers
 * itself) and waits for the live pipeline to actually come up before
 * starting the pose sequence. The Enroll button itself is no longer
 * disabled just because the camera isn't active yet (see
 * FaceEnrollmentPanel.jsx) — clicking it is what turns the camera on.
 *
 * v0.16.10: the spoken wrap-up line ("Got it, thanks!") now includes
 * the enrolled person's own display name, read from PersonRegistry —
 * "Got it, thanks, Christian!" — so the confirmation is addressed to
 * whoever was actually just enrolled, not a generic phrase.
 *
 * Version:
 * v0.16.10
 *
 * Date Code:
 * 160726
 * ==========================================================
 */

import { useEffect, useMemo, useState } from 'react'
import LivePipelineStore from '@/services/livePipeline/LivePipelineStore'
import FaceRecognitionService from '@/services/identity/FaceRecognitionService'
import FaceEnrollmentStore from '@/services/identity/FaceEnrollmentStore'
import FaceCaptureUiStore from '@/services/vision/FaceCaptureUiStore'
import SpeechOutputService from '@/services/voice/SpeechOutputService'
import CameraStreamStore from '@/services/vision/CameraStreamStore'
import PersonRegistry from '@/services/identity/PersonRegistry'

const LIVE_POLL_INTERVAL_MS = 500

// v0.16.9: how long to wait for the camera to actually come up after
// requesting a start, and how often to poll while waiting.
const CAMERA_START_TIMEOUT_MS = 8000
const CAMERA_START_POLL_MS = 300

// v0.16.7: brief pause after speech actually finishes (real people
// need a beat to settle into the pose even after hearing it), how
// often to poll while waiting for a usable frame, and how long to
// wait before giving up on a step.
const POST_SPEECH_SETTLE_MS = 500
const STEP_POLL_MS = 200
const STEP_TIMEOUT_MS = 6000
const STEP_CONFIRM_PAUSE_MS = 550

const INTRO_SPEECH = "Let's get a quick scan of your face. Hold each pose when I ask."

// v0.16.5 guided capture sequence.
const POSE_STEPS = [
  { id: 'frontal', label: 'Look straight at the camera' },
  { id: 'turn_left', label: 'Slowly turn your head slightly to the left' },
  { id: 'turn_right', label: 'Now slowly turn slightly to the right' },
  { id: 'chin_down', label: 'Tilt your chin down a little' },
  { id: 'step_back', label: 'Step back a little and hold still' },
]

const SAMPLE_COUNT = POSE_STEPS.length

export default function useFaceEnrollment() {
  const [liveTick, setLiveTick] = useState(0)
  const [enrollmentTick, setEnrollmentTick] = useState(0)
  const [capturingPersonId, setCapturingPersonId] = useState(null)
  const [captureProgress, setCaptureProgress] = useState(0)
  const [currentStepLabel, setCurrentStepLabel] = useState('')
  const [stepStatus, setStepStatus] = useState('waiting')
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
    setCurrentStepLabel('')
    setStepStatus('waiting')
    setLastResult(null)

    const cameraStart = await ensureCameraActive()

    if (cameraStart.status !== 'already-active' && cameraStart.status !== 'started') {
      const failureSummary = {
        status: 'failed',
        personId,
        samplesCaptured: 0,
        samplesAttempted: SAMPLE_COUNT,
        reason: 'camera_unavailable',
      }

      setLastResult(failureSummary)
      setCapturingPersonId(null)
      setCaptureProgress(0)
      setStepStatus('waiting')

      return failureSummary
    }

    // v0.16.4: signals VisionFaceOverlay (Vision tab, always-mounted
    // camera) to draw the landmark-point overlay on the primary face
    // for the duration of this capture, so there's a visible cue that
    // a face is actually being scanned right now.
    FaceCaptureUiStore.startCapture(personId)

    const results = []
    let lastSeenFrameCount = LivePipelineStore.getLatestResult()?.performance?.processedFrameCount ?? 0

    try {
      await SpeechOutputService.speak(INTRO_SPEECH)

      for (let stepIndex = 0; stepIndex < POSE_STEPS.length; stepIndex += 1) {
        const step = POSE_STEPS[stepIndex]
        setCurrentStepLabel(step.label)
        setStepStatus('waiting')

        // Say the instruction out loud and actually wait for it to
        // finish — this is the real pacing now, not a guessed
        // constant. A short instruction takes less time to say (and
        // hear) than a long one, same as it would from a person.
        await SpeechOutputService.speak(step.label)

        // Still give a short beat after speech ends to actually move
        // into the pose before we start checking frames for it.
        await sleep(POST_SPEECH_SETTLE_MS)

        const { result, frameCount } = await waitForUsableFrame(
          personId,
          lastSeenFrameCount
        )

        lastSeenFrameCount = frameCount
        results.push(result)
        setStepStatus(result.status === 'success' ? 'captured' : 'timeout')

        // Hold the confirmation on screen briefly so the person can
        // see the step actually landed before the next one starts —
        // this is the "only go to the next frame once it's confirmed"
        // behaviour Christian asked for.
        await sleep(STEP_CONFIRM_PAUSE_MS)

        setCaptureProgress(stepIndex + 1)
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

    const personDisplayName = PersonRegistry.getProfile(personId)?.displayName || null

    SpeechOutputService.speak(
      samplesCaptured > 0
        ? personDisplayName
          ? `Got it, thanks, ${personDisplayName}!`
          : 'Got it, thanks!'
        : "I couldn't get a clear picture. Let's try that again."
    )

    setLastResult(summary)
    setCapturingPersonId(null)
    setCaptureProgress(0)
    setCurrentStepLabel('')
    setStepStatus('waiting')
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
    currentStepLabel,
    stepStatus,
    sampleCount: SAMPLE_COUNT,
    lastResult,
  }
}

/**
 * v0.16.9. Makes sure the live pipeline is actually up before an
 * enrollment capture starts, requesting a camera start through
 * CameraStreamStore if it isn't already active and waiting (up to
 * CAMERA_START_TIMEOUT_MS) for LivePipelineStore to report healthy.
 * Resolves 'already-active' or 'started' on success; 'no-handler'
 * (VisionPanel was never mounted to register itself — shouldn't
 * happen in the real app, but never throws either way), 'start-failed'
 * or 'start-timeout' otherwise.
 */
async function ensureCameraActive() {
  const status = LivePipelineStore.getStatus()

  if (status.healthy && !status.stale) {
    return { status: 'already-active' }
  }

  const startResult = await CameraStreamStore.requestStart()

  if (startResult.status === 'no-handler' || startResult.status === 'start-failed') {
    return startResult
  }

  const startedAt = Date.now()

  while (Date.now() - startedAt < CAMERA_START_TIMEOUT_MS) {
    const latestStatus = LivePipelineStore.getStatus()

    if (latestStatus.healthy && !latestStatus.stale) {
      return { status: 'started' }
    }

    await sleep(CAMERA_START_POLL_MS)
  }

  return { status: 'start-timeout' }
}

/**
 * v0.16.6. Actively polls LivePipelineStore rather than blindly
 * sleeping a fixed duration — waits for the next frame the live
 * pipeline hasn't produced yet (by performance.processedFrameCount,
 * so a stale frame from before this step started is never mistaken
 * for a fresh one) that actually carries a face embedding, then
 * enrolls it immediately. Gives up after timeoutMs and reports
 * 'skipped_no_embedding' so the step sequence still moves on rather
 * than hanging forever if the person stepped out of frame.
 */
async function waitForUsableFrame(personId, sinceFrameCount, timeoutMs = STEP_TIMEOUT_MS) {
  const startedAt = Date.now()

  while (Date.now() - startedAt < timeoutMs) {
    const latest = LivePipelineStore.getLatestResult()
    const frameCount = latest?.performance?.processedFrameCount ?? sinceFrameCount
    const embedding = latest?.faceEmbedding

    if (frameCount > sinceFrameCount && embedding && embedding.length) {
      return {
        result: FaceRecognitionService.enroll(personId, embedding),
        frameCount,
      }
    }

    await sleep(STEP_POLL_MS)
  }

  return {
    result: { status: 'skipped_no_embedding' },
    frameCount: sinceFrameCount,
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
