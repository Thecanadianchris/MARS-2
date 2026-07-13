/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Service:
 * MemoryIntelligenceService
 *
 * Purpose:
 * The authoritative persistent-memory store for MARS.
 *
 * v0.15   introduced the store and absorbed the old flat Notes
 *         store (components/mars/memory.js is a thin shim).
 * v0.15.1 makes memory PERSON-SCOPED: every fact belongs to a
 *         personId (the same id PersonRegistry / Identity — and
 *         later Face Recognition — produce). The number of people
 *         is unbounded (a keyed object, no fixed cap). An
 *         "active person" can be set (face recognition will do
 *         this in v0.16); until then everything resolves to the
 *         owner/default person, so chat and the Notes tab behave
 *         exactly as before.
 *
 * Store shape (v0.15.1):
 *   {
 *     version, defaultPersonId,
 *     persons: { [personId]: { entries: { [key]: entry } } }
 *   }
 * entry = { key, value, category, source, confidence, createdAt, updatedAt }
 *
 * Storage: localStorage['mars_memory_v3'] on this machine only,
 * with an in-memory fallback for vitest's node environment. Older
 * stores (mars_memory_v2 flat, and the legacy mars_memory map) are
 * migrated once, loss-free, into the default person's scope and
 * left untouched for rollback safety.
 *
 * Safety boundary (unchanged): stores user-provided facts and
 * preferences only. It does not infer, and never stores medical
 * assessments or diagnoses.
 *
 * Version:
 * v0.15.1
 * Date Code:
 * 120726
 * ==========================================================
 */

import { classify } from './MemoryClassifier'

const STORAGE_KEY = 'mars_memory_v3'
const STORAGE_KEY_V2 = 'mars_memory_v2' // v0.15 person-less store
const LEGACY_STORAGE_KEY = 'mars_memory' // pre-v0.15 flat map
const STORE_VERSION = 'v0.15.1'

// Owner profile id from services/identity/PersonRegistry (the OWNER
// default profile). Untagged "remember my X" attaches here until a
// confirmed face-recognition identity sets a different active person.
export const DEFAULT_PERSON_ID = 'christian'

export const MEMORY_CATEGORIES = Object.freeze({
  SAFETY: 'safety',
  PERSONAL: 'personal',
  PREFERENCE: 'preference',
  FACT: 'fact',
  UNCATEGORISED: 'uncategorised',
})

export const MEMORY_SOURCES = Object.freeze({
  USER_EXPLICIT: 'user_explicit',
  INFERRED: 'inferred',
})

function storageAvailable() {
  try {
    return typeof window !== 'undefined' && Boolean(window.localStorage)
  } catch {
    return false
  }
}

function normaliseKey(key) {
  return String(key ?? '').trim().toLowerCase()
}

function normalisePersonId(personId) {
  return String(personId ?? '').trim().toLowerCase()
}

function emptyStore() {
  return {
    version: STORE_VERSION,
    defaultPersonId: DEFAULT_PERSON_ID,
    persons: {},
    migratedFrom: null,
    migratedAt: null,
  }
}

/**
 * Pure, side-effect-free migration of a flat legacy map
 * ({ key: value }) into the v0.15 entry schema. Exported so the
 * migration itself can be unit-tested without a browser.
 */
export function buildEntriesFromLegacy(legacyMap = {}, timestamp = Date.now()) {
  const entries = {}

  if (!legacyMap || typeof legacyMap !== 'object') {
    return entries
  }

  for (const [rawKey, value] of Object.entries(legacyMap)) {
    const key = normaliseKey(rawKey)

    if (!key) {
      continue
    }

    entries[key] = {
      key,
      value,
      category: classify(key, value),
      source: MEMORY_SOURCES.USER_EXPLICIT,
      confidence: 1.0,
      createdAt: timestamp,
      updatedAt: timestamp,
      lastAccessedAt: null,
      accessCount: 0,
    }
  }

  return entries
}

class MemoryIntelligenceService {
  constructor() {
    this.memoryStore = emptyStore()
    this.activePersonId = null // null → resolves to defaultPersonId
    this.lastMigrationSummary = null
  }

  // ---- storage plumbing (mirrors AIProviderConfig) ----

