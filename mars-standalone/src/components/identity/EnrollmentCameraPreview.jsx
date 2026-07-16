/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Component:
 * EnrollmentCameraPreview
 *
 * Purpose:
 * v0.16.6. A floating pop-up video preview shown on the Identity
 * tab while a face-enrollment capture is running. Before this,
 * the only live camera feed was on the Vision tab — while
 * enrolling from the Identity tab there was no way to actually see
 * yourself, so there was no way to tell if you were framed
 * correctly for whatever pose step was being asked for.
 *
 * Reuses the exact same live MediaStream the Vision tab's <video>
 * is already showing (via CameraStreamStore — a stream can feed
 * more than one <video> element at once) and the same
 * VisionFaceOverlay component for the box/name/landmark overlay,
 * so this preview is a genuine live view, not a mock.
 *
 * Version:
 * v0.16.6
 *
 * Date Code:
 * 160726
 * ==========================================================
 */

import { useEffect, useRef, useState } from 'react'
import { ScanFace } from 'lucide-react'
import CameraStreamStore from '@/services/vision/CameraStreamStore'
import LivePipelineStore from '@/services/livePipeline/LivePipelineStore'
import VisionFaceOverlay from '@/components/mars/VisionFaceOverlay'

const ROSTER_POLL_MS = 250

export default function EnrollmentCameraPreview({ instructionLabel, stepStatus }) {
  const videoRef = useRef(null)
  const [hasStream, setHasStream] = useState(Boolean(CameraStreamStore.getStream()))
  const [facesRoster, setFacesRoster] = useState([])

  useEffect(() => {
    const attach = (stream) => {
      if (!videoRef.current) return

      videoRef.current.srcObject = stream || null
      setHasStream(Boolean(stream))

      if (stream) {
        videoRef.current.play().catch(() => {
          // Autoplay can be briefly blocked right after the element
          // mounts — the next stream update or frame tick recovers it.
        })
      }
    }

    attach(CameraStreamStore.getStream())

    const unsubscribe = CameraStreamStore.subscribe(attach)
    return unsubscribe
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      const latest = LivePipelineStore.getLatestResult()
      setFacesRoster(latest?.facesRoster || [])
    }, ROSTER_POLL_MS)

    return () => clearInterval(interval)
  }, [])

  const statusStyle =
    stepStatus === 'captured'
      ? 'bg-emerald-500/20 text-emerald-200 border-emerald-500/30'
      : stepStatus === 'timeout'
        ? 'bg-amber-500/20 text-amber-200 border-amber-500/30'
        : 'bg-cyan-500/10 text-cyan-200 border-cyan-500/20'

  return (
    <div className="fixed bottom-4 right-4 z-50 w-64 overflow-hidden rounded-2xl border border-cyan-500/30 bg-black shadow-2xl shadow-black/60">
      <div className="relative aspect-[4/3] bg-black">
        <video ref={videoRef} className="h-full w-full object-cover" playsInline muted />

        <VisionFaceOverlay videoRef={videoRef} facesRoster={facesRoster} />

        {!hasStream && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-3 text-center text-xs text-white/40">
            <ScanFace size={20} className="text-white/20" />
            Camera isn't live. Start it on the Vision tab first.
          </div>
        )}
      </div>

      <div className={`border-t px-3 py-2 text-xs font-semibold ${statusStyle}`}>
        {stepStatus === 'captured'
          ? 'Captured!'
          : stepStatus === 'timeout'
            ? "Couldn't get a clear frame — moving on"
            : instructionLabel || 'Hold still...'}
      </div>
    </div>
  )
}
