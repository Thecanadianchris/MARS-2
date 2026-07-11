# MEM-0005 — Manifest 5.0 (Claude Takeover)

Document ID: MEM-0005
Status: Active — clean-start reference for engineering continuity
Date: 9 July 2026
Purpose: Marks the point at which engineering continuity for the MARS Software Project transferred from ChatGPT to Claude. This document combines the Manifest and Handover formats into a single, code-verified clean-start reference. Prior ChatGPT-era manifests and handover volumes have been archived (see Archive Note below) but remain available for history; nothing in them is lost, this document simply supersedes them as the active reference going forward.

Unlike prior MEM documents, this one is based on a direct code review of the live repository, not solely on prior handover documentation. Where the two disagreed, the code review takes precedence and is noted below.

---

## 1. Current Validated Baseline

| Item | Status |
|---|---|
| Last fully complete milestone | v0.14.1.1 — Voice Response Layer |
| In-progress milestone | v0.14.2 — Natural Conversation Engine |
| Test baseline (per MVCH, v0.14.2) | 28 test files, 95 tests — Build PASS, Release Check PASS, UI PASS |
| Next milestone | v0.14.3 — Voice Diagnostics & Audio Pipeline |

## 2. Verified Source of Truth

- **Live codebase path**: `02 - Software/Mars 2/mars-standalone/` — this is the active, current React/Vite application. It is **not** the `archive/` folder, which holds an older pre-refactor Base44-based build kept only for reference.
- **Git branch**: `feature/v0.13.0-identity-foundation` is the real active development branch, despite its name only referencing v0.13.0. Its GitHub commit hash matches the local HEAD exactly (commit `926ed91c...`, "feat: add v0.14.2 natural conversation engine foundation"). All work through v0.14.2 is committed and safely pushed.
- **`main` branch is stale**: it is frozen around v0.12 (Vision + Decision Intelligence only) and does not reflect current work. This is a branch-hygiene issue, not a data-loss risk — recommend merging/rebasing `feature/v0.13.0-identity-foundation` into `main` once a milestone is ready, per the release workflow in Section 4.
- **Repository**: `https://github.com/Thecanadianchris/MARS-2`

## 3. Architecture (Code-Verified)

`App.jsx` routes to `Control.jsx` (main dashboard) and `Home.jsx` (`/showcase`). `Control.jsx` wires together the following capability panels, confirmed by direct source read:

| Tab | Panel | Backing services |
|---|---|---|
| Chat | ChatPanel | — |
| Dashboard | DashboardPanel, AIStatusPanel, VisionStatusPanel, CameraPreviewPanel | `services/ai/` |
| Vision | VisionPanel | `services/vision/` (CameraService, FrameCaptureService, PoseDetectionService, PoseSummaryService, BodyStateEngine, MovementAnalysisService, ActivityRecognitionEngine, ObservationStreamEngine, PersonalObservationEngine, ContinuousVisionMonitor, FaceFoundationEngine, VisionPipeline, VisionService, BehaviourHistoryEngine, BehaviourPatternEngine) |
| Identity | IdentityPanel | `services/identity/` (IdentityEngine, IdentityStateMachine, IdentityTrackingService, IdentityTimelineService, IdentityObservationBuilder, IdentityDiagnosticsService, PersonRegistry, ProfileAuthorisationService, RecognitionCandidate, RecognitionConfidence, FaceQualityEngine) |
| Behaviour | BehaviourPanel | `services/behaviour/` (BehaviourProfile, BehaviourProfileRegistry, BehaviourProfileMatcher, BehaviourPrimitiveRegistry, BehaviourPatternEngine, BehaviourObservationBuilder, BehaviourRiskScoring, ProtectedBehaviourPolicy) |
| Decision | DecisionPanel | `services/decision/` (DecisionEngine, DecisionIntelligenceService, PriorityEngine, ActionRecommendationEngine, ContextEngine) |
| Notification | NotificationPanel | `services/notifications/` (NotificationEngine, NotificationManager, NotificationQueue, NotificationPolicy, NotificationPriority, NotificationProfiles, NotificationTargets, NotificationChannels, NotificationHistory) + `services/users/` (UserManager, UserProfile, UserRoles, UserPermissions, ProtectedUserService) |
| Voice | VoicePanel | `services/voice/` (VoiceService, VoiceCommandRouter, VoiceCommandRegistry, VoiceIntentParser, WakeWordService, VoiceResponseService, VoiceDiagnosticsService) |
| Diagnostics | DiagnosticsPanel | `services/diagnostics/` (DiagnosticsManager, DiagnosticsStore, DiagnosticsTypes) + `services/pipelineHealth/` (PipelineHealthService) + `services/livePipeline/` (LivePipelineStore) |
| Memory | MemoryPanel | `components/mars/memory.js` — **note**: this is a simple localStorage chat-history store, distinct from the planned v0.15 Memory Intelligence engine. The naming overlap is worth resolving before v0.15 work begins (e.g. rename this to "Chat History" or similar). |

