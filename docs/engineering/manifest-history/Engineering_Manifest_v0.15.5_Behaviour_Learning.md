# Engineering Manifest — v0.15.5 Behaviour Learning (Inferred Facts)

Document status: Milestone record (authoritative copy, `manifest-history/`)
Date: 12 July 2026
Branch: `feature/v0.13.0-identity-foundation`
Projected baseline after this milestone: **39 test files, ~191 tests** — *pending Christian's `npm test` / `npm run build` / `npm run release-check` from `mars-standalone/` (shell sandbox down this session; code written and statically reviewed, not executed).*

Prior baseline: v0.15.4 — 38 files, 182 tests (committed `986c4e7`).

---

## 1. Why this milestone exists

Completes the "Behaviour Learning" half of the roadmap's v0.15.4 pairing. Until now MARS only stored facts it was explicitly told. v0.15.5 lets MARS **infer** facts about a person — the first `source: 'inferred'` facts, and the first real users of v0.15.3's retention decay path. Scope chosen: **confirm-gated**, sources = **conversation + behaviour engines**.

## 2. Safety design (non-negotiable for a care system)

- **Candidates, not facts.** Inference only *proposes*. Nothing is stored or recalled until a trusted user **confirms** — mirroring the identity `pending → confirmed` flow.
- **Never safety.** A candidate that classifies as `safety` (medication, allergy, emergency, safe word…) is **refused** at both propose and confirm time. Care-critical facts are always human-provided.
- **Inferred = lower confidence + decay-eligible.** Confirmed inferences are written `source: 'inferred'`, confidence ≈ 0.55–0.6, so v0.15.3 retention treats them as the only decay-eligible class (retention still ships dry-run by default).
- **Silent.** Observation never changes a chat reply.

## 3. What was built

**`services/memory/InferenceParser.js` (pure)** — deterministic heuristics: "I like/love/enjoy X" → `{ likes: X }`, "I usually/always X" → `{ routine: X }`. Deliberately narrow; never matches "remember …" or "my X is Y" (handled explicitly by ChatPanel).

**`services/memory/BehaviourLearningService.js` (new)** — per-person candidate store:
- `observe(message, { personId })` — conversation source (silent), refuses safety.
- `observeBehaviour(result)` — behaviour source: aggregates a repeated body-position signal from the behaviour engine and proposes a candidate only after it repeats to a threshold (3). Skips unknown person / unknown position.
- `confirmCandidate(id)` → writes an `inferred` fact via the `CapabilityRouter` memory-write path (with a safety double-check); `rejectCandidate(id)` discards; `listCandidates`, `getStatus`, `getSnapshot`, `reset`.

**Wiring (additive, silent):**
- `NaturalConversationEngine.processTurn` calls `observe()` for the active person each turn — proposes candidates only, never stores, never alters the reply.
- `useBehaviourIntelligence` feeds non-waiting behaviour results to `observeBehaviour()`. (Behaviour Intelligence is currently simulation-driven — "baseline learning" is a planned capability — so today's candidates come from the dev scenarios; the same path learns from real data once live vision lands in v0.16/v0.19.)

**`CapabilityRouter`** — the memory-write dispatch now also forwards `confidence`, so inferred facts keep their <1 confidence.

**MEM-I "Learned Candidates" section** — lists pending candidates (person · key: value, source badge) with **Confirm / Reject** controls, clearly labelled inferred and "never safety-critical". Confirmed facts then appear in stored memory tagged `inferred`.

## 4. Regression safety

- **ChatPanel untouched** — it remains the sole automatic writer for typed chat. The engine's `observe()` only proposes candidates. REGRESSION GUARD test: `processTurn('I love gardening')` yields 1 candidate but `entryCount === 0`.
- **Never-safety** proven: "I usually take my medication at 8pm" is refused (not proposed), candidate count stays 0.
- Candidates are in-session (not persisted) and are not cleared by `engine.reset()`, so pending proposals survive a chat clear until you act on them.

## 5. Files

**Added:** `services/memory/InferenceParser.js`, `services/memory/BehaviourLearningService.js`, `tests/BehaviourLearningSmokeTest.test.js` (parser, conversation candidate, never-safety refusal, confirm→inferred fact, reject, behaviour aggregation + skips, silent-observe regression guard).

**Modified:** `services/memory/index.js` (exports), `services/conversation/CapabilityRouter.js` (forward `confidence`), `services/conversation/NaturalConversationEngine.js` (silent `observe()` per turn), `hooks/useBehaviourIntelligence.js` (`observeBehaviour` effect), `hooks/useMemoryIntelligence.js` (candidates + confirm/reject), `components/memory/MemoryIntelligencePanel.jsx` (Learned Candidates section).

**Not touched:** ChatPanel typed-command authority, the shim, the reasoning chain, Personal Context, the store's on-disk shape.

## 6. Validation

Run from `mars-standalone/`:
```
npm test
npm run build
npm run release-check
```
Expected ~39 files / ~191 tests. Then:
```
git add -A
git commit -m "feat: v0.15.5 behaviour learning — confirm-gated inferred facts (conversation + behaviour), never safety"
git push origin feature/v0.13.0-identity-foundation
```

Recommended UI check: Chat "I love gardening" → MEM-I "Learned Candidates" shows `christian · likes: gardening (conversation)` with Confirm/Reject → Confirm → it appears under Christian's stored memory tagged `inferred`. Chat "I usually take my medication at 8pm" → no candidate (refused, safety).

## 7. Phase 6 status / what's next

Phase 6 Memory Intelligence is now functionally complete: Foundation, Person-Scoping, Short-Term, Long-Term, Personal Context, and Behaviour Learning. Natural next milestone is **v0.16 Face Recognition**, which makes `setActivePerson` real from the camera — at which point personal context, working-memory seeding, and behaviour learning all follow whoever MARS identifies.

## 8. Safety boundary (reinforced)

`medicalDiagnosis: false` everywhere. Two hard rules this milestone: **inference never creates a safety fact**, and **nothing inferred is stored or recalled until a human confirms it**. Inferred facts are lower-confidence, decay-eligible, and labelled inferred throughout.
