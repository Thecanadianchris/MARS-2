/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Service:
 * IdentityEngine
 *
 * Purpose:
 * Provides the v0.13.0 Identity Foundation service.
 *
 * This engine introduces identity awareness without adding
 * persistent learning, cloud recognition or medical conclusions.
 * It prepares MARS to distinguish known and unknown people while
 * preserving architecture-first module boundaries.
 *
 * Version:
 * v0.13.0
 *
 * Date Code:
 * 010726
 * ==========================================================
 */

import PersonRegistry from './PersonRegistry'
import IdentityObservationBuilder from './IdentityObservationBuilder'
import IdentityDiagnosticsService from './IdentityDiagnosticsService'
import FaceQualityEngine from './FaceQualityEngine'
import IdentityTrackingService from './IdentityTrackingService'
import IdentityTimelineService from './IdentityTimelineService'

class IdentityEngine {
  constructor(options = {}) {
    this.registry = options.registry || new PersonRegistry(options.persons || [])
    this.observationBuilder =
      options.observationBuilder || new IdentityObservationBuilder()
    this.diagnosticsService =
      options.diagnosticsService || new IdentityDiagnosticsService()
    this.faceQualityEngine =
      options.faceQualityEngine || new FaceQualityEngine()
    this.trackingService =
      options.trackingService || new IdentityTrackingService()
    this.timelineService =
      options.timelineService || new IdentityTimelineService()
  }

  evaluate(input = {}) {
    const safeInput = input && typeof input === 'object' ? input : {}
    const faceFoundation = safeInput.faceFoundation || null
    const identityCandidate = safeInput.identityCandidate || null
    const detectedPeople = Array.isArray(safeInput.detectedPeople)
      ? safeInput.detectedPeople
      : []

    if (!this.hasIdentitySignal(faceFoundation, identityCandidate, detectedPeople)) {
      return this.buildUnavailableResult(
        'No identity signal available. Face recognition is not yet active.'
      )
    }

    const candidate = this.selectCandidate({
      faceFoundation,
      identityCandidate,
      detectedPeople,
    })

    const faceQuality = this.faceQualityEngine.evaluate({
      faceFoundation,
      candidate,
    })
    const match = this.registry.matchIdentity(candidate)
    const tracking = this.trackingService.evaluate({
      detectedPeople,
      faceFoundation,
      faceQuality,
    })
    const registryState = this.registry.getRegistryState()

    const identityResult = {
      status: match.status,
      person: match.person,
      confidence: match.confidence,
      reason: match.reason,
      faceQuality,
      tracking,
      registry: {
        personCount: registryState.personCount,
      },
      source: candidate.source || 'identity_candidate',
      timestamp: Date.now(),
    }

    const timeline = this.timelineService.record(identityResult)
    const observations = this.observationBuilder.build(identityResult)
    const diagnostics = this.diagnosticsService.buildDiagnostics(
      { ...identityResult, timeline },
      registryState
    )

    return {
      ...identityResult,
      timeline,
      observations,
      diagnostics,
      summary: this.buildSummary(identityResult),
    }
  }

  registerPerson(person) {
    return this.registry.registerPerson(person)
  }

  getRegistryState() {
    return this.registry.getRegistryState()
  }

  hasIdentitySignal(faceFoundation, identityCandidate, detectedPeople) {
    if (identityCandidate) {
      return true
    }

    if (detectedPeople.length > 0) {
      return true
    }

    return Boolean(faceFoundation?.faceDetected)
  }

  selectCandidate({ faceFoundation, identityCandidate, detectedPeople }) {
    if (identityCandidate) {
      return {
        ...identityCandidate,
        source: identityCandidate.source || 'identity_candidate',
      }
    }

    if (detectedPeople.length > 0) {
      const highestConfidencePerson = [...detectedPeople].sort(
        (a, b) => (b.confidence || 0) - (a.confidence || 0)
      )[0]

      return {
        ...highestConfidencePerson,
        source: highestConfidencePerson.source || 'detected_people',
      }
    }

    return {
      confidence: faceFoundation?.confidence || 0,
      source: 'face_foundation',
    }
  }

  buildUnavailableResult(reason) {
    const identityResult = {
      status: 'not_available',
      person: null,
      confidence: 0,
      reason,
      faceQuality: this.faceQualityEngine.evaluate({}),
      tracking: this.trackingService.evaluate({}),
      registry: {
        personCount: this.registry.getRegistryState().personCount,
      },
      source: 'none',
      timestamp: Date.now(),
    }

    const registryState = this.registry.getRegistryState()
    const timeline = this.timelineService.record(identityResult)

    return {
      ...identityResult,
      timeline,
      observations: this.observationBuilder.build(identityResult),
      diagnostics: this.diagnosticsService.buildDiagnostics(
        { ...identityResult, timeline },
        registryState
      ),
      summary: 'Identity Foundation unavailable: no face or identity signal present.',
    }
  }

  buildSummary(identityResult) {
    if (identityResult.status === 'known') {
      return `Identity recognised: ${identityResult.person.name} (${identityResult.confidence}% confidence, face quality ${identityResult.faceQuality?.label || 'unknown'}).`
    }

    if (identityResult.status === 'unknown') {
      return `Identity unknown (${identityResult.confidence}% confidence, face quality ${identityResult.faceQuality?.label || 'unknown'}).`
    }

    return 'Identity not available.'
  }
}

export default new IdentityEngine()
export { IdentityEngine }
