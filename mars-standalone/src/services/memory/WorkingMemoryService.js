/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Service:
 * WorkingMemoryService
 *
 * Purpose:
 * The v0.15.2 Short-Term Memory Engine — the bridge between the
 * existing short-lived conversation layer (session/context/history)
 * and the person-scoped long-term store (MemoryIntelligenceService,
 * v0.15.1).
 *
 * It holds a session-scoped, in-memory working set for ONE active
 * person:
 *   - SEED: on session start / active-person change, it loads that
 *     person's long-term facts into the working set so MARS "has
 *     them in mind" for the conversation.
 *   - NOTE: a short-term working item can be added during the turn
 *     (not persisted on its own).
 *   - PROMOTE: a working item can be written to long-term via a real
 *     CapabilityRouter memory-write dispatch — the first genuine
 *     write path through the router.
 *
 * It writes NOTHING to long-term on its own; promotion is always an
 * explicit call. This keeps ChatPanel's typed remember/recall
 * commands the sole automatic writer for typed chat (regression-safe).
 *
 * Version:
 * v0.15.2
 * Date Code:
 * 120726
 * ==========================================================
 */

import MemoryIntelligenceService from './MemoryIntelligenceService'
import CapabilityRouter from '@/services/conversation/CapabilityRouter'

const SERVICE_VERSION = 'v0.15.2'

const ITEM_ORIGIN = Object.freeze({
  LONG_TERM: 'long_term', // seeded from the person's persistent store
  WORKING: 'working', // noted this session, not yet persisted
  PROMOTED: 'promoted', // noted this session and written to long-term
})

function normaliseKey(key) {
  return String(key ?? '').trim().toLowerCase()
}

class WorkingMemoryService {
  constructor() {
    this.reset()
  }

  reset() {
    this.personId = null
    this.items = {}
    this.seededCount = 0
    this.lastPromotion = null
  }

  /** SEED — load the active person's long-term facts into the working set. */
  seedForPerson(personId) {
    this.personId = personId || null
    this.items = {}

    const entries = personId ? MemoryIntelligenceService.getEntriesForPerson(personId) : []

    for (const entry of entries) {
      this.items[entry.key] = {
        key: entry.key,
        value: entry.value,
        origin: ITEM_ORIGIN.LONG_TERM,
        promoted: true, // already in long-term
      }
    }

    this.seededCount = entries.length
    return this.getWorkingSet()
  }

  /** NOTE — add/refresh a short-term working item (not persisted). */
  note(key, value) {
    const normalisedKey = normaliseKey(key)
    if (!normalisedKey) {
      return null
    }

    const existing = this.items[normalisedKey]
    this.items[normalisedKey] = {
      key: normalisedKey,
      value,
      origin: existing?.promoted ? ITEM_ORIGIN.PROMOTED : ITEM_ORIGIN.WORKING,
      promoted: Boolean(existing?.promoted),
      addedAt: Date.now(),
    }

    return this.items[normalisedKey]
  }

  /**
   * PROMOTE — write a working item to long-term via a real
   * CapabilityRouter memory-write dispatch. Returns the router result.
   */
  promote(key, options = {}) {
    const normalisedKey = normaliseKey(key)
    const item = this.items[normalisedKey]
    if (!item) {
      return null
    }

    const personId = options.personId || this.personId || undefined

    const result = CapabilityRouter.route({
      plan: {
        capability: 'memory',
        memoryOp: 'write',
        payload: {
          key: item.key,
          value: item.value,
          personId,
          category: options.category,
          source: options.source,
        },
      },
    })

    item.promoted = true
    item.origin = ITEM_ORIGIN.PROMOTED
    this.lastPromotion = { key: item.key, personId: personId || null, at: Date.now(), result }

    return result
  }

  /** Convenience: note then immediately promote. */
  noteAndPromote(key, value, options = {}) {
    this.note(key, value)
    return this.promote(key, options)
  }

  getWorkingSet() {
    return Object.values(this.items)
  }

  getStatus() {
    const items = this.getWorkingSet()
    return {
      version: SERVICE_VERSION,
      service: 'WorkingMemoryService',
      status: 'ready',
      personId: this.personId,
      itemCount: items.length,
      seededCount: this.seededCount,
      promotedCount: items.filter((item) => item.promoted).length,
      workingOnlyCount: items.filter((item) => !item.promoted).length,
      lastPromotion: this.lastPromotion,
      medicalDiagnosis: false,
    }
  }

  getSnapshot() {
    return {
      status: this.getStatus(),
      items: this.getWorkingSet(),
    }
  }

  clear() {
    this.reset()
  }

  resetForTests() {
    this.reset()
  }
}

export { ITEM_ORIGIN }
export default new WorkingMemoryService()
