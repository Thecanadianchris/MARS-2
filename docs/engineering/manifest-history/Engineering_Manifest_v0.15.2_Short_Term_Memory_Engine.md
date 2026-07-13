# Engineering Manifest — v0.15.2 Short-Term Memory Engine

Document status: Milestone record (authoritative copy, `manifest-history/`)
Date: 12 July 2026
Branch: `feature/v0.13.0-identity-foundation`
Projected baseline after this milestone: **36 test files, ~162 tests** — *pending Christian's `npm test` / `npm run build` / `npm run release-check` from `mars-standalone/` (shell sandbox down this session; code written and statically reviewed, not executed).*

Prior baseline: v0.15.1 — 35 files, 155 tests.

---

## 1. Why this milestone exists

v0.15 gave MARS a person-scoped long-term store; the conversation layer already had short-lived session/context/history. The two didn't talk to each other, and the engine had no memory-*write* path. v0.15.2 builds the **bridge** (Option B, confirmed by Christian):
- **Seed** the session working set from the active person's long-term facts, so MARS has them "in mind" during a conversation.
- **Promote** working items back to long-term through the first genuine **CapabilityRouter write dispatch**.

## 2. Correction to the scope's "voice gains memory" framing

The scoping doc suggested v0.15.2 would give the voice path memory. On inspection, `services/voice/` is a **fixed simulated command catalogue** (wake/status/help/cancel intents), and **free-form spoken "remember my X" already flows through ChatPanel** via `VoiceInput → sendMessage`, which since v0.15.1 writes person-scoped memory. So spoken free-form memory already worked; there was no real gap to close in the simulated voice command layer, and it was deliberately left untouched. v0.15.2's genuine additions are the working-memory bridge and the real router write path.

## 3. What was built

**`services/memory/WorkingMemoryService.js` (new)** — session-scoped, single active person:
- `seedForPerson(personId)` — loads `MemoryIntelligenceService.getEntriesForPerson(personId)` into an in-memory working set (origin `long_term`). Read-only; persists nothing.
- `note(key, value)` — adds a short-term working item (origin `working`, not persisted).
- `promote(key, { personId })` — writes a working item to long-term via `CapabilityRouter.route({ plan: { capability:'memory', memoryOp:'write', payload } })`; marks it `promoted`.
- `noteAndPromote`, `getWorkingSet`, `getStatus`, `getSnapshot`, `clear`, `resetForTests`.

**`CapabilityRouter.js`** — the still-unwired-elsewhere router now performs a **real memory write** when `plan.memoryOp === 'write'` (`action: 'memory-write'` → `MemoryIntelligenceService.remember`). Read remains the default. This is the first genuine capability dispatch through the router.

**`NaturalConversationEngine.js`** — on each turn, seeds working memory when the active person changes (incl. first turn); this is **read-only** (copies long-term → working set) so chat replies are unaffected. `reset()` clears working memory; `getStatus()` surfaces `workingMemory`.

**MEM-I panel** — new read-only "Working Memory (session)" section: active person, Seeded / Items / Promoted counts, and the working items with their origin. Hook `useMemoryIntelligence` now also returns the working-memory snapshot.

## 4. Regression safety

The one risk was engine writes colliding with ChatPanel's typed commands. Held by structure:
- The engine's per-turn `processTurn` **never writes** to long-term — it only seeds/reads working memory. Explicit **REGRESSION GUARD** test: `processTurn('remember my secret code is 4242')` leaves `entryCount === 0`.
- Promotion is always an **explicit** `promote()` / router `memory-write` call, never a side effect of a chat turn. ChatPanel's typed remember/recall commands remain the sole automatic writer for typed chat and were not touched.
- No inference: promotions carry the caller's `source` (defaults to `user_explicit`); inferred facts remain a v0.15.4 concern.

## 5. Files

**Added:** `services/memory/WorkingMemoryService.js`, `tests/WorkingMemorySmokeTest.test.js` (seed, note, promote-via-router, `noteAndPromote`, router read-vs-write, engine-writes-nothing regression guard).

**Modified:** `services/memory/index.js` (export `WorkingMemoryService`, `ITEM_ORIGIN`), `services/conversation/CapabilityRouter.js` (memory-write dispatch + read summary now person-aware), `services/conversation/NaturalConversationEngine.js` (seed on active-person change, clear on reset, `workingMemory` in status), `hooks/useMemoryIntelligence.js` (+working snapshot), `components/memory/MemoryIntelligencePanel.jsx` (Working Memory section).

**Not touched:** `ChatPanel.jsx`, `components/mars/memory.js` shim, Notes tab, the voice command layer, the v0.14.4 reasoning chain. Feeding working memory into the reasoning chain (memory-aware LLM answers) was deliberately deferred to v0.15.4.

## 6. Validation

Run from `mars-standalone/`:
```
npm test
npm run build
npm run release-check
```
Expected: prior 155 green plus the new working-memory suite → ~36 files / ~162 tests. Then:
```
git add -A
git commit -m "feat: v0.15.2 short-term working memory + CapabilityRouter memory-write dispatch"
git push origin feature/v0.13.0-identity-foundation
```

Recommended UI check: with `favourite colour: red` stored for the owner, open the CONV tab (sends a turn, seeds working memory), then MEM-I → "Working Memory (session)" shows active person `christian`, Seeded ≥ 1, and the seeded item with origin `long_term`.

## 7. What's next in Phase 6

- **v0.15.3 Long-Term Memory Engine** — consolidation, categories in use, per-person forgetting/decay.
- **v0.15.4 Behaviour Learning & Personal Context** — inferred facts (`source: 'inferred'`) and feeding per-person memory into the v0.14.4 reasoning chain (the deferred Option C).
- **v0.16 Face Recognition** — calls `setActivePerson`, which now also triggers the working-memory seed on the next turn.

## 8. Safety boundary (unchanged)

`medicalDiagnosis: false` everywhere. Working memory holds user-provided facts for the active person only; promotions are explicit, never inferred; no health assessment is stored or spoken.
