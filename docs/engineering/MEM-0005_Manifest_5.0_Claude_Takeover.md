# MEM-0005 — Manifest 5.0 (Claude Takeover)

Document ID: MEM-0005
Status: Active — clean-start reference for engineering continuity
Date: 9 July 2026
Last Updated: 12 July 2026 (v0.15 Memory Intelligence Foundation + v0.15.1 Person-Scoped Memory complete, committed `939ca97`; see SESSION_HANDOFF_2026-07-12.md for the short current-state summary)
Purpose: Marks the point at which engineering continuity for the MARS Software Project transferred from ChatGPT to Claude. This document combines the Manifest and Handover formats into a single, code-verified clean-start reference. Prior ChatGPT-era manifests and handover volumes have been archived (see Archive Note below) but remain available for history; nothing in them is lost, this document simply supersedes them as the active reference going forward.

Unlike prior MEM documents, this one is based on a direct code review of the live repository, not solely on prior handover documentation. Where the two disagreed, the code review takes precedence and is noted below.

---

## 1. Current Validated Baseline

*(Updated 12 July 2026 — see `docs/engineering/manifest-history/Engineering_Manifest_v0.15_Memory_Intelligence_Foundation.md` and `..._v0.15.1_Person_Scoped_Memory.md` for the full record behind this update.)*

| Item | Status |
|---|---|
| Last fully complete milestone | v0.15.1 — Person-Scoped Memory (Multi-User). Memory keyed by unbounded `personId` (owner default + explicit person tags), face-recognition-ready `setActivePerson` hook. Builds on v0.15 Memory Intelligence Foundation (real store, Notes absorbed via regression-safe shim, honest read-wiring, MEM-I panel). |
| In-progress milestone | v0.14.2 — Natural Conversation Engine (diagnostics panel built; chat shares routing with the engine for cancel/confirm/clarify/vision; engine-driven memory writes still deferred to v0.15.2, so not marked fully complete) |
| Test baseline | 35 test files, 155 tests — Build PASS, Release Check PASS, UI PASS (memory round-trip + person-scoping verified live) |
| Next milestone | v0.15.2 — Short-Term Memory Engine (engine-driven writes via CapabilityRouter), then v0.16 Face Recognition (wires `setActivePerson`) |

## 2. Verified Source of Truth

- **Live codebase path**: `02 - Software/Mars 2/mars-standalone/` — this is the active, current React/Vite application. It is **not** the `archive/` folder, which holds an older pre-refactor Base44-based build kept only for reference.
- **Git branch**: `feature/v0.13.0-identity-foundation` is the real active development branch, despite its name only referencing v0.13.0, and remains where all new work lands. All work through v0.14.4 plus the 12 July repo-hygiene commit (`738bf65` — removed shadowed duplicates `services/voice.js` and `services/capabilityState/`, renamed the `index (1).js` barrel) is confirmed pushed.
- **`main` branch**: periodically fast-forwarded from the feature branch. At the 12 July GitHub check it was 7 commits behind again; merge commands were handed to Christian — confirm completed at next session start. New work still lands on the feature branch first, per the release workflow in Section 4.
- **Repository**: `https://github.com/Thecanadianchris/MARS-2`

## 3. Architecture (Code-Verified)

`App.jsx` routes to `Control.jsx` (main dashboard) and `Home.jsx` (`/showcase`). `Control.jsx` wires together the following capability panels, confirmed by direct source read:

