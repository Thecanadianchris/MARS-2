# MEM-0005 — Manifest 5.0 (Claude Takeover)

Document ID: MEM-0005
Status: Active — clean-start reference for engineering continuity
Date: 9 July 2026
Last Updated: 11 July 2026 (v0.14.4 baseline)
Purpose: Marks the point at which engineering continuity for the MARS Software Project transferred from ChatGPT to Claude. This document combines the Manifest and Handover formats into a single, code-verified clean-start reference. Prior ChatGPT-era manifests and handover volumes have been archived (see Archive Note below) but remain available for history; nothing in them is lost, this document simply supersedes them as the active reference going forward.

Unlike prior MEM documents, this one is based on a direct code review of the live repository, not solely on prior handover documentation. Where the two disagreed, the code review takes precedence and is noted below.

---

## 1. Current Validated Baseline

*(Updated 11 July 2026 — see `docs/engineering/manifest-history/Engineering_Manifest_v0.14.4_AI_Reasoning_Layer.md` for the full record behind this update.)*

| Item | Status |
|---|---|
| Last fully complete milestone | v0.14.4 — AI Reasoning Layer (Local → Home → Cloud escalation chain, real Ollama + Claude clients, runtime key entry) |
| In-progress milestone | v0.14.2 — Natural Conversation Engine (diagnostics panel built; chat now shares routing with the engine for cancel/confirm/clarify/vision, memory routing intentionally still local-only, so not marked fully complete) |
| Test baseline | 33 test files, 126 tests — Build PASS, Release Check PASS, UI PASS |
| Next milestone | v0.15 — Memory Intelligence Foundation |

## 2. Verified Source of Truth

- **Live codebase path**: `02 - Software/Mars 2/mars-standalone/` — this is the active, current React/Vite application. It is **not** the `archive/` folder, which holds an older pre-refactor Base44-based build kept only for reference.
- **Git branch**: `feature/v0.13.0-identity-foundation` is the real active development branch, despite its name only referencing v0.13.0, and remains where all new work lands. All work through v0.14.3 (SpeechCapabilityService + ChatConversationBridge, confirmed committed and pushed 11 July 2026) is safely on this branch.
- **`main` branch**: merged from `feature/v0.13.0-identity-foundation` (fast-forward, no conflicts) earlier this week — no longer stale. New work still lands on the feature branch first, per the release workflow in Section 4.
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
| Notes | NotesPanel | `components/mars/memory.js` — simple localStorage chat-history/fact store. Renamed from "Memory"/`MemoryPanel` to resolve the naming collision with the v0.15 Memory Intelligence engine (tab key now `'notes'`). `ChatPanel`'s "remember X is Y" conversational commands deliberately still use this real store — untouched by the rename. |

**v0.14.2 in progress, v0.14.3 complete** — `services/conversation/`: `NaturalConversationEngine`, `ConversationSessionService`, `ConversationHistoryService`, `ConversationContextService`, `ReferenceResolver`, `ConversationPlanner`, `ConversationDiagnosticsService`, plus (new) `ChatConversationBridge`. Code reviewed directly: `NaturalConversationEngine` is a deterministic orchestrator (no live LLM call yet) that composes session, history, context, reference resolution and planning into a turn response, consistent with the project's "non-medical assistive platform" framing (explicit `medicalDiagnosis: false`, `persistentMemory: false`, `liveAudio: false` flags on every response). As of v0.14.3, `ChatPanel.jsx` calls `NaturalConversationEngine.processTurn()` on every turn; `ChatConversationBridge.buildChatReply()` decides whether to use the engine's response (only for `cancel_action`, `continue_previous_action`, `ask_clarifying_question`, `route_to_vision` plan actions, and only when the local reply logic had nothing specific to say) or the existing local reply (always used for real memory commands and canned replies — structurally protected, not just by convention).

**CapabilityRouter status — resolved, still unwired.** `services/conversation/CapabilityRouter.js` exists in code (now version-controlled, previously untracked scaffolding) but is confirmed by repeated grep across the whole session to have zero imports anywhere in the app. `NaturalConversationEngine.processTurn()` builds its response via a local `switch` on `plan.action`, never calling `CapabilityRouter.route()`. Decision on whether to start dispatching through it is deferred to v0.15 scoping.

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

See `MVCH_Master_Version_Control_History.md` (same folder) for the full versioned roadmap through v0.20.4 (MARS Mk1 Production Release). v0.14.4 AI Reasoning Layer is complete (pulled forward from v0.19.3; that slot now means replacing the LocalProvider stub with a real on-device model on the S22). Immediate next step: v0.15 Memory Intelligence Foundation.

## 6. Open Items for Next Engineering Session

- **v0.14.4 first end-to-end run — confirm and note.** The AI Reasoning Layer is built, tested (33/126) and UI-verified on the honest-failure path, but no live model answer has been observed yet: Ollama was not installed at verification time and no Claude key had been entered. Next session: install Ollama on the base station (`ollama pull qwen3.5:4b` or similar), have Christian paste the Claude key into the MARS Intelligence panel, and confirm a real Home-tier answer plus a real Cloud escalation.
- Decide whether `NaturalConversationEngine` should start dispatching through `CapabilityRouter.js` (confirmed built, version-controlled, still fully unwired) as part of v0.15.
- Decide whether v0.15 Memory Intelligence should absorb the existing `components/mars/memory.js` / Notes-tab store, or build as a genuinely separate system alongside it — `ChatConversationBridge` currently keeps the engine's memory branch as a placeholder specifically to avoid conflicting with the real store, so this decision shapes how that bridge evolves.
- Scope v0.15 Memory Intelligence Foundation (after v0.14.4 is resolved).
- All doc-housekeeping and branch-hygiene open items from earlier versions of this document are resolved (see Section 7) — `main` is merged, all manifest content is consolidated in `manifest-history/`, and the Notes rename is live.

## 7. Archive Note

Consolidation is fully complete as of 11 July 2026:

- The real per-milestone manifest trail from `mars-standalone/docs/` has been consolidated (as plain-text `.md`, plus 2 `.docx`) into `docs/engineering/manifest-history/` in this repo (see Section 2b for the file list) — including the two v0.14.2 Step 2 and v0.14.3 additions.
- All ChatGPT-era documents (Handover v4.0/v4.1/v4.2, old MEM-0001–0004 series, version-specific handover packs, v0.13.6 release notes) have been moved to `docs/chat gbt docs Archive/`.
- `mars-standalone/docs/` no longer holds any manifest content — `manifest-history/` in the main repo is the sole authoritative copy going forward.
- `main` branch on GitHub has been merged from the feature branch and is no longer stale.
