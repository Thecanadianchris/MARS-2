# Session Handoff — 12 July 2026 (paste this at the start of a new chat)

I'm continuing the MARS Software Project (Christian's assistive-robotics project). Read `docs/engineering/MEM-0005_Manifest_5.0_Claude_Takeover.md` and `docs/engineering/MVCH_Master_Version_Control_History.md` first — they are the living references. This note is the short "where we are / where we're going" supplement. It supersedes `SESSION_HANDOFF_2026-07-09.md`.

## Where we are

**Last completed milestone: v0.14.4 — AI Reasoning Layer.** MARS now has real AI, verified live end-to-end. The escalation chain is: Local (S22 on-device — honest stub until v0.19.x) → Home (Ollama on the Snapdragon X base station) → Cloud (Claude API, or ChatGPT/Gemini/other via a provider dropdown). Chat escalates only turns it can't answer itself; memory commands are structurally protected. Both live tiers have been observed answering for real (details + debugging record in the v0.14.4 manifest in `manifest-history/`).

**Validated baseline:** 33 test files, 130 tests, Build PASS, Release Check PASS, UI PASS.

**Repo state:** all work committed and pushed to `feature/v0.13.0-identity-foundation` (latest: `738bf65`, repo-hygiene commit — removed shadowed duplicate modules `services/voice.js` and `services/capabilityState/`, renamed the `index (1).js` barrel). Full structural review done 12 July: docs layout, gitignore coverage, and src tree all verified clean. GitHub checked directly the same day.

## Operational facts (needed to run/verify anything)

- App lives in `02 - Software/Mars 2/mars-standalone/` — all npm commands run from there (`npm run dev`, `npm test`, `npm run release-check`).
- Ollama runs on this laptop (model `qwen3.5:4b`), reached from the app via the same-origin `/ollama` Vite proxy (dev + preview) — never call `localhost:11434` directly from the browser (CORS). Requests send `think:false` (it's a thinking model), 60s timeout.
- Claude API key is runtime-entered in the MARS Intelligence panel (Dashboard/CTRL tab), stored in browser localStorage per-origin — it lives against `http://localhost:5173`, so a dev server on another port won't see it. Optional `.env.local` with `VITE_CLOUD_AI_KEY` seeds it. No keys in repo or bundle, ever.
- Workflow gates (unchanged): release-check + manual UI verification before commit; one manifest per milestone into `docs/engineering/manifest-history/`; new work lands on the feature branch.
- Claude's sandbox/shell has been unreliable across sessions — commands get handed to Christian to paste into PowerShell; UI verification happens via browser automation on the dev server.

## Where we're going (version path)

1. **v0.15 Memory Intelligence Foundation — NEXT.** Two decisions to make at scoping, both recorded in MEM-0005 §6: (a) should `NaturalConversationEngine` start dispatching through the built-but-unwired `CapabilityRouter.js`; (b) does v0.15 absorb the existing Notes/localStorage store (`components/mars/memory.js`) or build alongside it (the `ChatReasoningBridge` deliberately excludes memory routing pending this).
2. v0.15.1–v0.15.3: Short-Term Memory, Long-Term Memory, Behaviour Learning & Personal Context.
3. Phase 7: v0.16.x Face Recognition. Phase 8: v0.17.x Protected User Alerting. Phase 9: v0.18.x Robot Control (Bluetooth/movement/navigation). Phase 10: v0.19.x Android Robot Application — where v0.19.3 now means replacing the LocalProvider stub with a real on-device model, since the reasoning chain already exists. Phase 11: v0.20.x → Mk1 Production Release.

## Small open items (not blockers)

- `main` was 7 commits behind the feature branch at last GitHub check — fast-forward merge commands were given to Christian; confirm it happened, otherwise re-run.
- Repo has no root README (GitHub prompt visible) — optional, offered but not yet written.
- A production build served outside `vite dev`/`vite preview` will need its own equivalent of the `/ollama` proxy — deferred to the deployment phase by design.
