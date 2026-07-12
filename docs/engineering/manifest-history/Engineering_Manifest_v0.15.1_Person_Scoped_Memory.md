# Engineering Manifest — v0.15.1 Person-Scoped Memory (Multi-User)

Document status: Milestone record (authoritative copy, `manifest-history/`)
Date: 12 July 2026
Branch: `feature/v0.13.0-identity-foundation`
Projected baseline after this milestone: **35 test files, ~151 tests** — *pending Christian's `npm test` / `npm run build` / `npm run release-check` from `mars-standalone/` (shell sandbox down this session; code written and statically reviewed, not executed).*

Prior baseline: v0.15 — 34 files, ~139 tests.

---

## 1. Why this milestone exists

MARS is a multi-user assistive system: it monitors one or more **protected users** and alerts a separate, unbounded set of **caregivers**. The v0.15 memory store was a single global bucket. v0.15.1 makes memory **person-scoped** so each person has their own remembered facts, and the design is ready for face recognition (v0.16) to populate those records once a person is identified.

Design decisions taken into this milestone (confirmed by Christian):
- **Expandable / unbounded** — the number of people is unknown (2, 3, 4, N). Nothing is hardcoded to a fixed count.
- **Owner default + explicit tags** — untagged "remember my X" attaches to the owner/default person (today's behaviour, unchanged). Explicit per-person tags ("remember Finley's medication is 8pm") are supported now. A confirmed face-recognition identity can set the "active person" later (v0.16) with no schema change.

Full rationale in the design doc `Design_v0.15.1_Person_Scoped_Memory_and_Multi_User.md`.

## 2. The join key: `personId`

`services/identity/PersonRegistry.js` already stores people in an unbounded `Map` keyed by `id` (`christian` OWNER, `ann` TRUSTED_USER, `finley` PROTECTED_USER), with a pending→confirmed flow that is the face-recognition hook. Its header explicitly states it is "not the future long-term memory database" — v0.15 memory is that database. v0.15.1 keys memory by the same `personId`, so Identity, Memory, per-person baselines and Notification targets all join on one id.

## 3. Store shape (v0.15.1)

```
mars_memory_v3 = {
  version: 'v0.15.1',
  defaultPersonId: 'christian',            // OWNER profile id
  persons: { [personId]: { entries: { [key]: entry } } }
}
entry = { key, value, category, source, confidence, createdAt, updatedAt }
```

- **Unbounded by construction** — `persons` is a keyed object; N people cost nothing. Scopes are created lazily on first write.
- **Active person** — `setActivePerson(personId)` / `getActivePersonId()`; when unset, everything resolves to `defaultPersonId`. Face recognition will call `setActivePerson` in v0.16.
- **Resolution order** for every read/write: explicit `{ personId }` → active person → default person.

## 4. Migration (loss-free, chained)

`loadStore()` migrates once, into the default person's scope, leaving older keys untouched for rollback:
- `mars_memory_v3` present → use it.
- else `mars_memory_v2` (v0.15 flat `{ entries }`) → wrap into `persons.christian.entries` (`migratedFrom: 'v0.15'`).
- else `mars_memory` (pre-v0.15 legacy map) → `buildEntriesFromLegacy` → `persons.christian.entries` (`migratedFrom: 'legacy'`).
- else empty.

In-memory fallback for vitest's node env, same as before.

## 5. Regression safety (the important part)

The owner path is structurally untouched:
- `components/mars/memory.js` shim still calls the service with **no** person argument, which resolves to the default person — so ChatPanel's existing "remember my X is Y" / "what is my X" commands and the Notes tab render the owner scope exactly as before. The shim file itself did not change.
- Explicit person-tag parsing lives in a **separate pure module** `services/memory/MemoryCommandParser.js` and only matches the **possessive-name** form (`Name's …`). "remember my birthday is June 5th" has no apostrophe-s and can never match it — proven by REGRESSION GUARD tests. ChatPanel checks the person-tag parser **before** the owner patterns, so an explicit tag routes to that person while everything else falls through unchanged.
- Unknown names are refused honestly ("I do not recognise X yet… confirm their profile first") rather than silently creating a phantom person — consistent with the identity model, where people must be known/confirmed.

## 6. Files

**Added:**
- `services/memory/MemoryCommandParser.js` — pure person-tag parser (`parsePersonMemoryWrite`, `parsePersonMemoryRecall`).
- `tests/MemoryCommandParserSmokeTest.test.js` — 7 tests incl. owner-command regression guards.

**Modified:**
- `services/memory/MemoryIntelligenceService.js` — rewritten to the person-scoped v3 store: `personId` resolution, active person, `remember/recall/getEntry/recallAll(+ForPerson)`, `listPersonsWithMemory`, `clearMemory({personId})`, `clearAllPersons`, chained migration, person-aware `getStatus`/`getSnapshot`. Exports `DEFAULT_PERSON_ID`.
- `services/memory/index.js` — new exports.
- `components/mars/ChatPanel.jsx` — explicit person-tag write/recall wired in ahead of the owner patterns, resolving names via `PersonRegistry`.
- `hooks/useMemoryIntelligence.js` — exposes `persons`; `clearAll` now wipes all persons.
- `components/memory/MemoryIntelligencePanel.jsx` — People metric + memory grouped by person (owner tagged).
- `tests/MemoryIntelligenceSmokeTest.test.js` — version bumped to v0.15.1; added a Person-scoped describe block (independence, unbounded, per-person counts, targeted vs full clear, active-person override).

**Not touched:** `components/mars/memory.js` (shim), `NotesPanel.jsx`, the v0.14.4 reasoning chain. The conversation-layer read-wiring from v0.15 still works — `getStatus().entryCount` is now the total across all persons.

## 7. Validation

Run from `mars-standalone/`:
```
npm test
npm run build
npm run release-check
```
Expected: prior suite green plus the new person-scoping and parser tests → ~35 files / ~151 tests. Then commit:
```
git add -A
git commit -m "feat: v0.15.1 person-scoped memory + explicit person-tag chat commands (multi-user)"
git push origin feature/v0.13.0-identity-foundation
```

Recommended live UI check: "remember Finley's medication is 8pm" → MARS confirms for Finley; "what is Finley's medication" → correct recall; owner "remember my favourite colour is red" still works; MEM-I tab shows People=2 with memory grouped under `christian` (owner) and `finley`; "remember Bob's X is Y" (unknown) → honest "I do not recognise Bob yet".

## 8. What this sets up next

- **v0.16 Face Recognition** — resolve a detected face to a `personId` (or pending→confirm), then `setActivePerson(personId)` so "my …" attaches to the recognised person, and append recognition data to their record.
- **v0.15.2 Long-Term Memory** — categories/decay per person.
- **v0.15.3 Behaviour Learning & Personal Context** — per-person inferred facts + injecting a person's context into the v0.14.4 reasoning chain.
- **Phase 8 Protected User Alerting** — the monitor→check-in→escalate flow, routing to each protected person's caregivers (unbounded).

## 9. Safety boundary (unchanged)

`medicalDiagnosis: false` across every layer. Memory stores user-provided facts and preferences per person only; it does not infer or store medical assessments. Per-person baselines (Vision/Behaviour, future Sound/Heart) drive non-diagnostic anomaly detection with human escalation.