| Tab | Panel | Backing services |
|---|---|---|
| Chat | ChatPanel | — |
| Dashboard | DashboardPanel, AIStatusPanel (rebuilt v0.14.4: live per-tier AI status, runtime Claude key entry, TEST AI ROUTE with escalation trail), VisionStatusPanel, CameraPreviewPanel | `services/ai/` — real as of v0.14.4: `AIReasoningService` (Local → Home → Cloud escalation router with honest trail), `AIProviderConfig` (runtime config/key in localStorage only), `LocalProvider` (honest S22 stub until v0.19.x), `HomeProvider` (real Ollama client, probe-based availability), `CloudProvider` (real multi-vendor client: Claude default, ChatGPT, Gemini, or Other OpenAI-compatible endpoint — selectable in the panel, one runtime-entered key per provider, optional gitignored `.env.local` seed); legacy `LocalAIDecisionService`/`AIStatusService` retained unchanged |
| Vision | VisionPanel | `services/vision/` (CameraService, FrameCaptureService, PoseDetectionService, PoseSummaryService, BodyStateEngine, MovementAnalysisService, ActivityRecognitionEngine, ObservationStreamEngine, PersonalObservationEngine, ContinuousVisionMonitor, FaceFoundationEngine, VisionPipeline, VisionService, BehaviourHistoryEngine, BehaviourPatternEngine) |
| Identity | IdentityPanel | `services/identity/` (IdentityEngine, IdentityStateMachine, IdentityTrackingService, IdentityTimelineService, IdentityObservationBuilder, IdentityDiagnosticsService, PersonRegistry, ProfileAuthorisationService, RecognitionCandidate, RecognitionConfidence, FaceQualityEngine) |
| Behaviour | BehaviourPanel | `services/behaviour/` (BehaviourProfile, BehaviourProfileRegistry, BehaviourProfileMatcher, BehaviourPrimitiveRegistry, BehaviourPatternEngine, BehaviourObservationBuilder, BehaviourRiskScoring, ProtectedBehaviourPolicy) |
| Decision | DecisionPanel | `services/decision/` (DecisionEngine, DecisionIntelligenceService, PriorityEngine, ActionRecommendationEngine, ContextEngine) |
| Notification | NotificationPanel | `services/notifications/` (NotificationEngine, NotificationManager, NotificationQueue, NotificationPolicy, NotificationPriority, NotificationProfiles, NotificationTargets, NotificationChannels, NotificationHistory) + `services/users/` (UserManager, UserProfile, UserRoles, UserPermissions, ProtectedUserService) |
| Voice | VoicePanel | `services/voice/` (VoiceService, VoiceCommandRouter, VoiceCommandRegistry, VoiceIntentParser, WakeWordService, VoiceResponseService, VoiceDiagnosticsService, `SpeechCapabilityService` — new in v0.14.3, real browser STT/TTS support detection, surfaced as `browserSpeechCapability` alongside the existing simulated-layer flags) |
| Conversation | ConversationPanel | `services/conversation/` (see below) — new in v0.14.2 Step 2, diagnostics-panel pattern, tab key `'conversation'` |
| Diagnostics | DiagnosticsPanel | `services/diagnostics/` (DiagnosticsManager, DiagnosticsStore, DiagnosticsTypes) + `services/pipelineHealth/` (PipelineHealthService) + `services/livePipeline/` (LivePipelineStore) |
| Notes | NotesPanel | Renders the owner/default person's memory. As of v0.15, `components/mars/memory.js` is a thin **shim** delegating to `services/memory/MemoryIntelligenceService` (no logic of its own). `ChatPanel`'s "remember X is Y" commands write through it, so Notes shows the owner scope unchanged. Tab key `'notes'`. |
| Memory Intelligence | MemoryIntelligencePanel | `services/memory/` (`MemoryIntelligenceService`, `MemoryCommandParser`) — new in v0.15/v0.15.1. Person-scoped persistent store keyed by unbounded `personId`; MEM-I tab shows per-person facts, migration/backing status. Tab key `'memory-i'`. |

**v0.14.2 in progress, v0.14.3 complete** — `services/conversation/`: `NaturalConversationEngine`, `ConversationSessionService`, `ConversationHistoryService`, `ConversationContextService`, `ReferenceResolver`, `ConversationPlanner`, `ConversationDiagnosticsService`, plus (new) `ChatConversationBridge`. Code reviewed directly: `NaturalConversationEngine` is a deterministic orchestrator (no live LLM call yet) that composes session, history, context, reference resolution and planning into a turn response, consistent with the project's "non-medical assistive platform" framing (explicit `medicalDiagnosis: false`, `persistentMemory: false`, `liveAudio: false` flags on every response). As of v0.14.3, `ChatPanel.jsx` calls `NaturalConversationEngine.processTurn()` on every turn; `ChatConversationBridge.buildChatReply()` decides whether to use the engine's response (only for `cancel_action`, `continue_previous_action`, `ask_clarifying_question`, `route_to_vision` plan actions, and only when the local reply logic had nothing specific to say) or the existing local reply (always used for real memory commands and canned replies — structurally protected, not just by convention).

