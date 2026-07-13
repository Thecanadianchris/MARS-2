/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Service:
 * BehaviourLearningService
 *
 * Purpose:
 * The v0.15.5 Behaviour Learning engine. Lets MARS INFER facts
 * about a person from what it observes — from conversation and
 * from the behaviour/observation engines — as confirm-gated
 * candidates.
 *
 * Safety design (a care system):
 *   - CANDIDATES, NOT FACTS. Inference only proposes; nothing is
 *     stored or recalled until a trusted user confirms it (mirrors
 *     the identity pending → confirmed flow).
 *   - NEVER SAFETY. A candidate that would classify as `safety`
 *     (medication, allergy, emergency, safe word …) is refused at
 *     both propose and confirm time. Care-critical facts must be
 *     human-provided.
 *   - Confirmed inferences are written `source: 'inferred'`,
 *     confidence < 1, so they are the only class v0.15.3 retention
 *     can ever decay.
 *   - Observation is silent: it never changes a chat reply.
 *
 * Version:
 * v0.15.5
 * Date Code:
 * 120726
 * ==========================================================
 */

import MemoryIntelligenceService, { MEMORY_SOURCES } from './MemoryIntelligenceService'
import { classify, isSafetyCategory } from './MemoryClassifier'
import { parseInferredFact } from './InferenceParser'
import CapabilityRouter from '@/services/conversation/CapabilityRouter'

const SERVICE_VERSION = 'v0.15.5'
const CONVERSATION_CONFIDENCE = 0.6
const BEHAVIOUR_CONFIDENCE = 0.55
const BEHAVIOUR_THRESHOLD = 3 // repeats of the same signal before proposing

function normalise(value) {
  return String(value ?? '').trim().toLowerCase()
}

class BehaviourLearningService {
  constructor() {
    this.reset()
  }

  reset() {
    this.candidates = []
    this.nextId = 1
    this.behaviourCounts = {} // `${personId}:${bodyPosition}` -> count
  }

  // ---- proposing ----

  propose({ personId, key, value, sourceKind, confidence, evidence }) {
    const pid = normalise(personId)
    const normalisedKey = normalise(key)
    const cleanValue = String(value ?? '').trim()

    if (!pid || !normalisedKey || !cleanValue) {
      return null
    }

    // HARD RULE: inference never creates a safety fact.
    if (isSafetyCategory(classify(normalisedKey, cleanValue))) {
      return { refused: true, reason: 'safety', key: normalisedKey, value: cleanValue }
    }

    // Dedupe identical pending proposals.
    const existing = this.candidates.find(
      (candidate) => candidate.personId === pid && candidate.key === normalisedKey && candidate.value === cleanValue
    )
    if (existing) {
      return existing
    }

    const candidate = {
      id: `cand-${this.nextId++}`,
      personId: pid,
      key: normalisedKey,
      value: cleanValue,
      sourceKind,
      confidence,
      evidence: evidence || null,
      proposedAt: Date.now(),
    }

    this.candidates.push(candidate)
    return candidate
  }

  /** Conversation source: a casual self-statement → candidate. Silent. */
  observe(message, options = {}) {
    const parsed = parseInferredFact(message)
    if (!parsed) {
      return null
    }

    const personId = options.personId || MemoryIntelligenceService.getActivePersonId()
    return this.propose({
      personId,
      key: parsed.key,
      value: parsed.value,
      sourceKind: 'conversation',
      confidence: CONVERSATION_CONFIDENCE,
      evidence: String(message).trim(),
    })
  }

  /**
   * Behaviour source: aggregate a repeated body-position signal from the
   * behaviour engine into a candidate once it has been seen enough times.
   */
  observeBehaviour(behaviourResult = {}) {
    const profile = behaviourResult.profile || {}
    const personId = normalise(profile.personId || profile.id)
    const bodyPosition = normalise(
      behaviourResult.observationStream?.bodyPosition || behaviourResult.currentObservation?.bodyPosition
    )

    if (!personId || personId === 'unknown-person' || !bodyPosition || bodyPosition === 'unknown') {
      return null
    }

    const counterKey = `${personId}:${bodyPosition}`
    this.behaviourCounts[counterKey] = (this.behaviourCounts[counterKey] || 0) + 1

    if (this.behaviourCounts[counterKey] !== BEHAVIOUR_THRESHOLD) {
      // Propose exactly once, when the threshold is first reached.
      return null
    }

    return this.propose({
      personId,
      key: 'usual body position',
      value: bodyPosition,
      sourceKind: 'behaviour',
      confidence: BEHAVIOUR_CONFIDENCE,
      evidence: `Observed ${BEHAVIOUR_THRESHOLD} times`,
    })
  }

  // ---- confirm / reject ----

  confirmCandidate(id) {
    const index = this.candidates.findIndex((candidate) => candidate.id === id)
    if (index === -1) {
      return null
    }

    const candidate = this.candidates[index]

    // Belt-and-suspenders: refuse to store a safety fact even here.
    if (isSafetyCategory(classify(candidate.key, candidate.value))) {
      this.candidates.splice(index, 1)
      return { refused: true, reason: 'safety' }
    }

    const result = CapabilityRouter.route({
      plan: {
        capability: 'memory',
        memoryOp: 'write',
        payload: {
          key: candidate.key,
          value: candidate.value,
          personId: candidate.personId,
          source: MEMORY_SOURCES.INFERRED,
          confidence: candidate.confidence,
        },
      },
    })

    this.candidates.splice(index, 1)
    return { confirmed: true, entry: result.entry || null, result }
  }

  rejectCandidate(id) {
    const before = this.candidates.length
    this.candidates = this.candidates.filter((candidate) => candidate.id !== id)
    return this.candidates.length < before
  }

  // ---- diagnostics ----

  listCandidates(personId = null) {
    const pid = personId ? normalise(personId) : null
    return pid ? this.candidates.filter((candidate) => candidate.personId === pid) : [...this.candidates]
  }

  getStatus() {
    const bySource = this.candidates.reduce((counts, candidate) => {
      counts[candidate.sourceKind] = (counts[candidate.sourceKind] || 0) + 1
      return counts
    }, {})

    return {
      version: SERVICE_VERSION,
      service: 'BehaviourLearningService',
      status: 'ready',
      candidateCount: this.candidates.length,
      bySource,
      confirmGated: true,
      neverSafety: true,
      medicalDiagnosis: false,
    }
  }

  getSnapshot() {
    return {
      status: this.getStatus(),
      candidates: this.listCandidates(),
    }
  }

  resetForTests() {
    this.reset()
  }
}

export default new BehaviourLearningService()
