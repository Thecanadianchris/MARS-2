/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Component:
 * FaceEnrollmentPanel
 *
 * Purpose:
 * v0.16.1 Face Registration & Known Person Database. Lets a real
 * person enroll their face against a local profile from the ID
 * tab, reading live camera embeddings via useFaceEnrollment —
 * replaces the browser-console-only enrollment path used to
 * bootstrap v0.16 testing.
 *
 * v0.16.5: shows the current guided-pose instruction
 * (currentStepLabel from useFaceEnrollment) instead of a bare
 * "Capturing X/Y..." counter, so the person being enrolled knows
 * what to actually do at each step of the capture.
 *
 * v0.16.6: renders EnrollmentCameraPreview (a pop-up live feed) while
 * a capture is running — until now there was no way to see yourself
 * while enrolling from this tab. Also reflects stepStatus
 * ('waiting'/'captured'/'timeout') from useFaceEnrollment so each
 * step visibly confirms before the sequence advances.
 *
 * v0.16.9: the Enroll/Re-enroll button no longer disables itself
 * just because the camera hasn't been started yet — clicking it now
 * asks useFaceEnrollment to start the camera itself (via
 * CameraStreamStore) before capturing. Christian hit this live after
 * deleting his profile: the button showed a disabled "not usable"
 * cursor with no way to activate the camera short of visiting the
 * Vision tab first. The camera-status banner is now informational
 * only, not a blocker.
 *
 * Version:
 * v0.16.9
 *
 * Date Code:
 * 160726
 * ==========================================================
 */

import { CircleCheck, ScanFace, Trash2 } from 'lucide-react'
import useFaceEnrollment from '@/hooks/useFaceEnrollment'
import EnrollmentCameraPreview from './EnrollmentCameraPreview'

export default function FaceEnrollmentPanel({ profiles = [] }) {
  const {
    cameraReady,
    getPersonStatus,
    enrollPerson,
    clearPerson,
    capturingPersonId,
    captureProgress,
    currentStepLabel,
    stepStatus,
    sampleCount,
    lastResult,
  } = useFaceEnrollment()

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950/70 p-4 text-sm text-slate-200">
      <div className="mb-3 flex items-center gap-2">
        <ScanFace size={16} className="text-cyan-300" />
        <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-300">
          Face Enrollment
        </h2>
      </div>

      <p className="mb-3 text-xs leading-relaxed text-slate-400">
        Enroll a face against a local profile so live recognition can identify them.
        Look at the camera on the Vision tab while enrolling — it stays running in the
        background once started. Stored on this device only.
      </p>

      {!cameraReady && (
        <div className="mb-3 rounded-xl border border-cyan-500/20 bg-cyan-500/10 p-3 text-xs text-cyan-200">
          Camera isn't active yet — clicking Enroll will start it automatically.
        </div>
      )}

      <div className="space-y-3">
        {profiles.map((profile) => {
          const personStatus = getPersonStatus(profile.id)
          const isCapturingThisPerson = capturingPersonId === profile.id
          const isCapturingSomeone = Boolean(capturingPersonId)

          return (
            <div
              key={profile.id}
              className="rounded-xl border border-white/10 bg-white/[0.03] p-3"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 font-semibold text-white">
                    {profile.displayName}
                    {personStatus.isEnrolled && (
                      <CircleCheck size={13} className="text-emerald-400" />
                    )}
                  </div>
                  <div className="mt-0.5 text-xs text-slate-500">
                    {personStatus.isEnrolled
                      ? `${personStatus.sampleCount} sample${personStatus.sampleCount === 1 ? '' : 's'} enrolled`
                      : 'Not enrolled yet'}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {personStatus.isEnrolled && !isCapturingSomeone && (
                    <button
                      onClick={() => clearPerson(profile.id)}
                      className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-slate-400 hover:border-red-500/30 hover:text-red-300"
                      aria-label={`Clear enrollment for ${profile.displayName}`}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}

                  <button
                    onClick={() => enrollPerson(profile.id)}
                    disabled={isCapturingSomeone}
                    className={`rounded-xl border px-3 py-2 text-xs font-semibold uppercase tracking-wider transition disabled:cursor-not-allowed disabled:opacity-40 ${
                      isCapturingThisPerson
                        ? 'border-cyan-500/30 bg-cyan-500/20 text-cyan-200'
                        : 'border-cyan-500/20 bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20'
                    }`}
                  >
                    {isCapturingThisPerson
                      ? stepStatus === 'captured'
                        ? `Captured (${captureProgress}/${sampleCount})`
                        : capturingPersonId && captureProgress === 0 && currentStepLabel === ''
                          ? 'Starting camera...'
                          : `Step ${captureProgress + 1}/${sampleCount}...`
                      : personStatus.isEnrolled
                        ? 'Re-enroll'
                        : 'Enroll'}
                  </button>
                </div>
              </div>

              {isCapturingThisPerson && currentStepLabel && (
                <div
                  className={`mt-3 rounded-xl border px-3 py-2 text-sm font-semibold ${
                    stepStatus === 'captured'
                      ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-200'
                      : stepStatus === 'timeout'
                        ? 'border-amber-500/20 bg-amber-500/10 text-amber-200'
                        : 'border-cyan-500/20 bg-cyan-500/10 text-cyan-200'
                  }`}
                >
                  {stepStatus === 'captured'
                    ? 'Captured!'
                    : stepStatus === 'timeout'
                      ? "Couldn't get a clear frame for that pose — moving on"
                      : currentStepLabel}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {capturingPersonId && (
        <EnrollmentCameraPreview instructionLabel={currentStepLabel} stepStatus={stepStatus} />
      )}

      {lastResult && (
        <div
          className={`mt-3 rounded-xl border p-3 text-xs ${
            lastResult.status === 'success'
              ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-200'
              : 'border-red-500/20 bg-red-500/10 text-red-200'
          }`}
        >
          {lastResult.status === 'success'
            ? `Enrolled ${lastResult.personId}: ${lastResult.samplesCaptured}/${lastResult.samplesAttempted} samples captured.`
            : lastResult.reason === 'camera_unavailable'
              ? `Couldn't start the camera for ${lastResult.personId}. Check camera permissions, or start it manually on the Vision tab and try again.`
              : `Enrollment failed for ${lastResult.personId}: no face embedding was available. Make sure a face is visible on the Vision tab.`}
        </div>
      )}
    </section>
  )
}
