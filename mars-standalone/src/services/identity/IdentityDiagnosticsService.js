/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Service:
 * IdentityDiagnosticsService
 *
 * Purpose:
 * Produces lightweight diagnostics for the v0.13.0 Identity
 * Foundation layer.
 *
 * Version:
 * v0.13.0
 *
 * Date Code:
 * 010726
 * ==========================================================
 */

class IdentityDiagnosticsService {
  buildDiagnostics(identityResult = {}, registryState = {}) {
    const confidence = this.normaliseConfidence(identityResult.confidence)
    const status = identityResult.status || 'not_available'
    const faceQuality = identityResult.faceQuality || {}
    const tracking = identityResult.tracking || {}
    const timeline = identityResult.timeline || {}

    return {
      status: 'success',
      subsystem: 'Identity Foundation',
      version: 'v0.13.0',
      identityStatus: status,
      confidence,
      recognisedPersonId: identityResult.person?.id || null,
      recognisedPersonName: identityResult.person?.name || null,
      registeredPersonCount: registryState.personCount || 0,
      faceQuality: {
        status: faceQuality.status || 'not_available',
        label: faceQuality.label || 'unavailable',
        score: this.normaliseConfidence(faceQuality.score),
        usableForRecognition: Boolean(faceQuality.usableForRecognition),
      },
      tracking: {
        enabled: tracking.enabled !== false,
        personCount: tracking.personCount || 0,
        multiPerson: Boolean(tracking.multiPerson),
        activeTrackCount: tracking.activeTrackCount || 0,
        primaryTrackId: tracking.primaryTrackId || null,
      },
      timeline: {
        enabled: true,
        persistent: false,
        eventCount: timeline.eventCount || 0,
        latestEventId: timeline.latestEvent?.id || null,
      },
      persistentProfilesEnabled: false,
      biometricStorageEnabled: false,
      alertingEnabled: false,
      notes: [
        'Identity Foundation is active.',
        'Face quality, tracking and timeline are diagnostic-only in v0.13.0.',
        'Persistent identity learning is deferred to v0.13.1.',
        'Notification alert delivery is a future capability and is not implemented in v0.13.0.',
      ],
      timestamp: Date.now(),
    }
  }

  normaliseConfidence(value) {
    const confidence = Number.isFinite(value) ? value : 0
    return Math.max(0, Math.min(100, Math.round(confidence)))
  }
}

export default IdentityDiagnosticsService
