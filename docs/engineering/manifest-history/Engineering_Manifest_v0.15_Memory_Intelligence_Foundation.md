# Engineering Manifest — v0.15 Memory Intelligence Foundation

Document status: Milestone record (authoritative copy, `manifest-history/`)
Date: 12 July 2026
Branch: `feature/v0.13.0-identity-foundation`
Projected baseline after this milestone: **34 test files, ~139 tests** — *pending Christian's `npm test` / `npm run build` / `npm run release-check` run from `mars-standalone/` (shell sandbox was down this session; code written and reviewed statically, not yet executed).*

Prior baseline: v0.14.4 — 33 test files, 126 tests.

---

## 1. Why this milestone exists

First milestone of Phase 6 (Memory Intelligence). Until now, "memory" in MARS was a flat `key → value` map in `localStorage['mars_memory']` (`components/mars/memory.js`), surfaced by ChatPanel's regex remember/recall commands and the read-only Notes tab. The deterministic conversation layer only *claimed* memory in placeholder strings ("Memory Intelligence begins at v0.15", "Memory capability begins in v0.15").

v0.15 Foundation replaces that flat store with a real, schema-backed **Memory Intelligence** store, **absorbs** the Notes store into it (Christian's explicit architecture choice), and makes the conversation layer's memory statements honest — all without touching ChatPanel's working command matching.

## 2. Decisions taken into this milestone

- **Sequencing:** v0.15 scoped now. (Note: the working session-handoff snapshot claimed v0.14.4 was *paused*; the live repo showed v0.14.4 already complete and end-to-end verified. The snapshot was ~3 days stale — corrected here.)
- **Architecture:** the engine **absorbs** the `memory.js`/Notes store rather than living beside it. Chosen scope for Foundation: **Option B — store + honest read-wiring** (from the v0.15 scoping doc). Engine-driven memory *writes* and short/long-term engines are deferred to v0.15.1–v0.15.3.

## 3. Absorb, done regression-safely by structure

The new store carries a richer schema than the old flat map:

```
entry = { key, value, category, source, confidence, createdAt, updatedAt }
```

`category ∈ {personal, preference, fact, uncategorised}`, `source ∈ {user_explicit, inferred}`. In Foundation every explicit write is `uncategorised / user_explicit / 1.0`; the extra fields are inert now but leave room for v0.15.1–v0.15.3 (short/long-term engines, inferred personal context) **without another migration**.

`components/mars/memory.js` was rewritten as a **thin shim** with byte-for-byte identical public signatures (`remember`, `recall`, `recallAll`, `clearMemory`, plus `loadMemory`/`saveMemory`), delegating to `MemoryIntelligenceService`. Because `recallAll()` still returns a flat `{ key: value }` map, **ChatPanel and Control.jsx / NotesPanel were not edited at all**. That containment is the whole point of the shim.

**Loss-free migration:** on first load in the browser, if no `mars_memory_v2` store exists but the legacy `mars_memory` map does, every legacy fact is imported into the new schema (`buildEntriesFromLegacy`, a pure exported function). The legacy key is left untouched for rollback safety. Storage falls back to an in-memory store when `localStorage` is unavailable (vitest node env) — same pattern as `AIProviderConfig`.

## 4. Honest read-wiring (no overclaiming)

The `persistentMemory: false` flags on the conversation subsystems (`NaturalConversationEngine`, `ConversationContextService`, `ConversationHistoryService`, `ConversationDiagnosticsService`, `ReferenceResolver`) were **left false on purpose** — they honestly mean "this engine does not itself write persistent memory", which is still true until engine dispatch lands in v0.15.1. Flipping them would have overclaimed and broken assertions in four test files for a claim that isn't yet accurate.

What changed were only the strings that falsely implied memory *did not exist at all*, plus real reads:

- `NaturalConversationEngine` `ROUTE_TO_MEMORY` now reads the live store and reports it ("Memory Intelligence Online", real stored-fact count), and the response carries new `memoryStoreActive` / `storedFactCount` fields. `ROUTE_TO_MEMORY` is **not** in `ChatConversationBridge`'s override set, so this new text can never replace ChatPanel's real memory reply — purely a diagnostics-surface improvement.
- `ConversationPlanner` `ROUTE_TO_MEMORY` summary updated to reference the live v0.15 store.
- `CapabilityRouter` `MEMORY` case (still unwired) now returns a real read (`status: ready`, `entryCount`, `action: 'memory-read'`) instead of the "begins in v0.15" placeholder — ready for v0.15.1 to consume.

## 5. Files

**Added:**
- `services/memory/MemoryIntelligenceService.js` — authoritative store, v0.15 schema, loss-free legacy migration, remember/recall/recallAll/getEntry/getEntries/getStatus/getSnapshot/resetForTests.
- `services/memory/index.js` — public exports.
- `hooks/useMemoryIntelligence.js` — panel state hook (mirrors `useVoiceIntelligence`).
- `components/memory/MemoryIntelligencePanel.jsx` + `index.js` — honest MEM-I diagnostics panel.
- `tests/MemoryIntelligenceSmokeTest.test.js` — 13 tests incl. explicit REGRESSION GUARD block proving the shim preserves the old `remember/recall/recallAll/clearMemory` contract and the migration is loss-free.

**Modified:**
- `components/mars/memory.js` — rewritten as a delegating shim (identical public API).
- `services/conversation/NaturalConversationEngine.js` — honest `ROUTE_TO_MEMORY` read + new response fields; `persistentMemory` flags unchanged.
- `services/conversation/ConversationPlanner.js` — `ROUTE_TO_MEMORY` summary string.
- `services/conversation/CapabilityRouter.js` — `MEMORY` case → real service read.
- `pages/Control.jsx` — new **MEM-I** tab (additive; `Database` icon).
- `tests/ConversationPanelSmokeTest.test.js` — memory-turn test updated to assert the new honest title + `memoryStoreActive`, keeping the `persistentMemory: false` guard.

**Not touched (the point of the shim):** `ChatPanel.jsx` command matching, `NotesPanel.jsx`, the v0.14.4 reasoning chain, `ConversationPanel.jsx`.

## 6. Validation record

**Static review complete; execution pending Christian.** The shell sandbox was unavailable this session, so `npm test` / `npm run build` / `npm run release-check` (run from `mars-standalone/`, not the repo root) have not been run yet. Commands to validate and commit:

```
cd mars-standalone
npm test
npm run build
npm run release-check
```

Then commit on the feature branch:
```
git add -A
git commit -m "feat: v0.15 Memory Intelligence Foundation — real store, Notes absorbed via shim, honest read-wiring"
git push origin feature/v0.13.0-identity-foundation
```

Expected: prior 126 tests still green (only `ConversationPanelSmokeTest`'s memory case was intentionally updated), plus 13 new tests → ~139 total across 34 files. If anything fails, do not commit — report back.

Recommended manual UI check after tests pass: on the Chat tab, "remember my birthday is June 5th" → real memory reply; "what is my birthday" → correct recall; Notes tab shows the value; new **MEM-I** tab shows 1 fact, `uncategorised`, persistent = Active; Clear All empties both MEM-I and Notes.

## 7. Roadmap effect / what's next in Phase 6

- **v0.15.1 Short-Term Memory Engine** — wire `NaturalConversationEngine` `ROUTE_TO_MEMORY` (and `CapabilityRouter.MEMORY`, now returning a real read) to *write* through the service; session-scoped working memory. This is where the engine's `persistentMemory` flag can honestly flip.
- **v0.15.2 Long-Term Memory Engine** — consolidation, categories used in anger, forgetting/decay.
- **v0.15.3 Behaviour Learning & Personal Context** — inferred facts (`source: 'inferred'`, `confidence < 1.0`) and injection of personal context into the v0.14.4 reasoning chain (the scoping doc's Option C).

## 8. Safety boundary (unchanged)

Memory stores user-provided facts and preferences only. It does not infer, and never stores medical assessments or diagnoses. Every conversation-engine response keeps `medicalDiagnosis: false`.
