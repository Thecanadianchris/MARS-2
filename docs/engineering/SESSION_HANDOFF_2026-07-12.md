# Session Handoff — 12 July 2026 (paste this at the start of a new chat)

I'm continuing the MARS Software Project (Christian's assistive-robotics project). Read `docs/engineering/MEM-0005_Manifest_5.0_Claude_Takeover.md` and `docs/engineering/MVCH_Master_Version_Control_History.md` first — they are the living references, and the per-milestone records live in `docs/engineering/manifest-history/`. This note is the detailed "where we are / how it works / where we're going" supplement. It supersedes `SESSION_HANDOFF_2026-07-09.md`.

---

## 1. Headline state

**Phase 6 — Memory Intelligence is COMPLETE.** Six milestones built, tested, UI-verified, committed and pushed this session (v0.15 → v0.15.5). MARS previously had real AI (v0.14.4) but no persistent memory; it now has a full, person-scoped, safety-aware memory system feeding both the UI and the on-prem AI.

- **Validated baseline: 39 test files, 191 tests — Build PASS, Release Check PASS, UI PASS** (every milestone verified live in the browser, not just unit-tested).
- **Branch:** `feature/v0.13.0-identity-foundation` (still the real active branch despite the name).
- **Commits this session:** `939ca97` (v0.15 + v0.15.1), `986c4e7` (v0.15.2–v0.15.4 + doc updates), `ae544ba` (v0.15.5). A docs-only commit for the final MVCH/MEM-0005 refresh may still be pending — check `git status`.

---

## 2. What the memory system is (architecture)

All memory lives in `mars-standalone/src/services/memory/`. It is layered; each layer sits on the person-scoped store beneath it. The MEM-I tab (`components/memory/MemoryIntelligencePanel.jsx`, hook `hooks/useMemoryIntelligence.js`) is the diagnostics surface for all of it.

**`MemoryIntelligenceService` (v0.15 / v0.15.1) — the store.** Person-scoped persistent store in `localStorage['mars_memory_v3']`, shape `{ version, defaultPersonId, persons: { [personId]: { entries: {…} } } }`. Each entry: `{ key, value, category, source, confidence, createdAt, updatedAt, lastAccessedAt, accessCount }`. Keyed by `personId` (unbounded — a keyed object, no fixed number of people). `getActivePersonId()` resolves explicit → active → default (`christian`, the owner). `setActivePerson(id)` is the hook Face Recognition (v0.16) will call. Loss-free chained migration (v1 flat → v2 → v3). In-memory fallback when `localStorage` is absent (vitest node env). `recall()` bumps access for salience; `remember()` auto-classifies category and preserves confidence/source.

**`components/mars/memory.js` — compatibility shim.** Thin delegator to the store with the identical old public API (`remember/recall/recallAll/clearMemory`), so ChatPanel's typed "remember …" commands and the Notes tab were never touched. This is the pattern the whole session used: change the engine underneath, keep the surface stable.

**`WorkingMemoryService` (v0.15.2) — short-term.** Session-scoped working set for the active person. `NaturalConversationEngine.processTurn` seeds it from the person's long-term facts when the active person changes; items can be **promoted** to long-term via the first real `CapabilityRouter` memory-write dispatch (`plan.memoryOp === 'write'`).

**`MemoryClassifier` + `LongTermMemoryEngine` (v0.15.3) — long-term smarts.** Pure heuristic classifier assigns each fact a category: **`safety`** (medication/allergy/emergency/safe word — protected and ranked first), `personal`, `preference`, `fact`. The engine adds salience ranking (safety-weighted + recency + access frequency + confidence) and a **safety-aware retention policy**: explicit and safety facts are NEVER auto-forgotten; only inferred non-safety facts are ever decay-eligible, and retention ships dry-run by default (a verified no-op on real data).

