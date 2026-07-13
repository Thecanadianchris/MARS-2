# Engineering Manifest — v0.15.4 Personal Context (Memory-Aware AI)

Document status: Milestone record (authoritative copy, `manifest-history/`)
Date: 12 July 2026
Branch: `feature/v0.13.0-identity-foundation`
Projected baseline after this milestone: **38 test files, ~181 tests** — *pending Christian's `npm test` / `npm run build` / `npm run release-check` from `mars-standalone/` (shell sandbox down this session; code written and statically reviewed, not executed).*

Prior baseline: v0.15.3 — 37 files, ~174 tests (built, commit pending).

---

## 1. Why this milestone exists

Closes the "Personal Context" half of the roadmap's v0.15.4 (Behaviour Learning & Personal Context) — the long-deferred "Option C" from the original v0.15 scope. MARS now feeds the active person's memory into the v0.14.4 reasoning chain so its escalated (LLM) answers are person-aware. Scope chosen: **Option A — Personal Context only** (no inference this milestone; Behaviour Learning is a focused follow-up).

## 2. THE decision: privacy posture = ON-PREM ONLY

The reasoning chain escalates Local → Home → **Cloud (Claude API over the internet)**. Christian's decision, implemented as a hard rule:

- Personal context is injected for the **on-prem tiers only** (Local + Home, on your own hardware).
- The **Cloud tier receives NO personal context** — `PersonalContextService.buildContext(..., { tier: 'cloud' })` always returns `''`.
- **Safety-category facts therefore never leave the device** under any circumstance.

This is enforced structurally (the cloud key is always empty) and guarded by tests, not left to convention.

## 3. What was built

**`services/memory/PersonalContextService.js` (new)** — assembles a per-person context block from `PersonRegistry` identity + `LongTermMemoryEngine.getRankedEntriesForPerson` (salience-ranked, so safety facts lead), flagging safety-critical facts. `buildContext(personId, { tier })` returns the block for `onPrem` and `''` for `cloud`. `buildTierBundle` returns `{ onPrem, cloud }`; `getPreview` powers the panel and reports `cloudPosture: 'on_prem_only'` and `sentToCloud: false`.

**`services/ai/AIReasoningService.js`** — `reason()` now accepts an optional `personalContext` and builds a **per-tier system prompt**: Local + Home get `system + onPrem`, Cloud gets `system + cloud` (empty). Passing no `personalContext` is byte-identical to v0.14.4 behaviour.

**`services/conversation/ChatReasoningBridge.js`** — on an escalation, builds the tier bundle for the active person and passes it to `reason()` **only when non-empty**, so a memory-less turn calls `reason({ prompt })` exactly as before.

**MEM-I panel** — new "Personal Context → AI" section: shows the exact on-prem context block MARS would send, an "on-prem only" lock badge, and an explicit "To cloud (Claude): nothing" line with the device-locked safety count.

## 4. Regression safety

- **Which turns escalate is unchanged** — still only generic-fallback turns (v0.14.4 guarantee). v0.15.4 only changes *what the prompt contains* on those turns.
- **Memory-less turns unchanged** — context is attached only when non-empty, so `ChatReasoningBridge`'s existing behaviour and the v0.14.4 test (`reason` called with exactly `{ prompt }`) still hold; a REGRESSION GUARD test re-asserts it.
- **`reason()` is additive** — `personalContext` defaults to null → identical provider calls, so the v0.14.4 AI reasoning tests are unaffected.
- **Privacy guard tests** — the cloud context is always `''` even with safety/allergy facts stored.

## 5. Files

**Added:** `services/memory/PersonalContextService.js`, `tests/PersonalContextSmokeTest.test.js` (assembly, on-prem-only cloud guard, safety-device-locked, bridge injection + memory-less regression guard).

**Modified:** `services/ai/AIReasoningService.js` (per-tier system prompt), `services/conversation/ChatReasoningBridge.js` (inject on-prem context when present), `services/memory/index.js` (exports), `hooks/useMemoryIntelligence.js` (personal-context preview), `components/memory/MemoryIntelligencePanel.jsx` (Personal Context section).

**Not touched:** ChatPanel typed-command authority, the shim, which turns escalate, the store's on-disk shape.

## 6. Validation

Run from `mars-standalone/`:
```
npm test
npm run build
npm run release-check
```
Expected ~38 files / ~181 tests. Then:
```
git add -A
git commit -m "feat: v0.15.4 personal context — memory-aware on-prem AI, cloud receives no personal data"
git push origin feature/v0.13.0-identity-foundation
```
(v0.15.2 + v0.15.3 are still uncommitted; this would include them unless committed separately first.)

Recommended UI check: with a fact stored for the owner, open MEM-I → "Personal Context → AI" shows the on-prem block and "To cloud (Claude): nothing". (A full end-to-end LLM check needs the Home/Ollama tier running.)

## 7. What's next in Phase 6 / beyond

- **Behaviour Learning** (the other half of v0.15.4's roadmap name) — inferred-fact candidates with a confirm-to-store flow, never creating safety facts, exercising the v0.15.3 decay path. Deferred to a focused follow-up (v0.15.5 or reopened v0.15.4b).
- **v0.16 Face Recognition** — `setActivePerson` will make "the active person" real from the camera; personal context then follows whoever MARS is looking at.

## 8. Safety & privacy boundary

`medicalDiagnosis: false` everywhere; the shared reasoning system prompt still forbids medical advice. New reinforced rule: **personal context is on-prem only and safety facts never leave the device.** Personal context is a personalisation aid for MARS's own on-device/home reasoning, not data shared with any third party.
