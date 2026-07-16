/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Component:
 * VisionFaceOverlay
 *
 * Purpose:
 * v0.16.4 Multi-Person Simultaneous Recognition & Live Video
 * Overlay. Draws a bounding box + identified name (or "Unknown")
 * over every face currently visible in the live camera feed, and
 * — while a face-enrollment capture is running (see
 * FaceCaptureUiStore) — overlays the raw landmark points for the
 * primary face being captured, as visual confirmation a face is
 * actually being scanned.
 *
 * Positioned as an absolute SVG sibling of the <video> element.
 * Uses viewBox="0 0 videoWidth videoHeight" with
 * preserveAspectRatio="xMidYMid slice" so the SVG coordinate
 * space maps 1:1 onto face-api's box/landmark coordinates (which
 * are in native video-pixel space) while visually cropping/
 * scaling exactly the way the video's own `object-cover` CSS
 * does — no manual scale/offset math needed.
 *
 * Version:
 * v0.16.4
 *
 * Date Code:
 * 160726
 * ==========================================================
 */

import { useEffect, useState } from 'react'
import FaceCaptureUiStore from '@/services/vision/FaceCaptureUiStore'

const CAPTURE_POLL_MS = 300

export default function VisionFaceOverlay({ videoRef, facesRoster = [] }) {
  const [capturing, setCapturing] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      setCapturing(FaceCaptureUiStore.isCapturing())
    }, CAPTURE_POLL_MS)

    return () => clearInterval(interval)
  }, [])

  const video = videoRef?.current
  const videoWidth = video?.videoWidth || 0
  const videoHeight = video?.videoHeight || 0

  if (!videoWidth || !videoHeight || !Array.isArray(facesRoster) || facesRoster.length === 0) {
    return null
  }

  const strokeWidth = Math.max(2, videoWidth * 0.004)
  const fontSize = Math.max(14, videoWidth * 0.02)
  const dotRadius = Math.max(1.5, videoWidth * 0.0025)

  return (
    <svg
      className="absolute inset-0 h-full w-full"
      viewBox={`0 0 ${videoWidth} ${videoHeight}`}
      preserveAspectRatio="xMidYMid slice"
      style={{ pointerEvents: 'none' }}
    >
      {facesRoster.map((face, index) => {
        if (!face.box) {
          return null
        }

        const { x, y, width, height } = face.box
        const color = face.matched ? '#34d399' : '#f59e0b'
        const label = face.matched
          ? `${face.displayName} · ${Math.round((face.confidence || 0) * 100)}%`
          : 'Unknown'
        const isPrimaryFace = index === 0

        return (
          <g key={`${face.profileId || 'unknown'}-${index}`}>
            <rect
              x={x}
              y={y}
              width={width}
              height={height}
              fill="none"
              stroke={color}
              strokeWidth={strokeWidth}
              rx={Math.max(4, videoWidth * 0.006)}
            />
            <text
              x={x}
              y={Math.max(fontSize, y - fontSize * 0.4)}
              fill={color}
              fontSize={fontSize}
              fontWeight={600}
              stroke="#000000"
              strokeWidth={fontSize * 0.12}
              paintOrder="stroke"
            >
              {label}
            </text>

            {capturing && isPrimaryFace &&
              (face.landmarks || []).map((point, pointIndex) => (
                <circle
                  key={pointIndex}
                  cx={point.x}
                  cy={point.y}
                  r={dotRadius}
                  fill="#22d3ee"
                />
              ))}
          </g>
        )
      })}
    </svg>
  )
}
