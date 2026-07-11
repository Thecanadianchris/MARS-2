# Session Handoff — 9 July 2026 (paste this at the start of a new chat)

I'm continuing work on the MARS Software Project (Christian's assistive-robotics project). Here's what was established in the prior session — please read `docs/engineering/MEM-0005_Manifest_5.0_Claude_Takeover.md` and `docs/engineering/MVCH_Master_Version_Control_History.md` in the `Mars 2` repo first (also uploaded to this project's knowledge), then use this as supplementary context for anything not captured there.

## What was done last session

- Took over engineering continuity from ChatGPT. Reviewed the actual local codebase directly (not just docs) to verify project state.
- Found the real active codebase: `02 - Software/Mars 2/mars-standalone/` (NOT the `archive/` folder, which is an old pre-refactor Base44 build).
- Verified git state: local branch `feature/v0.13.0-identity-foundation` matches GitHub's version of that branch exactly (commit `926ed91c...`). `main` on GitHub is stale, frozen around v0.12 — a branch-hygiene issue, not a data-loss risk.
- Read real source files (`App.jsx`, `Control.jsx`, `NaturalConversationEngine.js`, `package.json`) and confirmed they match the documented architecture and workflow.
- Found a second, more accurate manifest trail inside `mars-standalone/docs/` (separate from the old, stale `docs/engineering/manifest/` MEM-0001–0004 series) and consolidated all 12 `.md` files from it into `docs/engineering/manifest-history/`.
- Created `MEM-0005_Manifest_5.0_Claude_Takeover.md` — the new clean-start reference document, code-verified.
- Uploaded `MEM-0005` and `MVCH_Master_Version_Control_History.md` to the MARS project's knowledge on claude.ai.

## Current project state (short version)

Last fully complete milestone: v0.14.1.1 (Voice Response Layer). In progress: v0.14.2 (Natural Conversation Engine), baseline 28 test files / 95 tests, all passing. Next planned: v0.14.3 Voice Diagnostics & Audio Pipeline, then v0.15 Memory Intelligence. Full roadmap through v0.20.4 (Mk1 production release) is in the MVCH.

## Known open items (not yet resolved)

- `CapabilityRouter.js` already exists in code under `services/conversation/`, but the v0.14.2 Step 1 manifest didn't scope it — status unconfirmed, don't assume it's wired in.
- "Memory" tab in the UI is a simple localStorage chat-history store — naming collision with the future v0.15 Memory Intelligence engine. Should be renamed before v0.15 work starts.
- `main` branch on GitHub should be merged/rebased from the feature branch at some point so the default branch isn't stale.
- 2 `.docx` files (`Engineering_Manifest_v0.13.6_Diagnostics_Stabilisation.docx`, `MARS_Software_Engineering_Handover_v4.1_v0.13.6_Update.docx`) are still sitting in `mars-standalone/docs/` and haven't been moved into the consolidated `manifest-history/` folder — this was blocked because my sandbox/shell environment was unavailable all of last session.
- Christian created a `docs/chat gbt docs Archive/` folder himself and moved the old v4.0 handover, old MEM-0001–0004 manifests, version packs, and release notes there — correctly. But `MVCH_Master_Version_Control_History.md` got swept into that same archive folder by mistake; it's a living document, not a superseded one, and ideally should be moved back to `docs/engineering/` (it was already uploaded to claude.ai project knowledge regardless, so that part isn't affected).

## Suggested but not yet built

Christian and I discussed adding these as further living reference docs, same pattern as the MVCH, but none exist yet: a Known Issues & Risk Register (consolidating recurring notes like the Vite bundle-size warning), a Test & Validation Matrix (test counts per milestone over time), a canonical Safety Boundary statement (the "non-medical, no diagnosis" framing currently gets restated in nearly every manifest), Architecture Decision Records (ADRs), and a written Branch & Release Strategy.

## Environment notes

My sandbox/shell environment was unreliable or fully down for most of last session — if file-move or code-execution tasks fail, that may still be the case; check before assuming it's a permissions issue.

## Update — later same session (doc-housekeeping audit, still 9 July 2026)

Came back into this same project later in the day specifically to do the doc-housekeeping open items. Sandbox/shell was down again the entire time (same "VM connection timeout" failure as before) — could only use direct file read/write, no move/delete/copy of binaries. So this pass was audit-only; no files were actually moved. Findings, so the next session doesn't have to re-derive this:

