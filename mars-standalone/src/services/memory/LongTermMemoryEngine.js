/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Service:
 * LongTermMemoryEngine
 *
 * Purpose:
 * The v0.15.3 Long-Term Memory Engine — a layer over the
 * person-scoped store (MemoryIntelligenceService) that makes
 * long-term memory smart: heuristic categorisation, access-based
 * salience ranking, and a SAFETY-aware retention policy.
 *
 * Design guard (this is a care system):
 *   - The `safety` category (medication, allergy, emergency
 *     contact, safe word …) is permanently PROTECTED — never
 *     ranked away, never pruned.
 *   - Explicit user-provided facts (source: user_explicit — which
 *     is everything today) are never auto-forgotten. Retention
 *     only ever considers inferred, non-safety facts (which arrive
 *     in v0.15.4), so on today's data runRetention() is a verified
 *     no-op.
 *
 * It stores nothing itself and diagnoses nothing.
 *
 * Version:
 * v0.15.3
 * Date Code:
 * 120726
 * ==========================================================
 */

import MemoryIntelligenceService, { MEMORY_SOURCES } from './MemoryIntelligenceService'
import { classify, isSafetyCategory, MEMORY_CATEGORY } from './MemoryClassifier'

const SERVICE_VERSION = 'v0.15.3'
const SAFETY_SALIENCE_WEIGHT = 1000
const DAY_MS = 24 * 60 * 60 * 1000

class LongTermMemoryEngine {
  // ---- categorisation ----

  /**
   * Backfill categories for entries still marked 'uncategorised'
   * (older entries written before v0.15.3). New writes are already
   * classified by the store. Returns the number of entries updated.
   */
  categoriseAll(personId = null) {
    const persons = personId
      ? [{ personId }]
      : MemoryIntelligenceService.listPersonsWithMemory()

    let updated = 0

    for (const person of persons) {
      const entries = MemoryIntelligenceService.getEntriesForPerson(person.personId)

      for (const entry of entries) {
        if (!entry.category || entry.category === MEMORY_CATEGORY.UNCATEGORISED) {
          MemoryIntelligenceService.updateEntryCategory(
            entry.key,
            classify(entry.key, entry.value),
            { personId: person.personId }
          )
          updated += 1
        }
      }
    }

    return updated
  }

  // ---- salience ----

  salienceScore(entry, now = Date.now()) {
    if (!entry) {
      return 0
    }

    let score = 0

    if (isSafetyCategory(entry.category)) {
      score += SAFETY_SALIENCE_WEIGHT
    }

    const ref = entry.lastAccessedAt || entry.updatedAt || entry.createdAt || now
    const ageDays = Math.max(0, (now - ref) / DAY_MS)

    score += Math.max(0, 30 - ageDays) // recency (newer = higher, capped)
    score += (entry.accessCount || 0) * 2 // frequency of use
    score += (entry.confidence ?? 1) * 5 // confidence

    return Math.round(score * 100) / 100
  }

  getRankedEntriesForPerson(personId, now = Date.now()) {
    return MemoryIntelligenceService.getEntriesForPerson(personId)
      .map((entry) => ({ ...entry, salience: this.salienceScore(entry, now) }))
      .sort((a, b) => b.salience - a.salience)
  }

  // ---- retention (safety-aware) ----

  /** A fact is protected (never auto-forgotten) if it is safety-critical
   *  OR was explicitly provided by a user. */
  isProtected(entry) {
    return isSafetyCategory(entry.category) || entry.source === MEMORY_SOURCES.USER_EXPLICIT
  }

  /** Entries that COULD be forgotten under a given policy — inferred,
   *  non-safety, older than maxAgeDays. Empty on today's explicit data. */
  getEligibleForRetention(personId, { maxAgeDays = Infinity, now = Date.now() } = {}) {
    return MemoryIntelligenceService.getEntriesForPerson(personId).filter((entry) => {
      if (this.isProtected(entry)) {
        return false
      }
      const ref = entry.updatedAt || entry.createdAt || now
      const ageDays = (now - ref) / DAY_MS
      return ageDays > maxAgeDays
    })
  }

  /**
   * Runs the retention policy. Defaults to a DRY RUN and an infinite age,
   * so by default it prunes nothing. Even when armed it only ever removes
   * inferred, non-safety, aged facts — explicit and safety facts are always
   * protected.
   */
  runRetention({ personId = null, maxAgeDays = Infinity, dryRun = true, now = Date.now() } = {}) {
    const persons = personId
      ? [{ personId }]
      : MemoryIntelligenceService.listPersonsWithMemory()

    const pruned = []
    let evaluated = 0

    for (const person of persons) {
      const eligible = this.getEligibleForRetention(person.personId, { maxAgeDays, now })
      evaluated += MemoryIntelligenceService.getEntriesForPerson(person.personId).length

      for (const entry of eligible) {
        if (!dryRun) {
          MemoryIntelligenceService.forgetEntry(entry.key, { personId: person.personId })
        }
        pruned.push({ personId: person.personId, key: entry.key })
      }
    }

    return { dryRun, evaluated, prunedCount: pruned.length, pruned }
  }

  // ---- diagnostics ----

  getRetentionReport(personId = null) {
    const persons = personId
      ? [{ personId }]
      : MemoryIntelligenceService.listPersonsWithMemory()

    let total = 0
    let protectedCount = 0
    let safetyCount = 0

    for (const person of persons) {
      for (const entry of MemoryIntelligenceService.getEntriesForPerson(person.personId)) {
        total += 1
        if (isSafetyCategory(entry.category)) safetyCount += 1
        if (this.isProtected(entry)) protectedCount += 1
      }
    }

    return {
      total,
      protectedCount,
      safetyCount,
      eligibleToForget: total - protectedCount, // 0 while all facts are explicit
    }
  }

  getStatus() {
    const report = this.getRetentionReport()
    const categoryCounts = {}

    for (const person of MemoryIntelligenceService.listPersonsWithMemory()) {
      for (const entry of MemoryIntelligenceService.getEntriesForPerson(person.personId)) {
        const category = entry.category || MEMORY_CATEGORY.UNCATEGORISED
        categoryCounts[category] = (categoryCounts[category] || 0) + 1
      }
    }

    return {
      version: SERVICE_VERSION,
      service: 'LongTermMemoryEngine',
      status: 'ready',
      categoryCounts,
      safetyCount: report.safetyCount,
      protectedCount: report.protectedCount,
      eligibleToForget: report.eligibleToForget,
      retentionActive: false, // conservative: no auto-forgetting of explicit facts
      medicalDiagnosis: false,
    }
  }
}

export default new LongTermMemoryEngine()