  readRaw(storageKey) {
    if (!storageAvailable()) {
      return null
    }

    try {
      const raw = window.localStorage.getItem(storageKey)
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  }

  loadStore() {
    const existing = this.readRaw(STORAGE_KEY)

    if (existing && typeof existing === 'object' && existing.persons) {
      return { ...emptyStore(), ...existing }
    }

    const timestamp = Date.now()

    // Migrate v0.15 person-less store → default person scope.
    const v2 = this.readRaw(STORAGE_KEY_V2)

    if (v2 && typeof v2 === 'object' && v2.entries && Object.keys(v2.entries).length > 0) {
      const migrated = {
        ...emptyStore(),
        persons: { [DEFAULT_PERSON_ID]: { entries: v2.entries } },
        migratedFrom: 'v0.15',
        migratedAt: timestamp,
      }

      this.lastMigrationSummary = {
        migrated: true,
        from: 'v0.15',
        importedCount: Object.keys(v2.entries).length,
        intoPersonId: DEFAULT_PERSON_ID,
        timestamp,
      }

      this.persist(migrated)
      return migrated
    }

    // Migrate pre-v0.15 legacy flat map → default person scope.
    const legacy = this.readRaw(LEGACY_STORAGE_KEY)

    if (legacy && typeof legacy === 'object' && Object.keys(legacy).length > 0) {
      const entries = buildEntriesFromLegacy(legacy, timestamp)
      const migrated = {
        ...emptyStore(),
        persons: { [DEFAULT_PERSON_ID]: { entries } },
        migratedFrom: 'legacy',
        migratedAt: timestamp,
      }

      this.lastMigrationSummary = {
        migrated: true,
        from: 'legacy',
        importedCount: Object.keys(entries).length,
        intoPersonId: DEFAULT_PERSON_ID,
        timestamp,
      }

      this.persist(migrated)
      return migrated
    }

    return emptyStore()
  }

  persist(store) {
    this.memoryStore = store

    if (storageAvailable()) {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
      } catch {
        // Storage full/blocked — the in-memory copy keeps the session working.
      }
    }

    return store
  }

  getStore() {
    if (storageAvailable()) {
      const store = this.loadStore()
      this.memoryStore = store
      return store
    }

    return this.memoryStore
  }

  // ---- person resolution ----

  resolvePersonId(options = {}) {
    const explicit = normalisePersonId(options.personId)
    if (explicit) {
      return explicit
    }

    if (this.activePersonId) {
      return this.activePersonId
    }

    return this.getStore().defaultPersonId || DEFAULT_PERSON_ID
  }

  /** Face recognition (v0.16) will call this once an identity is confirmed. */
  setActivePerson(personId) {
    this.activePersonId = normalisePersonId(personId) || null
    return this.activePersonId
  }

  getActivePersonId() {
    return this.activePersonId || this.getStore().defaultPersonId || DEFAULT_PERSON_ID
  }

  getPersonScope(store, personId) {
    return store.persons[personId] || { entries: {} }
  }

  // ---- write / read (person-scoped, shim-compatible) ----

  remember(key, value, options = {}) {
    const normalisedKey = normaliseKey(key)

    if (!normalisedKey) {
      return null
    }

    const store = this.getStore()
    const personId = this.resolvePersonId(options)
    const now = Date.now()
    const scope = this.getPersonScope(store, personId)
    const previous = scope.entries[normalisedKey] || null

    const entry = {
      key: normalisedKey,
      value,
      // v0.15.3: auto-classify new facts (safety/personal/preference/fact).
      // Explicit category or an existing one always wins.
      category: options.category || previous?.category || classify(normalisedKey, value),
      source: options.source || MEMORY_SOURCES.USER_EXPLICIT,
      confidence: options.confidence ?? previous?.confidence ?? 1.0,
      createdAt: previous?.createdAt || now,
      updatedAt: now,
      lastAccessedAt: previous?.lastAccessedAt || null,
      accessCount: previous?.accessCount || 0,
    }

    const nextStore = {
      ...store,
      persons: {
        ...store.persons,
        [personId]: { entries: { ...scope.entries, [normalisedKey]: entry } },
      },
    }

    this.persist(nextStore)
    return entry
  }

  /** Returns the stored value (string) — same contract as the old recall(). */
  recall(key, options = {}) {
    const entry = this.getEntry(key, options)

    if (entry) {
      // v0.15.3: recall is an intentful access — track it for salience.
      this.recordAccess(key, options)
    }

    return entry ? entry.value : undefined
  }

  /** getEntry is a pure read (no access tracking). */
  getEntry(key, options = {}) {
    const store = this.getStore()
    const personId = this.resolvePersonId(options)
    return this.getPersonScope(store, personId).entries[normaliseKey(key)] || null
  }

  /** Bumps lastAccessedAt / accessCount for a fact (used by recall). */
  recordAccess(key, options = {}) {
    const store = this.getStore()
    const personId = this.resolvePersonId(options)
    const normalisedKey = normaliseKey(key)
    const scope = this.getPersonScope(store, personId)
    const entry = scope.entries[normalisedKey]

    if (!entry) {
      return null
    }

    const updated = {
      ...entry,
      lastAccessedAt: Date.now(),
      accessCount: (entry.accessCount || 0) + 1,
    }

    this.persist({
      ...store,
      persons: { ...store.persons, [personId]: { entries: { ...scope.entries, [normalisedKey]: updated } } },
    })

    return updated
  }