**Already done, contrary to what Section 7 of MEM-0005 assumed was still pending** — Christian's `docs/chat gbt docs Archive/` folder already contains: the old MEM-0001–0004 series + `MANIFEST_INDEX.md` + `MSER-004_Architecture_Freeze_v0.13.docx` (under `engineering/manifest/` inside the archive folder), the full v4.0 Handover volumes (under `MARS_Software_Engineering_Handover_v4.0/Maniffest 4.0/`, plus a `MARS_Software_Engineering_Handover_Volumes_v0.14.2.zip`), and all four version-specific handover packs / release notes (13.4→13.5, 13.5→13.6 Update Pack, 13.6→14.0, and `MARS_Release_Notes_v0.13.6.docx`). Nothing needs to happen here.

**Still genuinely open — exact move list for next session (needs shell/bash, not just file read/write):**
1. Move `docs/chat gbt docs Archive/engineering/MVCH_Master_Version_Control_History.md` → `docs/engineering/MVCH_Master_Version_Control_History.md` (bring the living doc back out of archive).
2. Move 6 files from `docs/engineering/` → `docs/chat gbt docs Archive/` (they're live but superseded, same as the other Handover volumes already archived): `MARS_Software_Engineering_Handover_v4.1_Volume_1_Executive_Summary_Project_Vision.docx`, `..._Volume_2_Complete_Software_Architecture.docx`, `..._Volume_3_Current_Source_Tree_and_Services.docx`, `..._Volume_4_Version_History_and_Engineering_Manifest.docx`, `..._Volume_5_Roadmap_Workflow_Future_Development.docx`, `MARS_Software_Engineering_Handover_v4.1_Combined_Master.docx`.
3. Move 2 files from `docs/engineering/` → `docs/chat gbt docs Archive/`: `MARS_Software_Engineering_Handover_v4.2_Combined_Master.docx` and the matching `.md`.
4. Move 2 `.docx` files from `mars-standalone/docs/` → `docs/engineering/manifest-history/`: `Engineering_Manifest_v0.13.6_Diagnostics_Stabilisation.docx`, `MARS_Software_Engineering_Handover_v4.1_v0.13.6_Update.docx` (carried over from last session, still not done).
5. New finding — clean up now-redundant duplicates left behind after the manifest-history consolidation: `mars-standalone/docs/engineering/` still has the original copies of 10 of the 12 files now in `manifest-history/` (`MARS_v0.13.0/1/2/3`, `M2_Diagnostics_UI_Integration`, `Handover_Update_v0.14.1`, `Replacement_Instructions_v0.14.1`, `Engineering_Manifest_v0.14.1_Wake_Word_Command_Routing`, `Replacement_Instructions_v0.14.2_Step_1`, `Engineering_Manifest_v0.14.2_Step_1_Natural_Conversation_Engine`), and `mars-standalone/docs/` still has 2 duplicate `.md` files (`Engineering_Manifest_v0.14.1.1_Voice_Response_Layer.md`, `Handover_Update_v0.14.1.1.md`). Recommend deleting these originals once `manifest-history/` is confirmed as the authoritative copy — decide whether `mars-standalone/docs/` should just be emptied out entirely going forward in favor of the repo-level `docs/engineering/`.

Recommend starting the next session by testing shell access first, before anything else — if it's up, items 1–5 above are a straightforward batch of `mv` operations.

## Update — same day, doc-housekeeping completed via screen control

Shell sandbox stayed down for the rest of the day, so items 1–5 above were executed via computer-use screen control (File Explorer cut/paste and delete) instead of `mv`/`rm`. All done and verified by re-listing the folders afterward:

1. `MVCH_Master_Version_Control_History.md` moved back to `docs/engineering/`. Confirmed present there, confirmed gone from the archive folder.
2. The 6 Handover v4.1 files and 2 Handover v4.2 files (8 total) moved from `docs/engineering/` into `docs/chat gbt docs Archive/`. Confirmed `docs/engineering/` now contains only MEM-0005, MVCH, SESSION_HANDOFF, and `manifest-history/`.
3. The 2 remaining `.docx` files moved from `mars-standalone/docs/` into `docs/engineering/manifest-history/`, which now holds all 14 files (12 original consolidated `.md` + these 2 `.docx`).
4. The 12 redundant duplicate files (10 in `mars-standalone/docs/engineering/`, 2 in `mars-standalone/docs/`) were deleted. `mars-standalone/docs/` is now empty of manifest content — `manifest-history/` in the main repo is the sole authoritative copy going forward.

Doc-housekeeping open items from Section 6/7 of MEM-0005 are now fully resolved. Remaining open items are the non-doc ones: confirm `CapabilityRouter.js` status, resolve the Memory naming collision, merge `main` from the feature branch, continue v0.14.2 — all of these need actual code/git access, not just file moves, so still worth testing shell access first next time.

## Update — same day, code-side items (sandbox still down, worked around it)

Shell sandbox never came back up this session (tried 4+ times). Two of the four remaining open items got resolved anyway, without it:

**`CapabilityRouter.js` status — confirmed, resolved.** Read the file directly and grepped the whole `mars-standalone/src/` tree for `CapabilityRouter`: the only match is the file itself. Nothing imports or instantiates it. Read `NaturalConversationEngine.js` directly too — `processTurn()` builds a plan via `ConversationPlanner` and then hand-writes the response text with a local `switch` on `plan.action`; it never calls `CapabilityRouter.route()`. The v0.14.2 Step 1 manifest's "Added Services" list also doesn't include it. Conclusion: it's finished, self-contained scaffolding (capability dispatcher with placeholders for vision/memory/identity/robot) but genuinely disconnected — not wired into the app anywhere. Decide during v0.14.3 planning whether `NaturalConversationEngine` should start dispatching through it.

**`main` branch merge — done and pushed.** Verified via the raw git refs (`.git/refs/heads/main`, `.git/refs/remotes/origin/main`, `.git/refs/heads/feature/v0.13.0-identity-foundation`) that local main and origin/main were both at `634135c` and not diverged from the feature branch — just behind. Gave Christian the merge commands to run himself (since typing into terminal apps is blocked for screen-control tools even when the sandbox is down): `git checkout main && git pull origin main && git merge feature/v0.13.0-identity-foundation && git push origin main`. Fast-forward, no conflicts, confirmed pushed: `634135c..926ed91 main -> main`. `main` on GitHub now matches the feature branch exactly.

**Workaround pattern established for when the sandbox is down:** file moves/deletes → computer-use + File Explorer (cut/paste, delete, reliably via right-click context menu — keyboard shortcuts like Ctrl+X/Ctrl+L were inconsistent through the batched tool, right-click menu items were not). Git operations and test/build runs → read-only investigation (git refs, source files, grep) still works fine via direct file access; anything that needs to actually run a command (`npm test`, `git push`, etc.) gets handed to Christian as exact commands to paste into his own terminal, since terminal apps are locked to a tier that blocks typing/right-click even when granted.

**Memory naming collision — resolved.** Investigated scope first: `services/conversation/ConversationPlanner.js` and `CapabilityRouter.js` already use the string `'memory'` as the identifier for the real, future v0.15 Memory Intelligence capability (`CAPABILITY_TARGETS.MEMORY`), so the Control.jsx tab reusing `'memory'` as its own tab key was a collision at the code level too, not just a UI label problem. Scoped the fix narrowly: renamed only the UI-facing layer — `MemoryPanel.jsx` → `NotesPanel.jsx` (title "MARS Notes", button "Clear Notes"), the Control.jsx tab key `'memory'` → `'notes'`, and the nav label `MEM` → `NOTES`. Deleted the old `MemoryPanel.jsx` via File Explorer once the new file was in place and verified as the only two referencing files (itself + Control.jsx). Deliberately did NOT touch `components/mars/memory.js` (the actual `remember`/`recall`/`clearMemory` localStorage functions) or ChatPanel's natural-language "remember X is Y" / "what do you remember" / "clear memory" command matching — those are a legitimate, accurately-named feature (the user literally says "remember" to MARS) and unrelated to the v0.15 Memory Intelligence naming collision. Renaming those would have been much bigger blast radius for no real benefit.

**Notes rename — tested, committed, pushed.** Christian ran `npm test` / `npm run build` / `npm run release-check` in `mars-standalone/` (note: must run from that subfolder, not the `Mars 2` root — no `package.json` at the root, tripped this up once). All green: 28/28 test files, 95/95 tests, clean build. Switched back to `feature/v0.13.0-identity-foundation` from `main` before committing (so new work keeps accumulating on the feature branch, not directly on main). Commit `926ed91..3ac57f5` pushed to `feature/v0.13.0-identity-foundation`.

One thing worth knowing for later: the commit used `git add -A`, which also swept up (a) the doc-housekeeping file moves from earlier in the day — those are now version-controlled for the first time, and (b) `CapabilityRouter.js`, which git showed as `create mode`, meaning it had never actually been committed before — it was untracked scaffolding sitting on disk this whole time, on every branch. So this one commit mixes three unrelated things (Notes rename, doc housekeeping, CapabilityRouter entering history). Not harmful — tests passed pre-commit and the other two additions are inert docs/dead code — but not a clean single-purpose commit if it's ever worth reverting just the rename.

**v0.14.2 Step 2 — Conversation Diagnostics Panel — built, tested, UI-verified, committed, pushed.** Scoped it first: grepped the whole app and confirmed `NaturalConversationEngine` (Step 1's output) had zero UI surface — `ChatPanel.jsx` runs entirely separate regex-based reply logic and was untouched. Built the diagnostics-panel pattern the project already uses (VoicePanel's template): `hooks/useConversationIntelligence.js`, `components/conversation/ConversationPanel.jsx` + `index.js`, wired in as a new "CONV" tab in `Control.jsx`, plus `ConversationPanelSmokeTest.test.js` (4 new tests — caught and fixed one bad assertion myself before handing off, `turnCount` doesn't increment on a single turn). Christian ran the full validation: 29/29 test files, 99/99 tests, clean build, release-check green. I then did manual UI verification myself via browser automation against the live dev server — sent a vision-routed turn and a memory-routed turn, both matched the engine's logic exactly, reset worked, zero console errors, and separately re-confirmed the Notes rename renders correctly live too. Wrote `Engineering_Manifest_v0.14.2_Step_2_Conversation_Diagnostics_Panel.md` directly into `manifest-history/` (the new authoritative location) with the full record. Committed and pushed to `feature/v0.13.0-identity-foundation`.

Deliberately did NOT mark v0.14.2 "Complete" in the MVCH roadmap — its original description says "shared chat/voice routing," which this diagnostics panel intentionally does not do (that's wiring the engine into live `ChatPanel`, a bigger and separate decision). MVCH stays "In Progress" honestly.

**Still open:**
- Actually wiring `NaturalConversationEngine` into live `ChatPanel` (if that's ever wanted) — not started, deliberately deferred.
- v0.14.3 (Voice Diagnostics & Audio Pipeline per MVCH) — not scoped yet.
- `CapabilityRouter.js` — confirmed still fully inert/unwired (re-verified this session), now at least version-controlled for the first time.
- Any new code from here still needs `npm test` / `npm run build` / `npm run release-check` (run from `mars-standalone/`) before commit — I still can't run those myself without shell access.

## Update — same day, v0.14.3 scoped and built as a coupled piece with ChatPanel wiring

Asked Christian whether to scope v0.14.3 (Voice Diagnostics & Audio Pipeline) and the deferred "wire `NaturalConversationEngine` into live ChatPanel" item separately or together. Scoping revealed they were touching the same surface: `ChatPanel.jsx` already had real, working Speech-to-Text (`VoiceInput.jsx`, Web Speech API) and Text-to-Speech (`ChatPanel`'s own `speak()`), completely disconnected from `services/voice/`, which explicitly declares `speechToTextEnabled: false` / `textToSpeechEnabled: false` / `liveAudioEnabled: false`. Presented three risk-tiered options; Christian explicitly chose the most invasive one — "Coupled: formalize + wire chat" — so both were built together.

**Critical regression risk caught before writing code:** `NaturalConversationEngine`'s `ROUTE_TO_MEMORY` branch is a v0.15 placeholder, not real storage. ChatPanel's `remember`/`recall` commands are real and back the Notes tab. Naively routing all chat replies through the engine would have silently broken real memory. Flagged this to Christian, then designed around it structurally rather than by convention.

**Built:**
- `services/voice/SpeechCapabilityService.js` — honest detection of real `SpeechRecognition`/`SpeechSynthesis` browser support, extracted from the inline check that used to live only in `VoiceInput.jsx`. Surfaced additively as `browserSpeechCapability` on `VoiceService.getStatus()` and `VoiceDiagnosticsService.evaluate()` — the existing simulated-layer `false` flags are untouched and remain correct (VoicePanel itself is still typed-transcript only).
- New "Browser Audio Capability" section in `VoicePanel.jsx` showing real STT/TTS support.
- `services/conversation/ChatConversationBridge.js` — the regression-safe decision layer. The engine is now consulted on every chat turn (giving ChatPanel real pronoun/cancel/confirm/repeat handling it never had), but its response only replaces the reply when ChatPanel's own logic would otherwise return the generic fallback ("...How would you like me to assist?"), and only for plan actions genuinely new to chat (`cancel_action`, `continue_previous_action`, `ask_clarifying_question`, `route_to_vision`). `route_to_memory` is deliberately excluded. Every existing memory command and canned reply is structurally protected — they never produce the generic marker, so the bridge never touches them.
- `ChatPanel.jsx` wired to call `NaturalConversationEngine.processTurn()` and pass both replies through `buildChatReply()`.
- Two new smoke test files: `ChatConversationBridgeSmokeTest.test.js` (7 tests, including explicit REGRESSION GUARD tests) and `SpeechCapabilitySmokeTest.test.js` (3 tests).

**Validated — test/build (Christian) + manual UI (me, live browser automation):** 31/31 test files, 109/109 tests, clean build, release-check green. Live UI pass confirmed: "remember my birthday is June 5th" still returns the real memory reply, "what is my birthday" still recalls it correctly, Notes tab shows the genuine persisted value, "who do you see right now" now gets the new engine-enhanced vision-routing reply, "never mind" now gets the new engine-enhanced cancellation reply, Voice tab's new Browser Audio Capability section renders Supported/Supported, zero console errors.

Wrote `Engineering_Manifest_v0.14.3_Speech_Capability_and_Chat_Conversation_Bridge.md` into `manifest-history/` with the full record. Not yet committed — commands for Christian to run:
```
git add -A
git commit -m "feat: v0.14.3 speech capability service + regression-safe chat conversation bridge"
git push origin feature/v0.13.0-identity-foundation
```

MVCH note: still deliberately not marking v0.14.2's "shared chat/voice routing" as fully complete — ChatPanel now routes through the engine for a genuine subset of cases (cancel/confirm/clarify/vision), but memory routing is still local-only by design, so "In Progress" remains the honest framing.

**Still open after this:**
- `CapabilityRouter.js` — still confirmed unwired.
- Real persistent memory inside the conversation engine itself — v0.15.
- Android audio pipeline — not started.

**Confirmed committed and pushed.** Christian confirmed the v0.14.3 commit went through to `feature/v0.13.0-identity-foundation`. Updated `MVCH_Master_Version_Control_History.md` (v0.14.3 row marked ✅ Complete, "Voice Audio Pipeline & Chat/Voice Bridge" moved into the Completed milestones list) and `MEM-0005_Manifest_5.0_Claude_Takeover.md` (Section 1 baseline, Section 3 architecture table, Section 2b manifest trail, Section 5 roadmap, Section 6 open items, Section 7 archive note all refreshed to the current 31-file/109-test, v0.14.3-complete state; added a "Last Updated: 11 July 2026" line). v0.14.2 deliberately still shown as "In Progress" in both docs, consistent with the reasoning already recorded above — memory routing stays local-only by design.

**Next up:** scope v0.15 Memory Intelligence Foundation. Two decisions to make going in: (1) whether `NaturalConversationEngine` should start dispatching through `CapabilityRouter.js`, still confirmed unwired; (2) whether v0.15 absorbs the existing `memory.js`/Notes-tab store or builds as a separate system alongside it.

## Update — same day, paused mid-decision on a new AI milestone (v0.14.4)

Christian asked whether the roadmap plans for a real LLM/AI, since `NaturalConversationEngine` is fully deterministic (no model call at all — confirmed by design) and the only "AI" code in the repo is `services/ai/` (`CloudProvider.js`, `LocalProvider.js`, `HomeProvider.js`, `AIStatusService.js`), all v0.9.1 placeholders that return hardcoded strings, never wired to a real model. The only roadmap line item for this is v0.19.3 "Local AI Integration (Samsung Galaxy S22)" — deep in Phase 10, Android Robot Application.

**Decision made:** pull this forward as a new milestone, **v0.14.4 "AI Reasoning Layer"**, rather than waiting for v0.19.3. Scope it on the existing `CloudProvider`/`LocalProvider` abstraction (currently placeholder-only) instead of inventing a new pattern, and follow the same sequence used for every milestone so far: real provider service → honest diagnostics panel → validate → only then wire into `NaturalConversationEngine`/`ChatPanel`, using the same regression-safe bridge pattern as v0.14.3 (`ChatConversationBridge`).

**Flagged before starting:** Christian confirmed the provider will be Claude for now. Important constraint raised and not yet resolved: this is a client-side Vite/React app with no backend — an API key placed directly in the bundle is visible to anyone via dev tools. This needs a decision (small backend/proxy to hold the key server-side, vs. a different approach) before any real API-calling code gets written. **Session paused here at Christian's request ("HOLD THOUGHT") — v0.14.4 has not been scoped or built yet.** Next session should pick this up by resolving the key-handling question first.
