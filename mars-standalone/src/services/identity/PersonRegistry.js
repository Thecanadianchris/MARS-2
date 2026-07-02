/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Service:
 * PersonRegistry
 *
 * Purpose:
 * Maintains the in-memory person registry used by the
 * Identity Foundation layer.
 *
 * This is the first v0.13.0 identity registry. It deliberately
 * avoids persistence, face storage and biometric assumptions.
 * Persistent identity profiles belong to v0.13.1 Identity Learning.
 *
 * Version:
 * v0.13.0
 *
 * Date Code:
 * 010726
 * ==========================================================
 */

const DEFAULT_REGISTRY_STATE = {
  version: 'v0.13.0',
  status: 'active',
  persons: [],
}

class PersonRegistry {
  constructor(initialPersons = []) {
    this.persons = new Map()
    this.registerMany(initialPersons)
  }

  registerMany(persons = []) {
    if (!Array.isArray(persons)) {
      return this.getAllPersons()
    }

    persons.forEach((person) => this.registerPerson(person))
    return this.getAllPersons()
  }

  registerPerson(person = {}) {
    const id = this.normalisePersonId(person.id || person.name)

    if (!id) {
      return {
        status: 'error',
        reason: 'Person requires an id or name.',
      }
    }

    const existing = this.persons.get(id)
    const now = Date.now()

    const registryRecord = {
      id,
      name: person.name || existing?.name || id,
      relationship: person.relationship || existing?.relationship || 'unknown',
      category: person.category || existing?.category || 'known_person',
      alertPriority: person.alertPriority || existing?.alertPriority || 'standard',
      recognitionProfile: person.recognitionProfile || existing?.recognitionProfile || null,
      notes: person.notes || existing?.notes || '',
      createdAt: existing?.createdAt || now,
      updatedAt: now,
    }

    this.persons.set(id, registryRecord)

    return {
      status: 'success',
      person: registryRecord,
    }
  }

  getPerson(personId) {
    const id = this.normalisePersonId(personId)
    return this.persons.get(id) || null
  }

  getAllPersons() {
    return Array.from(this.persons.values())
  }

  hasPerson(personId) {
    const id = this.normalisePersonId(personId)
    return this.persons.has(id)
  }

  removePerson(personId) {
    const id = this.normalisePersonId(personId)
    return this.persons.delete(id)
  }

  matchIdentity(identityCandidate = {}) {
    const candidateId = this.normalisePersonId(
      identityCandidate.personId || identityCandidate.id || identityCandidate.name
    )

    if (candidateId && this.persons.has(candidateId)) {
      return {
        status: 'known',
        person: this.persons.get(candidateId),
        confidence: this.normaliseConfidence(identityCandidate.confidence, 100),
        reason: 'Matched by registered identity id.',
      }
    }

    const candidateName = this.normaliseText(identityCandidate.name)

    if (candidateName) {
      const matchedPerson = this.getAllPersons().find(
        (person) => this.normaliseText(person.name) === candidateName
      )

      if (matchedPerson) {
        return {
          status: 'known',
          person: matchedPerson,
          confidence: this.normaliseConfidence(identityCandidate.confidence, 85),
          reason: 'Matched by registered identity name.',
        }
      }
    }

    return {
      status: 'unknown',
      person: null,
      confidence: this.normaliseConfidence(identityCandidate.confidence, 0),
      reason: 'No registered person matched the candidate.',
    }
  }

  getRegistryState() {
    return {
      ...DEFAULT_REGISTRY_STATE,
      personCount: this.persons.size,
      persons: this.getAllPersons(),
    }
  }

  normalisePersonId(value) {
    if (!value || typeof value !== 'string') {
      return ''
    }

    return value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
  }

  normaliseText(value) {
    if (!value || typeof value !== 'string') {
      return ''
    }

    return value.trim().toLowerCase()
  }

  normaliseConfidence(value, fallback = 0) {
    const confidence = Number.isFinite(value) ? value : fallback
    return Math.max(0, Math.min(100, Math.round(confidence)))
  }
}

export default PersonRegistry