**`PersonalContextService` (v0.15.4) — memory-aware AI.** Assembles the active person's identity + ranked facts and injects it into the v0.14.4 reasoning chain so MARS's spoken/LLM answers are person-aware. **Privacy posture = ON-PREM ONLY** (Christian's decision): context goes to the Local/Home tiers only; the **Cloud (Claude) tier receives no personal context**, and safety facts never leave the device. `AIReasoningService.reason()` takes an optional per-tier `personalContext`; `ChatReasoningBridge` attaches it only when non-empty (so memory-less turns are unchanged from v0.14.4).

**`InferenceParser` + `BehaviourLearningService` (v0.15.5) — behaviour learning.** MARS infers facts from conversation ("I love gardening" → likes: gardening) and from repeated behaviour-engine signals, as **confirm-gated candidates** (identity-style pending→confirmed, shown in MEM-I with Confirm/Reject). Two hard rules: **inference never creates a safety fact**, and **nothing is stored/recalled until a human confirms**. Confirmed facts are `source: 'inferred'`, confidence <1 — the first real users of the v0.15.3 decay path. `NaturalConversationEngine.processTurn` and `useBehaviourIntelligence` call the observers silently (never alter a reply).

**Multi-user model (built earlier, now the memory join key).** `services/identity/PersonRegistry` holds people (`christian` OWNER, `ann` TRUSTED_USER, `finley` PROTECTED_USER) in an unbounded Map with a `pending → confirmed` flow — the exact hook Face Recognition plugs into. `services/users/` holds roles/permissions (`RECEIVE_PROTECTED_USER_ALERTS` etc.). `personId` is the universal join key across identity, memory, per-person baselines, and (future) alerting.

---

## 3. Safety rules established this session (carry forward)

- `medicalDiagnosis: false` on every engine response — unchanged, non-negotiable.
- **`safety` category facts never leave the device** (not to any cloud AI, ever) and are never auto-forgotten.
- **Inference never creates a safety fact** — care-critical data (medication, allergy, emergency contact, safe word) must always be human-provided and, for inferred facts, human-confirmed.
- The product framing for the monitor→check-in→escalate use case is **non-diagnostic anomaly detection + human escalation**: MARS flags "this looks different from your normal, are you OK?" and escalates to a human; it never diagnoses. Heart-rate/health alerting should stay framed as a wellbeing aid, not a medical device, and warrants proper regulatory guidance before any health claims.

---

## 4. Regression discipline (why nothing broke across 6 milestones)

Every milestone kept ChatPanel's typed remember/recall commands as the **sole automatic writer for typed chat**, and added new behaviour additively with explicit REGRESSION GUARD tests. The engine observes/seeds/reads but never writes memory on a turn (guard test: an inferrable or memory-style message leaves `entryCount === 0`). Which turns escalate to the AI never changed. The store's on-disk shape is additive. This is the pattern to keep for v0.16+.

---

## 5. Operational facts (needed to run/verify anything)

- App lives in `02 - Software/Mars 2/mars-standalone/` — all npm commands run from there: `npm run dev`, `npm test`, `npm run build`, `npm run release-check` (= test + build).
- **Claude's sandbox/shell has been down all session** (VM connection timeout) — so: tests/build/git are handed to Christian to paste into PowerShell, and UI verification is done by Claude via browser automation against the running `npm run dev` server (localhost:5173). Direct file read/write and Chrome automation work fine.
- AI reasoning chain (from v0.14.4): Ollama on this laptop (`qwen3.5:4b`) reached via the same-origin `/ollama` Vite proxy (never call `localhost:11434` directly — CORS); `think:false`, 60s timeout. Claude API key is runtime-entered in the AI Status panel, stored in browser localStorage per-origin (tied to `http://localhost:5173`). No keys in repo or bundle.
- Workflow gates (unchanged): scope → present risk-tiered options → Christian decides → build → `release-check` + manual UI verification → commit (one manifest per milestone into `manifest-history/`) → push to the feature branch.
- MEM-I tab sections, top to bottom: header (People/Facts/Backed/Version + Retention line), Categories, Working Memory (session), Personal Context → AI (on-prem-only), Learned Candidates (Confirm/Reject), Stored Memory by Person (safety highlighted), Safety Boundary.

---

## 6. Where we're going (version path)

1. **v0.16 Face Recognition — NEXT (Phase 7).** The natural next milestone. It makes "the active person" real from the camera: resolve a detected face → `personId` (or a pending profile a trusted user confirms) → call `MemoryIntelligenceService.setActivePerson(personId)`. At that point personal context, working-memory seeding, and behaviour learning all automatically follow whoever MARS identifies, instead of defaulting to the owner. Scope it against the existing `PersonRegistry` pending→confirmed flow, same scope-first workflow.
2. **Phase 8 — v0.17.x Protected User Alerting.** This is where the monitor→"are you OK?"→escalate-to-caregivers flow lives (Risk Assessment → Alert Routing & Escalation → Monitoring Dashboard). Building blocks exist (Decision engine, Notification engine, notification targets incl. `trusted_contact`) but the escalation state machine and real alert delivery are stubs.
3. Phase 9 — v0.18.x Robot Control (Bluetooth/movement/navigation). Phase 10 — v0.19.x Android Robot Application (v0.19.3 now just means replacing the LocalProvider stub with a real on-device model, since the reasoning chain already exists). Phase 11 — v0.20.x → Mk1 Production Release.

**Gaps worth naming for the monitoring vision:** the three sensing signals Christian described are unevenly built — body-position/behaviour (Visual) is largely there via the vision/behaviour stack (currently simulation-driven; "baseline learning" is a planned capability); **odd-sound (acoustic anomaly) detection does not exist** and isn't its own roadmap phase yet; **heart-rate monitoring does not exist** (only referenced as a future Galaxy Watch integration). Per-person statistical baselines for these belong in the Behaviour/Vision layers (keyed by `personId`), distinct from the fact store.

---

## 7. Small open items (not blockers)

- `CapabilityRouter.js` performs a real memory write when dispatched, but is still not wired into the live turn loop for anything else — decision deferred; revisit if/when the engine should route more capabilities through it.
- `main` branch was behind the feature branch at the last GitHub check — fast-forward merge commands were given to Christian; confirm it happened.
- ~~Repo has no root README~~ — corrected 13 July: `mars-standalone/README.md` does exist (documents the Base44-stripped standalone rebuild). This note was stale.
- A production build served outside `vite dev`/`vite preview` will need its own `/ollama` proxy equivalent — deferred to the deployment phase by design.
- The Claude.ai MARS project knowledge was re-synced on 12 July (updated MVCH + MEM-0005 uploaded, stale duplicates removed) so a fresh chat there starts from current state.
