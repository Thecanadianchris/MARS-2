/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Service:
 * FaceEnrollmentStore
 *
 * Purpose:
 * Holds enrolled face descriptors for the Face Recognition
 * Foundation, keyed by personId (the same id space as
 * PersonRegistry). Supports multiple samples per person for a
 * little extra matching robustness.
 *
 * Privacy posture: on-device only. v0.16.1 adds persistence —
 * localStorage['mars_face_enrollment_v1'] on this machine only,
 * same pattern as MemoryIntelligenceService (storageAvailable()
 * guard + in-memory fallback so Vitest's Node environment still
 * works with no window/localStorage). Enrolled descriptors are
 * never sent anywhere and never leave this process; persisting
 * to localStorage doesn't change that — it's still purely local
 * to this browser/device.
 *
 * This store does not decide who is trusted or protected — it
 * only maps a personId to face descriptors. PersonRegistry
 * remains the single source of truth for trust/protection.
 *
 * v0.16.5: raised MAX_SAMPLES_PER_PERSON from 5 to 10. Enrollment
 * now walks through a short guided pose sequence (see
 * useFaceEnrollment.js) instead of grabbing 4 near-identical frontal
 * frames in ~2.4s — a live test (16 July 2026, Christian) showed the
 * old flow gave the matcher no real pose/distance diversity to work
 * with, even though matchBest() (FaceRecognitionService.js) already
 * does nearest-neighbor matching across every stored sample and can
 * benefit from it. 10 comfortably holds one full guided pass (5
 * poses) plus room for a re-enroll to blend in rather than instantly
 * evicting the first pass.
 *
 * Version:
 * v0.16.5
 *
 * Date Code:
 * 160726
 * ==========================================================
 */

const MAX_SAMPLES_PER_PERSON = 10
const STORAGE_KEY = 'mars_face_enrollment_v1'

function storageAvailable() {
  try {
    return typeof window !== 'undefined' && Boolean(window.localStorage)
  } catch {
    return false
  }
}

class FaceEnrollmentStore {
  constructor() {
    this.reset({ clearStorage: false })
    this.loadFromStorage()
  }

  reset({ clearStorage = true } = {}) {
    this.signaturesByPerson = new Map()

    if (clearStorage && storageAvailable()) {
      try {
        window.localStorage.removeItem(STORAGE_KEY)
      } catch {
        // ignore — in-memory reset already happened
      }
    }
  }

  loadFromStorage() {
    if (!storageAvailable()) {
      return
    }

    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)

      if (!raw) {
        return
      }

      const parsed = JSON.parse(raw)

      if (!parsed || typeof parsed !== 'object') {
        return
      }

      Object.entries(parsed).forEach(([personId, samples]) => {
        if (Array.isArray(samples)) {
          this.signaturesByPerson.set(personId, samples)
        }
      })
    } catch {
      // Corrupt/blocked storage — start clean rather than throwing.
    }
  }

  saveToStorage() {
    if (!storageAvailable()) {
      return
    }

    try {
      const asObject = Object.fromEntries(this.signaturesByPerson.entries())
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(asObject))
    } catch {
      // Storage full/blocked — the in-memory copy keeps the session working.
    }
  }

  /**
   * Adds a signature sample for a person. Keeps at most
   * MAX_SAMPLES_PER_PERSON, dropping the oldest sample once full so
   * enrollment can adapt slightly to lighting/angle over time.
   */
  enroll(personId, signature) {
    if (!personId || !Array.isArray(signature) || signature.length === 0) {
      return { status: 'rejected', reason: 'invalid_signature' }
    }

    const existing = this.signaturesByPerson.get(personId) || []
    const updated = [...existing, signature]

    if (updated.length > MAX_SAMPLES_PER_PERSON) {
      updated.shift()
    }

    this.signaturesByPerson.set(personId, updated)
    this.saveToStorage()

    return {
      status: 'success',
      personId,
      sampleCount: updated.length,
    }
  }

  getSamples(personId) {
    return [...(this.signaturesByPerson.get(personId) || [])]
  }

  getEnrolledPersonIds() {
    return [...this.signaturesByPerson.keys()]
  }

  isEnrolled(personId) {
    return this.signaturesByPerson.has(personId) && this.signaturesByPerson.get(personId).length > 0
  }

  clearPerson(personId) {
    const removed = this.signaturesByPerson.delete(personId)

    if (removed) {
      this.saveToStorage()
    }

    return removed
  }

  getStatus() {
    const persons = this.getEnrolledPersonIds()

    return {
      status: 'success',
      provider: 'LOCAL_FACE_ENROLLMENT_STORE',
      version: 'v0.16.1',
      persistentStorage: storageAvailable(),
      onDeviceOnly: true,
      enrolledPersonCount: persons.length,
      totalSampleCount: persons.reduce(
        (sum, personId) => sum + this.getSamples(personId).length,
        0
      ),
    }
  }
}

export default new FaceEnrollmentStore()
