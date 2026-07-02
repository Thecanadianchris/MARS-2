/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Test:
 * IdentityFoundationSmokeTest
 *
 * Purpose:
 * Vitest smoke test for the v0.13.0 Identity Foundation layer.
 *
 * Version:
 * v0.13.0
 *
 * Date Code:
 * 010726
 * ==========================================================
 */

import { describe, expect, it } from 'vitest'
import { IdentityEngine } from '../services/identity/IdentityEngine.js'
import FaceQualityEngine from '../services/identity/FaceQualityEngine.js'
import IdentityTrackingService from '../services/identity/IdentityTrackingService.js'
import IdentityTimelineService from '../services/identity/IdentityTimelineService.js'

describe('Identity Foundation Smoke Test', () => {
  it('handles missing identity input safely', () => {
    const identityEngine = new IdentityEngine()
    const result = identityEngine.evaluate(null)

    expect(result).toBeDefined()
    expect(result.status).toBe('not_available')
    expect(result.summary).toBeTypeOf('string')
    expect(result.observations).toBeInstanceOf(Array)
    expect(result.diagnostics).toBeDefined()
    expect(result.faceQuality).toBeDefined()
    expect(result.tracking).toBeDefined()
    expect(result.timeline).toBeDefined()
  })

  it('registers and recognises a known person by identity candidate', () => {
    const identityEngine = new IdentityEngine({
      persons: [
        {
          id: 'finley',
          name: 'Finley',
          relationship: 'family',
          alertPriority: 'high',
        },
      ],
    })

    const result = identityEngine.evaluate({
      identityCandidate: {
        personId: 'finley',
        confidence: 92,
        faceDetected: true,
        headOrientation: 'level',
      },
      faceFoundation: {
        faceDetected: true,
        faceCount: 1,
        confidence: 90,
        head: {
          orientation: 'level',
        },
      },
    })

    expect(result).toBeDefined()
    expect(result.status).toBe('known')
    expect(result.person.name).toBe('Finley')
    expect(result.confidence).toBe(92)
    expect(result.faceQuality.label).toBe('good')
    expect(result.tracking.primaryTrackId).toBeTypeOf('string')
    expect(result.timeline.eventCount).toBeGreaterThan(0)
    expect(result.observations.length).toBeGreaterThan(0)
    expect(result.diagnostics.identityStatus).toBe('known')
  })

  it('returns unknown when a face is present but no person is matched', () => {
    const identityEngine = new IdentityEngine()

    const result = identityEngine.evaluate({
      faceFoundation: {
        faceDetected: true,
        faceCount: 1,
        confidence: 67,
        head: {
          orientation: 'level',
        },
      },
    })

    expect(result).toBeDefined()
    expect(result.status).toBe('unknown')
    expect(result.confidence).toBe(67)
    expect(result.tracking.personCount).toBe(1)
    expect(result.faceQuality.usableForRecognition).toBe(true)
    expect(result.summary).toContain('Identity unknown')
  })

  it('scores face quality without performing recognition', () => {
    const faceQualityEngine = new FaceQualityEngine()
    const result = faceQualityEngine.evaluate({
      faceFoundation: {
        faceDetected: true,
        faceCount: 1,
        confidence: 88,
        head: {
          orientation: 'level',
        },
      },
    })

    expect(result.status).toBe('success')
    expect(result.label).toBe('good')
    expect(result.usableForRecognition).toBe(true)
    expect(result.score).toBeGreaterThanOrEqual(80)
  })

  it('creates non-persistent identity tracks', () => {
    const trackingService = new IdentityTrackingService()
    const result = trackingService.evaluate({
      detectedPeople: [
        {
          confidence: 81,
          source: 'smoke_test',
        },
      ],
      faceQuality: {
        label: 'good',
        usableForRecognition: true,
      },
    })

    expect(result.enabled).toBe(true)
    expect(result.personCount).toBe(1)
    expect(result.primaryTrackId).toMatch(/^TRACK-/)
    expect(result.tracks[0].usableForRecognition).toBe(true)
  })

  it('records a non-persistent identity timeline event', () => {
    const timelineService = new IdentityTimelineService()
    const result = timelineService.record({
      status: 'unknown',
      confidence: 55,
      source: 'smoke_test',
      faceQuality: {
        label: 'usable',
      },
      tracking: {
        primaryTrackId: 'TRACK-001',
      },
    })

    expect(result.status).toBe('active')
    expect(result.persistent).toBe(false)
    expect(result.eventCount).toBe(1)
    expect(result.latestEvent.trackingId).toBe('TRACK-001')
  })
})