  /** Sets an entry's category (used by the Long-Term Memory Engine backfill). */
  updateEntryCategory(key, category, options = {}) {
    const store = this.getStore()
    const personId = this.resolvePersonId(options)
    const normalisedKey = normaliseKey(key)
    const scope = this.getPersonScope(store, personId)
    const entry = scope.entries[normalisedKey]

    if (!entry || !category) {
      return null
    }

    const updated = { ...entry, category }

    this.persist({
      ...store,
      persons: { ...store.persons, [personId]: { entries: { ...scope.entries, [normalisedKey]: updated } } },
    })

    return updated
  }

  /**
   * Returns a flat { key: value } map for the resolved person — same
   * contract the old recallAll() had, so NotesPanel and Control.jsx
   * (which call it with no person) render the owner/default scope unchanged.
   */
  recallAll(options = {}) {
    const store = this.getStore()
    const personId = this.resolvePersonId(options)
    const flat = {}

    for (const [key, entry] of Object.entries(this.getPersonScope(store, personId).entries)) {
      flat[key] = entry.value
    }

    return flat
  }

  recallAllForPerson(personId) {
    return this.recallAll({ personId })
  }

  /** Full entry objects for the resolved person. */
  getEntries(options = {}) {
    const store = this.getStore()
    const personId = this.resolvePersonId(options)
    return Object.values(this.getPersonScope(store, personId).entries)
  }

  getEntriesForPerson(personId) {
    return this.getEntries({ personId })
  }

  listPersonsWithMemory() {
    const store = this.getStore()

    return Object.entries(store.persons).map(([personId, scope]) => ({
      personId,
      entryCount: Object.keys(scope.entries || {}).length,
    }))
  }

  /** Removes a single entry from a person's scope (used by retention). */
  forgetEntry(key, options = {}) {
    const store = this.getStore()
    const personId = this.resolvePersonId(options)
    const normalisedKey = normaliseKey(key)
    const scope = this.getPersonScope(store, personId)

    if (!scope.entries[normalisedKey]) {
      return false
    }

    const nextEntries = { ...scope.entries }
    delete nextEntries[normalisedKey]

    this.persist({
      ...store,
      persons: { ...store.persons, [personId]: { entries: nextEntries } },
    })

    return true
  }

  /** Clears one person's scope (default person when unspecified). */
  clearMemory(options = {}) {
    const store = this.getStore()
    const personId = this.resolvePersonId(options)

    if (!store.persons[personId]) {
      return
    }

    const nextPersons = { ...store.persons }
    delete nextPersons[personId]
    this.persist({ ...store, persons: nextPersons })
  }

  /** Wipes every person's memory. */
  clearAllPersons() {
    this.persist(emptyStore())
  }

  // ---- diagnostics ----

  getStatus() {
    const store = this.getStore()
    const persons = this.listPersonsWithMemory()
    const totalEntries = persons.reduce((sum, p) => sum + p.entryCount, 0)

    // Category counts + last-updated across ALL persons.
    const categoryCounts = {}
    let lastUpdatedAt = 0

    for (const scope of Object.values(store.persons)) {
      for (const entry of Object.values(scope.entries || {})) {
        const category = entry.category || MEMORY_CATEGORIES.UNCATEGORISED
        categoryCounts[category] = (categoryCounts[category] || 0) + 1
        lastUpdatedAt = Math.max(lastUpdatedAt, entry.updatedAt || 0)
      }
    }

    return {
      version: STORE_VERSION,
      service: 'MemoryIntelligenceService',
      status: 'ready',
      persistentMemory: true,
      storageBacked: storageAvailable(),
      storageKey: STORAGE_KEY,
      personScoped: true,
      defaultPersonId: store.defaultPersonId || DEFAULT_PERSON_ID,
      activePersonId: this.getActivePersonId(),
      personCount: persons.length,
      entryCount: totalEntries, // total across all persons (engine reads this)
      persons,
      categoryCounts,
      migratedFrom: store.migratedFrom || null,
      migratedAt: store.migratedAt || null,
      lastUpdatedAt: lastUpdatedAt || null,
      lastMigrationSummary: this.lastMigrationSummary,
      medicalDiagnosis: false,
    }
  }

  getSnapshot() {
    const store = this.getStore()

    const persons = Object.entries(store.persons).map(([personId, scope]) => ({
      personId,
      entries: Object.values(scope.entries || {}),
    }))

    return {
      status: this.getStatus(),
      persons,
    }
  }

  resetForTests() {
    this.memoryStore = emptyStore()
    this.activePersonId = null
    this.lastMigrationSummary = null

    if (storageAvailable()) {
      try {
        window.localStorage.removeItem(STORAGE_KEY)
      } catch {
        // ignore
      }
    }
  }
}

export default new MemoryIntelligenceService()