**CapabilityRouter status — still unwired; memory branch now reads real store.** `services/conversation/CapabilityRouter.js` still has zero imports anywhere in the app. As of v0.15 its `MEMORY` case (and the engine's `ROUTE_TO_MEMORY` response) return a real read from `MemoryIntelligenceService` instead of the old "begins in v0.15" placeholder, but nothing dispatches *through* the router yet, and engine-driven memory *writes* remain deferred to v0.15.2. The engine still builds its response via a local `switch` on `plan.action`.

### 2b. Real Per-Milestone Manifest Trail (Corrected)

A second, more complete and more current manifest/handover trail was found inside `mars-standalone/docs/` and `mars-standalone/docs/engineering/` — maintained alongside the code itself, and more granular than the old `MEM-0001–0004` series (which stopped at v0.13.4 marked "Planned"). This trail has been consolidated into `docs/engineering/manifest-history/` in this repo, and is the authoritative per-milestone record:

- `MARS_v0.13.0_IDENTITY_FOUNDATION.md`
- `MARS_v0.13.1_IDENTITY_TRACKING.md`
- `MARS_v0.13.2_USER_MANAGEMENT_NOTIFICATIONS.md`
- `MARS_v0.13.3_BEHAVIOUR_INTELLIGENCE_FOUNDATION.md`
- `M2_Diagnostics_UI_Integration.md` (v0.13.4)
- `Engineering_Manifest_v0.14.1_Wake_Word_Command_Routing.md` + `Handover_Update_v0.14.1.md` + `Replacement_Instructions_v0.14.1.md`
- `Engineering_Manifest_v0.14.1.1_Voice_Response_Layer.md` + `Handover_Update_v0.14.1.1.md`
- `Engineering_Manifest_v0.14.2_Step_1_Natural_Conversation_Engine.md` + `Replacement_Instructions_v0.14.2_Step_1.md`
- `Engineering_Manifest_v0.14.2_Step_2_Conversation_Diagnostics_Panel.md`
- `Engineering_Manifest_v0.14.3_Speech_Capability_and_Chat_Conversation_Bridge.md`
- `Engineering_Manifest_v0.14.4_AI_Reasoning_Layer.md`
- `Engineering_Manifest_v0.15_Memory_Intelligence_Foundation.md`
- `Engineering_Manifest_v0.15.1_Person_Scoped_Memory.md`

All files from this trail, including the 2 that were `.docx`, are now consolidated in `docs/engineering/manifest-history/` — the sandbox-blocked move noted in earlier versions of this document was completed via computer-use screen control. `manifest-history/` is the sole authoritative per-milestone record going forward; `mars-standalone/docs/` no longer holds any manifest content.

## 4. Workflow Rules (carried forward, unchanged)

1. Project ZIP / current state review before starting a milestone.
2. Architecture review — confirm capability ownership, interfaces, roadmap alignment.
3. Implement changes.
4. `npm run release-check` (= `npm run test && npm run build`) must pass.
5. UI verification (manual) must pass.
6. Git commit only after both gates pass.
7. Git push to the active branch.
8. One Engineering Manifest per completed milestone. Never overwrite manifest history.

`package.json` scripts verified: `dev`, `build`, `test` (vitest run), `smoke` (vitest run src/tests), `release-check`, `validate` — all match the documented workflow exactly.

## 5. Roadmap Forward

See `MVCH_Master_Version_Control_History.md` (same folder) for the full versioned roadmap through v0.20.4 (MARS Mk1 Production Release). v0.14.4 AI Reasoning Layer is complete (pulled forward from v0.19.3; that slot now means replacing the LocalProvider stub with a real on-device model on the S22). v0.15 Memory Intelligence Foundation and v0.15.1 Person-Scoped Memory are complete. Immediate next step: v0.15.2 Short-Term Memory Engine (engine-driven writes dispatched through `CapabilityRouter`), then v0.16 Face Recognition (which wires `MemoryIntelligenceService.setActivePerson` so "my …" attaches to the recognised person).

## 6. Open Items for Next Engineering Session

- **v0.14.4 end-to-end — DONE (12 July 2026).** Ollama ARM64 + `qwen3.5:4b` installed on the base station; Claude key entered at runtime. Both live paths confirmed: Home tier answering in panel and chat (`via HOME_AI_SERVER`), and Cloud escalation to Claude when Home was down (first real AI response in MARS history). Full debugging record (browser 503 → same-origin `/ollama` Vite proxy fix, thinking-model `think:false` fix, 60s timeout) is in the v0.14.4 manifest §7.
- **v0.15 + v0.15.1 — DONE (12 July 2026, commit `939ca97`).** Memory absorbed the Notes store via a regression-safe shim (decision: absorb, taken this session) and became person-scoped by unbounded `personId` (owner default + explicit person tags). Honest read-wiring replaced the old "begins in v0.15" placeholders. 35 files / 155 tests, Build + Release Check + UI all PASS.
- `CapabilityRouter.js` is still unwired. Its memory branch now returns a real read, but engine-driven memory **writes** through it are the v0.15.2 job — that's the next dispatch decision.
- **v0.15.2 Short-Term Memory Engine** — next milestone: wire `NaturalConversationEngine`/`CapabilityRouter` to write per-person session memory.
- **v0.16 Face Recognition** — will call `MemoryIntelligenceService.setActivePerson(personId)` once an identity is confirmed, so untagged "my …" attaches to the recognised person. Hook already exists.
- Confirm the `main` fast-forward merge completed (was 7 commits behind at the 12 July GitHub check).
- Optional: write a root README for the GitHub repo (currently none).
- All doc-housekeeping items from earlier versions of this document are resolved (see Section 7); a full repo structural review (12 July) additionally removed the shadowed duplicate modules and confirmed gitignore coverage, docs layout, and a clean src tree.

## 7. Archive Note

Consolidation is fully complete as of 11 July 2026:

- The real per-milestone manifest trail from `mars-standalone/docs/` has been consolidated (as plain-text `.md`, plus 2 `.docx`) into `docs/engineering/manifest-history/` in this repo (see Section 2b for the file list) — including the two v0.14.2 Step 2 and v0.14.3 additions.
- All ChatGPT-era documents (Handover v4.0/v4.1/v4.2, old MEM-0001–0004 series, version-specific handover packs, v0.13.6 release notes) have been moved to `docs/chat gbt docs Archive/`.
- `mars-standalone/docs/` no longer holds any manifest content — `manifest-history/` in the main repo is the sole authoritative copy going forward.
- `main` branch on GitHub has been merged from the feature branch and is no longer stale.