**v0.14.2 in progress** — `services/conversation/`: `NaturalConversationEngine`, `ConversationSessionService`, `ConversationHistoryService`, `ConversationContextService`, `ReferenceResolver`, `ConversationPlanner`, `ConversationDiagnosticsService`. Code reviewed directly: `NaturalConversationEngine` is a deterministic orchestrator (no live LLM call yet) that composes session, history, context, reference resolution and planning into a turn response, consistent with the project's "non-medical assistive platform" framing (explicit `medicalDiagnosis: false`, `persistentMemory: false`, `liveAudio: false` flags on every response).

**Notable finding**: `services/conversation/CapabilityRouter.js` already exists in code, even though the handover documentation described the Capability Router as "planned" future work. Cross-checked against the real per-step manifest trail (Section 2b below): the v0.14.2 Step 1 manifest explicitly scoped only the session/history/context/reference/planner/diagnostics services and did **not** include CapabilityRouter — so this file is ahead of its own documentation, likely early scaffolding for an undocumented "Step 2." Confirm its status before building on it.

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

Two files from that trail are still `.docx` and could not be relocated yet (sandbox unavailable — see Open Items): `Engineering_Manifest_v0.13.6_Diagnostics_Stabilisation.docx` and `MARS_Software_Engineering_Handover_v4.1_v0.13.6_Update.docx`, still at `mars-standalone/docs/`.

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

See `MVCH_Master_Version_Control_History.md` (same folder) for the full versioned roadmap through v0.20.4 (MARS Mk1 Production Release). Immediate next steps: finish v0.14.2 Natural Conversation Engine, then v0.14.3 Voice Diagnostics & Audio Pipeline, then begin v0.15 Memory Intelligence Foundation.

## 6. Open Items for Next Engineering Session

- Confirm status of `CapabilityRouter.js` (appears implemented, docs say planned — see Section 2b).
- Resolve "Memory" naming collision between the current localStorage chat panel and the future v0.15 Memory Intelligence engine.
- Merge/rebase `feature/v0.13.0-identity-foundation` into `main` so the default branch reflects current work.
- Continue v0.14.2 to completion per the validated 28-test-file / 95-test baseline.
- Once the sandbox environment is available again: (a) move the 2 remaining `.docx` files out of `mars-standalone/docs/` into `docs/engineering/manifest-history/` alongside their already-consolidated `.md` counterparts, and (b) archive the stale `docs/engineering/manifest/` (MEM-0001–0004) series and the old `docs/MARS_Software_Engineering_Handover_v4.0/` folder into `docs/archive/`, per Section 7.

## 7. Archive Note

Consolidation status as of this document:

**Done** — the real per-milestone manifest trail from `mars-standalone/docs/` has been consolidated (as plain-text `.md`) into `docs/engineering/manifest-history/` in this repo (see Section 2b for the file list).

**Still pending** (blocked on sandbox access, see Section 6):
- The 2 `.docx` files remaining in `mars-standalone/docs/` need to move into `manifest-history/` alongside the rest.
- The following ChatGPT-era documents should be moved to `docs/archive/`, since they are now superseded by this document, the MVCH, and the consolidated manifest-history:
  - Handover v4.0, v4.1, v4.2 (Combined Master and volume files, currently in `docs/MARS_Software_Engineering_Handover_v4.0/`)
  - The old, incomplete Engineering Manifests MEM-0001 through MEM-0004 and their index (currently in `docs/engineering/manifest/`)
  - Version-specific handover packs (13.4→13.5, 13.5→13.6, 13.6→14.0) and the v0.13.6 release notes (currently loose in `docs/`)
