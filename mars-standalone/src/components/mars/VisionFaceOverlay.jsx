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
 * v0.16.12: Identity Lock visual indicator. Christian: "i want to see
 * a visual id in this when its locked on" — the "Tracking held" badge
 * on the Identity tab (v0.16.11) wasn't visible from the camera view
 * itself. A locked face's box recolours to a distinct locked colour
 * and gets a padlock glyph + "LOCKED" appended to its label.
 * `identityHeld` (true only on frames with no live face evidence,
 * carried by the lock) covers the case this component previously had
 * no way to show anything for at all: when the face genuinely isn't
 * detected, `facesRoster` is empty and there's no box to draw a badge
 * on, so a floating banner is rendered instead, naming who is being
 * tracked through the gap.
 *
 * v0.16.13: Multi-Person Simultaneous Locking. Christian live-tested
 * two enrolled people (himself + Ann) in frame together and found the
 * lock indicator only ever followed ONE of them (whoever the single
 * primary trust pipeline currently favoured) — because this component
 * took a single scalar `identityLocked` flag. Replaced with
 * `identityRoster`, an array of every currently detected/tracked
 * person's own lock status (see VisionPipeline's header), matched
 * against each `facesRoster` entry by `profileId`. Every
 * simultaneously-visible recognised+locked person now gets their own
 * independent LOCKED badge on their own box, not just whoever is
 * primary. The no-face "Tracking held" banner is unchanged and still
 * describes only the single primary person — see VisionPipeline's
 * header for why simultaneous held-through-occlusion for 2+ people
 * isn't solved by this milestone (the underlying person-presence
 * signal is itself single-person).
 *
 * Version:
 * v0.16.13
 *
 * Date Code:
 * 170726
 * ==========================================================
 */

import { useEffect, useState } from 'react'
import FaceCaptureUiStore from '@/services/vision/FaceCaptureUiStore'

const CAPTURE_POLL_MS = 300
const LOCKED_COLOR = '#22d3ee'

// Simple padlock glyph, drawn in a local 0..24 box and positioned via
// a <g transform>. Kept as a raw path rather than an icon import so
// this component has no new dependencies.
const LOCK_ICON_PATH =
  'M6 10V7a6 6 0 1 1 12 0v3h1a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V11a1 1 0 0 1 1-1h1zm2 0h8V7a4 4 0 0 0-8 0v3z'

export default function VisionFaceOverlay({
  videoRef,
  facesRoster = [],
  identityRoster = [],
  identityHeld = false,
  lockedDisplayName = null,
}) {
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
  const hasFaces = Array.isArray(facesRoster) && facesRoster.length > 0

  if (!videoWidth || !videoHeight || (!hasFaces && !identityHeld)) {
    return null
  }

  const strokeWidth = Math.max(2, videoWidth * 0.004)
  const fontSize = Math.max(14, videoWidth * 0.02)
  const dotRadius = Math.max(1.5, videoWidth * 0.0025)
  const iconSize = fontSize * 1.1

  return (
    <svg
      className="absolute inset-0 h-full w-full"
      viewBox={`0 0 ${videoWidth} ${videoHeight}`}
      preserveAspectRatio="xMidYMid slice"
      style={{ pointerEvents: 'none' }}
    >
      {hasFaces && facesRoster.map((face, index) => {
        if (!face.box) {
          return null
        }

        const { x, y, width, height } = face.box
        const isPrimaryFace = index === 0
        // v0.16.13: looked up per-face by profileId (not tied to
        // index/position) so every simultaneously-visible locked
        // person gets their own badge, independent of who's primary.
        const rosterEntry = Array.isArray(identityRoster)
          ? identityRoster.find((entry) => entry.profileId && entry.profileId === face.profileId)
          : null
        const showLocked = Boolean(rosterEntry?.identityLocked)
        const color = showLocked ? LOCKED_COLOR : face.matched ? '#34d399' : '#f59e0b'
        const baseLabel = face.matched
          ? `${face.displayName} · ${Math.round((face.confidence || 0) * 100)}%`
          : 'Unknown'
        const label = showLocked ? `${baseLabel} · LOCKED` : baseLabel
        const labelY = Math.max(fontSize, y - fontSize * 0.4)

        return (
          <g key={`${face.profileId || 'unknown'}-${index}`}>
            <rect
              x={x}
              y={y}
              width={width}
              height={height}
              fill="none"
              stroke={color}
              strokeWidth={showLocked ? strokeWidth * 1.4 : strokeWidth}
              rx={Math.max(4, videoWidth * 0.006)}
            />
            {showLocked && (
              <g transform={`translate(${x}, ${labelY - iconSize * 0.85}) scale(${iconSize / 24})`}>
                <path d={LOCK_ICON_PATH} fill={color} stroke="#000000" strokeWidth={1} />
              </g>
            )}
            <text
              x={showLocked ? x + iconSize * 1.15 : x}
              y={labelY}
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

      {!hasFaces && identityHeld && (
        <g>
          <rect
            x={videoWidth * 0.03}
            y={videoHeight * 0.04}
            width={Math.min(videoWidth * 0.6, (lockedDisplayName?.length || 12) * fontSize * 0.62 + iconSize * 2.2)}
            height={fontSize * 2.1}
            rx={fontSize * 0.4}
            fill="rgba(0,0,0,0.55)"
            stroke={LOCKED_COLOR}
            strokeWidth={strokeWidth * 0.8}
          />
          <g
            transform={`translate(${videoWidth * 0.03 + fontSize * 0.5}, ${videoHeight * 0.04 + fontSize * 0.5}) scale(${iconSize / 24})`}
          >
            <path d={LOCK_ICON_PATH} fill={LOCKED_COLOR} />
          </g>
          <text
            x={videoWidth * 0.03 + iconSize * 1.9}
            y={videoHeight * 0.04 + fontSize * 1.4}
            fill={LOCKED_COLOR}
            fontSize={fontSize}
            fontWeight={600}
          >
            {`Tracking held${lockedDisplayName ? ` — ${lockedDisplayName}` : ''}`}
          </text>
        </g>
      )}
    </svg>
  )
}
