/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Service:
 * FaceEnrollmentStore
 *
 * Purpose:
 * Holds enrolled face signatures for the v0.16 Face Recognition
 * Foundation, keyed by personId (the same id space as
 * PersonRegistry). Supports multiple samples per person for a
 * little extra matching robustness.
 *
 * Privacy posture: on-device only, in-memory only, for this
 * milestone. Biometric signatures are never sent anywhere and
 * never leave this process. Persisting enrolled faces across
 * page reloads is explicitly deferred to v0.16.1 (Face
 * Registration & Known Person Database) — this store is the
 * Foundation-level matching primitive, not the management UI.
 *
 * This store does not decide who is trusted or protected — it
 * only maps a personId to geometry signatures. PersonRegistry
 * remains the single source of truth for trust/protection.
 *
 * Version:
 * v0.16.0
 *
 * Date Code:
 * 130726
 * ==========================================================
 */

const MAX_SAMPLES_PER_PERSON = 5

class FaceEnrollmentStore {
  constructor() {
    this.reset()
  }

  reset() {
    this.signaturesByPerson = new Map()
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
    return this.signaturesByPerson.delete(personId)
  }

  getStatus() {
    const persons = this.getEnrolledPersonIds()

    return {
      status: 'success',
      provider: 'LOCAL_FACE_ENROLLMENT_STORE',
      version: 'v0.16.0',
      persistentStorage: false,
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
