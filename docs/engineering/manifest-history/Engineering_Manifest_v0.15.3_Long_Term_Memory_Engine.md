# Engineering Manifest — v0.15.3 Long-Term Memory Engine

Document status: Milestone record (authoritative copy, `manifest-history/`)
Date: 12 July 2026
Branch: `feature/v0.13.0-identity-foundation`
Projected baseline after this milestone: **37 test files, ~174 tests** — *pending Christian's `npm test` / `npm run build` / `npm run release-check` from `mars-standalone/` (shell sandbox down this session; code written and statically reviewed, not executed).*

Prior baseline: v0.15.2 — 36 files, ~162 tests (built, pending Christian's test run/commit).

---

## 1. Why this milestone exists

v0.15 gave a person-scoped long-term store, but it was "dumb": every fact was `uncategorised`, nothing tracked usage, and there was no retention policy. v0.15.3 adds a `LongTermMemoryEngine` layer that makes long-term memory smart — categorisation, salience ranking, and retention — chosen scope **Option B** (smart + safety-aware retention infrastructure), categorisation **heuristic/rule-based**.

## 2. Design guard: a care system biases to remember

Auto-forgetting is a safety hazard for a robot monitoring protected users. The engine is built safety-first:
- A first-class **`safety` category** (medication, allergy, emergency contact, safe word, doctor, care instructions…) that is **permanently protected** — always ranked first, never pruned.
- **Explicit** user-provided facts (`source: user_explicit`, i.e. everything today) are **never auto-forgotten**. Retention only ever evaluates **inferred, non-safety** facts (which arrive in v0.15.4), so on today's data `runRetention()` is a **verified no-op**.

## 3. What was built

**`services/memory/MemoryClassifier.js` (new, pure)** — `classify(key, value)` → `safety | personal | preference | fact`, with the value also scanned for safety keywords (so "note: give insulin at 8pm" flags). Dependency-free and unit-tested.

**`MemoryIntelligenceService` (extended)** — added `safety` to the category set; **auto-classifies new writes** (so ChatPanel's and everyone's writes get a real category with no ChatPanel change); added `lastAccessedAt` / `accessCount` to the schema (backward-compatible, no migration change); `recall` now bumps access for salience; added `updateEntryCategory` and `forgetEntry`.

**`services/memory/LongTermMemoryEngine.js` (new)** —
- `categoriseAll()` backfills older `uncategorised` entries.
- `salienceScore` = safety weight (1000) + recency + frequency (accessCount) + confidence; `getRankedEntriesForPerson` returns safety-first, salience-sorted.
- `isProtected` (safety OR user_explicit), `getEligibleForRetention`, `runRetention` (defaults to a dry-run, infinite age → prunes nothing; even armed, only removes inferred non-safety aged facts), `getRetentionReport`, `getStatus`.

**MEM-I panel** — safety facts sort to the top of each person, safety category chips and cards are highlighted (rose), and a retention line shows "N facts protected (incl. M safety), 0 eligible to forget". Hook backfills categories on load and exposes the long-term status.

## 4. Regression safety

- **No ChatPanel change** — auto-classification lives in the store's `remember`, so typed commands keep working and simply gain a category.
- **REGRESSION GUARD tests**: an armed, maximally-aggressive `runRetention({ maxAgeDays: -1, dryRun: false })` prunes **zero** explicit facts and **zero** safety facts (even inferred safety). Only an inferred, non-safety fact is ever eligible.
- `recall` gaining access-tracking is additive; values and existing assertions are unchanged. The one Foundation test that asserted `uncategorised` for `name` was updated to the now-correct `personal`.

## 5. Files

**Added:** `services/memory/MemoryClassifier.js`, `services/memory/LongTermMemoryEngine.js`, `tests/LongTermMemoryEngineSmokeTest.test.js` (classification incl. safety, backfill, access/salience, and the retention protection guards).

**Modified:** `services/memory/MemoryIntelligenceService.js` (safety category, auto-classify, access fields, `recall` bump, `updateEntryCategory`, `forgetEntry`), `services/memory/index.js` (exports), `hooks/useMemoryIntelligence.js` (backfill + long-term status), `components/memory/MemoryIntelligencePanel.jsx` (safety highlighting, safety-first order, retention line), `tests/MemoryIntelligenceSmokeTest.test.js` (one category assertion updated to `personal`).

**Not touched:** ChatPanel, the shim, WorkingMemory promotion, the reasoning chain, the store's on-disk shape (still `mars_memory_v3`; new fields are additive).

## 6. Validation

Run from `mars-standalone/`:
```
npm test
npm run build
npm run release-check
```
Expected ~37 files / ~174 tests. Then:
```
git add -A
git commit -m "feat: v0.15.3 long-term memory engine — categorisation, salience, safety-aware retention"
git push origin feature/v0.13.0-identity-foundation
```
(Note: v0.15.2 is still uncommitted; this commit would include it unless you commit v0.15.2 separately first.)

Recommended UI check: on MEM-I, `medication: 8pm` (Finley) now shows a highlighted **safety** chip and sorts to the top; the retention line reads "N facts protected (incl. 1 safety), 0 eligible to forget".

## 7. What's next in Phase 6

- **v0.15.4 Behaviour Learning & Personal Context** — inferred facts (`source: 'inferred'`, `confidence < 1`), the first real use of the retention decay path, and feeding per-person memory into the v0.14.4 reasoning chain (the long-deferred Option C).
- Then **v0.16 Face Recognition** (`setActivePerson`).

## 8. Safety boundary (unchanged, reinforced)

`medicalDiagnosis: false` everywhere. The `safety` category stores user-provided care reminders (e.g. "medication is 8pm") as plain facts; it does not assess, diagnose, or advise on health. Its only special behaviour is stronger retention (never forgotten) and ranking (surfaced first).
