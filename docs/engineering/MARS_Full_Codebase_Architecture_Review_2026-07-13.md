# MARS Software Project — Full Codebase Architecture Review

Date: 13 July 2026
Scope: every non-test, non-gitignored file in `mars-standalone/src/` (~175 source files across services, hooks, components, models, core), plus `App.jsx`/`main.jsx`, `pages/`, root config (`package.json`, `vite.config.js`). `node_modules`, `dist`, `.vite`, and other gitignored paths were excluded, as requested. Test files (39, matching the v0.15.5 baseline) were confirmed present but not re-read line-by-line in this pass — this is an architecture read, not a test audit.

Method: read every file directly (via six parallel subsystem passes — Vision/Pipeline/Diagnostics, Identity/Users/Behaviour, Decision/Notifications/AI, Conversation/Voice, Memory, App-shell/UI/core), then synthesized here. This is not a bug hunt, but each pass flagged anything that looked like a real inconsistency along the way — those are collected in §7.

---

## 1. The one-paragraph version

MARS is a single-page React/Vite app (`Control.jsx`, 11 tabs) sitting on top of a deep, well-layered service architecture: a camera → pose → body-state → behaviour → activity → face-orientation pipeline (`VisionPipeline.js`) feeds an Identity Foundation (`IdentityEngine.js`) that's fully wired but has no live recognition yet, a Behaviour risk-scoring layer, a rule-based Decision Intelligence layer, a two-tier Notification system, a three-tier Local→Home→Cloud AI reasoning chain, a five-service Conversation engine, a fully-simulated Voice command layer, and a person-scoped Memory Intelligence store with a `setActivePerson()` hook already built and waiting for Face Recognition to call it. The codebase is unusually well-documented in-line (every service header states its version, purpose, and explicit "does not do X" boundaries) and unusually honest about what's real vs. simulated — nearly every diagnostic object carries `medicalDiagnosis: false` and capability-state flags (`LIVE`/`WAITING`/`SIMULATION`). The main structural finding across all six passes: several subsystems have **two parallel, non-interoperable implementations of the same concern** (see §7.1) — worth a cleanup pass at some point, though none of it blocks v0.16.

---

## 2. System map

```
CAMERA / VISION                     IDENTITY                    USERS (built, unwired)
CameraService                       IdentityEngine ─────────────UserManager (no live caller)
 → FrameCaptureService              IdentityStateMachine        UserPermissions/UserRoles
 → PoseDetectionService (MediaPipe) IdentityTrackingService      ProtectedUserService
 → PoseSummaryService               RecognitionCandidate
 → BodyStateEngine                  RecognitionConfidence
 → MovementAnalysisService          FaceQualityEngine
 → BehaviourHistoryEngine           PersonRegistry (3 seeded profiles)
 → BehaviourPatternEngine           ProfileAuthorisationService
 → ActivityRecognitionEngine        IdentityObservationBuilder
 → FaceFoundationEngine (head        IdentityTimelineService
    orientation only, NOT            IdentityDiagnosticsService
    recognition)
 → ObservationStreamEngine  ────────┘
 → IdentityEngine.evaluate()
 → PersonalObservationEngine (Finley-only, hardcoded)
 → DecisionIntelligenceService ─── ContextEngine → DecisionEngine → PriorityEngine → ActionRecommendationEngine
 → NotificationManager ─────────── NotificationEngine → NotificationProfiles → NotificationTargets → NotificationHistory
 → LivePipelineStore (latest result + 30-deep history)

BEHAVIOUR INTELLIGENCE (separate from Vision's BehaviourHistoryEngine)
BehaviourPatternEngine (services/behaviour, different file from services/vision's)
 → BehaviourObservationBuilder → BehaviourRiskScoring → ProtectedBehaviourPolicy
 → BehaviourProfile (per-person baseline) / BehaviourProfileRegistry+Matcher (user-defined labels, unintegrated with risk score)

CONVERSATION & VOICE
NaturalConversationEngine: ConversationSessionService → ConversationHistoryService
 → ConversationContextService → ReferenceResolver → ConversationPlanner
ChatConversationBridge (overrides generic fallback only)
ChatReasoningBridge → AIReasoningService (Local → Home → Cloud escalation)
Voice: WakeWordService → VoiceIntentParser/Registry → VoiceCommandRouter → VoiceResponseService
  (entirely separate simulation, shares nothing with Chat except SpeechCapabilityService's status flags)

MEMORY INTELLIGENCE
MemoryIntelligenceService (person-scoped store, localStorage v3, setActivePerson() ready for v0.16)
 → WorkingMemoryService (session seed, read-only + promote-via-CapabilityRouter, unwired to prod)
 → MemoryClassifier → LongTermMemoryEngine (salience, safety-protected retention)
 → PersonalContextService (on-prem only, feeds AIReasoningService)
 → InferenceParser → BehaviourLearningService (confirm-gated candidates)

DIAGNOSTICS
DiagnosticsManager aggregates all of the above (+ stubs for Base Station/Cloud/Wearable)
 → PipelineHealthService (6-stage health model)
```

---

## 3. Subsystem-by-subsystem summary

### 3.1 Vision / Live Pipeline / Diagnostics

`VisionPipeline.processFrame()` is the true orchestrator, run once per captured frame by `ContinuousVisionMonitor`'s self-rescheduling loop (default 1s). The confirmed data flow: capture → `PoseDetectionService` (MediaPipe `PoseLandmarker`, GPU delegate) → `PoseSummaryService` (geometry) → `BodyStateEngine` (posture + risk) → `MovementAnalysisService` (stateful, diffs prior frame) → `BehaviourHistoryEngine` (rolling 20-entry history) → `BehaviourPatternEngine` (transition detection) → `ActivityRecognitionEngine` (activity label) — running in parallel with `FaceFoundationEngine` (head pitch/yaw/roll from the *same* pose landmarks, points 0–12; explicitly not recognition) — then `ObservationStreamEngine` normalizes everything into a deduplicated observation list, `IdentityEngine.evaluate()` runs on that stream, `PersonalObservationEngine` runs *after* identity (using `identity.profile?.id` to select which hardcoded personal profile to check — currently only `finley`), then `DecisionIntelligenceService` and `NotificationManager` consume the final result. Everything here is in-memory only — no persistence layer exists anywhere in Vision/LivePipeline/Diagnostics; a page reload loses all rolling history and tracking state.

**For v0.16:** `FaceFoundationEngine`'s output (`perceptionResult.faceFoundation`) is head-orientation only and never touches raw pixels — face recognition needs a new pixel-level pathway (e.g. against `frame.dataUrl` or a cropped region), it cannot be derived from existing engine output. The natural integration point is extending `FaceFoundationEngine` (or adding a sibling `FaceRecognitionEngine`) to emit a face descriptor/candidate match into `perceptionResult` *before* the `IdentityEngine.evaluate()` call at `VisionPipeline.js:142`. `ObservationRegistry` already has an unused `IDENTITY_*` namespace (`IDENTITY_KNOWN`, `IDENTITY_TRUSTED_USER`, `IDENTITY_BLOCKED`, etc.) purpose-built for this. `DiagnosticsManager` already has a stubbed `face-recognition` check flagged "Planned identity sensor. Not required for M2.1" — the natural diagnostics hook to flip on.

### 3.2 Identity / Users / Behaviour

`IdentityEngine.evaluate()` resolves a tracking result via `IdentityTrackingService`, builds a `RecognitionCandidate` (provider-neutral DTO any future recognizer must produce), runs `IdentityStateMachine.evaluate()` (pure, 9 states in practice — `NO_PERSON → TRACKING → BLOCKED/PROTECTED/TRUSTED/KNOWN → PENDING_PROFILE/GUEST/UNKNOWN` in priority order), and assembles a full result including `createPendingProfile`/`confirmPendingProfile` gated through `ProfileAuthorisationService`. **Confirmed the key gap directly in code**: `IdentityTrackingService.js` hardcodes `identityConfidence: 0` and `candidateProfiles: []` on every candidate it builds (lines 76, 103–105) — since `RecognitionCandidate.deriveState()` requires `identityConfidence >= 0.75` and a non-empty `candidateProfiles` to reach `RECOGNISED`, **no live perception input can currently produce a matched profile**. Today, `KNOWN`/`TRUSTED`/`PROTECTED` states are only reachable via the demo hook's manual overrides (`options.profileId`/`.displayName`/`.matchedProfile`). This is exactly the gap v0.16 closes, and the insertion point is precise: populate those two fields in `IdentityTrackingService.updateFromPerception` with real provider output.

`PersonRegistry` (3 hardcoded profiles: christian/owner, ann/trusted, finley/protected) is genuinely separate from `services/users` (`UserManager`/`UserProfile`/`UserPermissions`/`UserRoles`) — they're meant to be layered (Identity = "who", Users = "what permissions"), with `UserManager.registerFromIdentity()` as the intended glue. **But nothing calls it.** `IdentityStateMachine`/`ProfileAuthorisationService`/Behaviour risk scoring all read `PersonRegistry`'s own `trusted`/`protected`/`blocked` fields directly, never consulting `UserPermissions`/`UserRoles`. The Users subsystem is fully built, internally consistent, and completely unconnected to the rest of the app today. There are also three independent "is this person protected" checks (`PersonRegistry.protected` + `IdentityStateMachine`, `services/users/ProtectedUserService`, `services/behaviour/ProtectedBehaviourPolicy`) with no shared source of truth.

Protected-user flow into Behaviour is real but caller-dependent: `identityResult.protected` → `BehaviourProfile.protectedUser` → `BehaviourRiskScoring` adds +15 only if score is already >0 (protection alone never creates concern) → `ProtectedBehaviourPolicy` lowers the notify bar to `concernLevel === HIGH` and raises priority to `elevated`/`watch`. This entirely depends on the caller correctly threading `identityResult` through — there's no registry lookup enforcing it.

**For v0.16:** the insertion point is `IdentityTrackingService.updateFromPerception` (lines 76, 105). `RecognitionCandidate.deriveState()`'s threshold logic is already correct and just needs real data. `IdentityEngine.resolveMatchedProfile` already knows how to consume `candidateProfiles[0].profile`/`.profileId`. `ProfileAuthorisationService` is the safety backstop to preserve — recognition must never auto-promote to trusted/owner. Note `pendingProfile` is currently caller-supplied, not auto-looked-up from `PersonRegistry.listPendingProfiles()` — decide whether v0.16 should change that.

### 3.3 Decision Intelligence / Notifications / AI

`DecisionIntelligenceService` runs `ContextEngine → DecisionEngine → PriorityEngine → ActionRecommendationEngine` — rule-based decisions (boolean checks on context fields) scored by `PriorityEngine` (base score by severity string + confidence adjustment + risk-level adjustment + personal-profile adjustment, clamped 0–100) and mapped to advisory-only recommendations (nothing auto-executes; enforced by convention, not code gating).

Notifications have **two parallel, non-interoperable pipelines**: the legacy `NotificationManager.createFromDecision()` → `NotificationPolicy` → `NotificationQueue` path (role-based, `ACTIVE_CHANNELS_V0132` locked to local-app only) and the current M2.5 `NotificationManager.evaluateDecision()` → `NotificationEngine` → `NotificationProfiles`/`NotificationTargets` → `NotificationHistory` path (score-based). Only the second is wired to any hook/component (`useNotificationEngine`) — the first appears dead from the UI's perspective, though it may still have callers elsewhere. They use differently-named, non-interoperable priority enums and never share data.

The AI reasoning chain (`AIReasoningService.reason()`) escalates Local → Home → Cloud strictly in order, stopping at first success: `LocalProvider` always returns `unavailable` (honest stub for v0.19.x); `HomeProvider` probes Ollama via the same-origin `/ollama` proxy (avoids CORS), 60s timeout, retries once without `think:false` on HTTP 400; `CloudProvider` requires a stored key + `allowCloud:true`, supports Anthropic/OpenAI/Gemini/Other. The "honest escalation trail" is a `{tier, outcome, detail}` array built as each tier is actually attempted, surfaced in `AIStatusPanel`. **Confirmed no API keys in repo/bundle** — `AIProviderConfig` stores keys in `localStorage` per-origin only; the sole embedding path is an optional gitignored `.env.local` → `VITE_CLOUD_AI_KEY`, and no `.env*` files were actually found on disk in this pass.

**For v0.16/v0.17:** `DecisionContext.identity` already carries `known/trusted/protected/blocked/requiresTrustedUserConfirmation`, and `DecisionContext.personal` carries `profileActive/highestPriority/markers` — both are already consumed by scoring/notification-gating. Face Recognition's job is populating `pipelineResult.identity`/`personalObservation` correctly; no downstream scoring/notification code needs to change. For v0.17 (Protected User Alerting), `NOTIFICATION_TARGET.TRUSTED_CONTACT` and a `protected-user-assistive` notification profile already exist as data structures, but every non-local delivery target (robot_voice, galaxy_watch, trusted_contact, cloud_service) is `planned`/`optional` with no actual delivery mechanism — that's the real build for v0.17.

### 3.4 Conversation / Voice

`NaturalConversationEngine.processTurn()` (confirmed as the actual engine class, imported via `services/conversation/index.js`) runs `ConversationSessionService → WorkingMemoryService (read-only reseed) → BehaviourLearningService.observe() (silent) → ConversationHistoryService → ConversationContextService → ReferenceResolver → ConversationPlanner` on every chat turn — unconditionally, regardless of what the local canned-reply path already produced. `ChatConversationBridge` only lets the engine's text win if the local reply is the literal generic-fallback marker string (`'How would you like me to assist?'`, defined in `marsConfig.jsx:174`) AND the plan action is in a specific allowlist (`CANCEL_ACTION`/`CONTINUE_PREVIOUS_ACTION`/`ASK_CLARIFYING_QUESTION`/`ROUTE_TO_VISION` — notably excluding `ROUTE_TO_VOICE_COMMAND` and `ROUTE_TO_MEMORY`). `ChatReasoningBridge` escalates to `AIReasoningService` only if the reply is *still* the generic marker at that point, optionally attaching `PersonalContextService`'s per-tier bundle.

The regression guard that keeps memory-writing exclusive to typed chat commands is real and verified two ways: (1) ordering — `createMemoryAwareReply()` (the only writer) runs and returns before the engine is even called, and none of its outputs can ever equal the generic marker string, so they're structurally un-overridable; (2) content — `NaturalConversationEngine` itself contains no `.remember()` call anywhere, only reads (`getActivePersonId`, `getStatus`) and working-memory seeding (never written back).

Voice is confirmed to be two genuinely separate systems: the Chat tab's real voice (`VoiceInput.jsx` using actual browser `SpeechRecognition`, feeding the exact same `ChatPanel.sendMessage` path as typed text) versus the Voice tab's fully simulated command-routing system (`WakeWordService → VoiceIntentParser/Registry → VoiceCommandRouter → VoiceResponseService`, entirely typed-transcript, zero imports from conversation or memory anywhere in `services/voice/`). The only shared code between them is `SpeechCapabilityService`'s browser-capability detection.

**For v0.16:** mostly orthogonal. `ConversationPlanner` already routes "who/see/look" phrasing to `ROUTE_TO_VISION`, so face recognition plugs in underneath that existing plan branch without touching conversation code. If face recognition wants to set the conversation's `currentPerson` from a vision event rather than inferred text, `ConversationContextService.updateContext` already accepts arbitrary partial overrides — a small additive change.

### 3.5 Memory Intelligence

Confirmed in full detail against the store: `MemoryIntelligenceService` is `localStorage['mars_memory_v3']`, person-scoped, with `resolvePersonId()` precedence `explicit → activePersonId → defaultPersonId`. Traced every write path in the codebase — there are exactly three call sites that reach `remember()`: (1) `ChatPanel.jsx`'s person-tagged `"remember X's Y is Z"` command, direct call; (2) `ChatPanel.jsx`'s legacy untagged `"remember my Y is Z"` command via the `components/mars/memory.js` shim; (3) `WorkingMemoryService.promote()` and `BehaviourLearningService.confirmCandidate()`, both routed through `CapabilityRouter.route({capability:'memory', memoryOp:'write'})` — **`CapabilityRouter.js` does exist** (`services/conversation/CapabilityRouter.js`) and is wired for this specific path, contrary to a slight ambiguity in the prior handoff notes; it's just not called anywhere else in the turn loop. Confirmed: `WorkingMemoryService.promote()` has zero production call sites (only unit tests) — it's a ready-but-unwired capability, not a bug. Confirmed: `BehaviourLearningService`'s "never store a safety fact, never store without confirmation" rule is enforced twice (at `propose()` and again at `confirmCandidate()`), and the only real call site for `confirmCandidate()` is the Confirm button in `MemoryIntelligencePanel.jsx` — a genuine human action.

The v1→v2→v3 migration was traced end to end and confirmed loss-free: legacy and v2 stores are only ever read, never deleted, and migration runs once (short-circuits once `persons` exists in v3). One edge case: if both legacy and v2 exist with v3 absent, v2 wins and legacy is silently not merged in (though also not destroyed).

`setActivePerson()`/`getActivePersonId()` — confirmed `getActivePersonId()` already has three real production callers (`NaturalConversationEngine` every turn, `ChatReasoningBridge` for AI context selection, `useMemoryIntelligence` for the UI preview), while `setActivePerson()` itself has **zero production call sites** today — only exercised in `MemoryIntelligenceSmokeTest.test.js`. This confirms it's a well-prepared, fully wired-on-the-read-side hook: v0.16 needs only to call `setActivePerson(id)` once per confirmed recognition event, and personal context, working-memory seeding, and behaviour-learning attribution all follow automatically with no other code changes required.

### 3.6 App shell / routing / top-level UI

`App.jsx` is a two-route `BrowserRouter` (`/` and `*` → `Control`, `/showcase` → `Home`); `Control.jsx` is the real app — a single mobile-width page with 11-tab local `useState` navigation (no URL sync, so no deep-linking or back/forward between tabs). `services/capabilityState.js` is confirmed as the shared `LIVE`/`WAITING`/`SIMULATION` vocabulary consumed by `CapabilityStateBadge.jsx` across 8 panels — it's a shape/enum module, not a flag store itself. A root `README.md` **does exist** at `mars-standalone/README.md` (documenting the Base44-stripped standalone rebuild) — this contradicts the project docs' note that "repo has no root README," which should be corrected in the living reference docs. `package.json` confirms `@mediapipe/tasks-vision@^0.10.35`, React 18.2, react-router-dom 6.26, framer-motion, tailwind, and scripts `dev`/`build`/`test`/`smoke`/`release-check` (`test && build`)/`validate` (alias) exactly as documented. No `.env*` files exist on disk. `vite.config.js` confirms the `/ollama` proxy (forwards to `localhost:11434`, strips `Origin` header) applied to both dev and preview servers.

---

## 4. Cross-cutting themes

**Simulation-first, honestly labeled.** Nearly every panel/hook in Decision, Notification, Behaviour, Identity, and Voice runs on hardcoded scenario data today, not live pipeline output — and the codebase is explicit about this everywhere (`CAPABILITY_STATE.SIMULATION`, `medicalDiagnosis: false`, "not implemented yet" stubs with clear comments rather than silent fake behavior). This is a deliberate, consistent engineering pattern across the whole project, not sloppiness.

**Identity is the seam everything is waiting on.** Vision produces real per-frame data; Decision, Notification, and Behaviour all already have the plumbing to consume a real `identity` result (protected/trusted/known flags, personal-profile activation) — but because `IdentityTrackingService` hardcodes zero identity confidence, none of those consumers have ever seen a real match. v0.16 is genuinely the single unlock that makes several already-built downstream systems start operating on real data instead of demo scenarios.

**Users/permissions subsystem is built ahead of its integration point.** `services/users` is complete and well-designed but has no live caller anywhere in the app. Worth deciding, perhaps alongside v0.16 or v0.17, whether to wire `UserManager.registerFromIdentity()` in, or to intentionally continue treating `PersonRegistry`'s own trust/protection flags as the single source of truth and eventually retire the parallel Users layer.

**Memory's face-recognition hook is genuinely ready, not a stub with a nice comment.** This was independently confirmed by direct trace of every `setActivePerson`/`getActivePersonId` call site — the read side is fully wired into the conversation engine and AI reasoning bridge today; only the write trigger is missing.

---

## 5. What this means for v0.16 specifically (recap, now doubly confirmed)

The scoping doc already delivered (`docs/engineering/V0.16_SCOPING_Face_Recognition.md`) holds up against this deeper pass. The two concrete, file-and-line-confirmed facts worth carrying forward:

- The only code that needs to change to make identity "real" is `IdentityTrackingService.updateFromPerception` (populate `identityConfidence` and `candidateProfiles` instead of hardcoding them to `0`/`[]`) plus a new face-recognition-producing engine feeding it. Everything downstream (`IdentityStateMachine`, `DecisionContext.identity`, `PriorityEngine`'s personal adjustment, `NotificationPolicy`'s protected-user routing, `BehaviourRiskScoring`'s protected-user bonus) already consumes a real `matchedProfile`/`identityResult` correctly — none of it needs to change.
- `MemoryIntelligenceService.setActivePerson(personId)` is the payoff call, fully ready, with zero other code changes needed on the read side.

---

## 6. Persistence map (what survives a reload today)

- **Persisted (localStorage):** Memory Intelligence store (`mars_memory_v3`), AI provider config/keys (`mars_ai_provider_config_v2`).
- **Everything else is in-memory only:** all Vision/Behaviour/Identity rolling state and history, Conversation session/history/context, Voice wake-word/command state, Notification history/queue, Diagnostics snapshots, `LivePipelineStore`. A page reload resets all tracking IDs, conversation sessions, behaviour history, and notification history — only remembered facts and AI provider settings survive.

---

## 7. Findings worth a cleanup pass (not blockers, collected from all six reviews)

### 7.1 Parallel/duplicate implementations of the same concern
- Two independent notification pipelines (`createFromDecision`→`NotificationPolicy`→`NotificationQueue` vs. `evaluateDecision`→`NotificationEngine`→`NotificationProfiles`), non-interoperable priority enums, only the second is UI-wired.
- Three independent "is this person protected" checks (`PersonRegistry`/`IdentityStateMachine`, `services/users/ProtectedUserService`, `services/behaviour/ProtectedBehaviourPolicy`) with no shared source of truth.
- Two AI "which provider handles this" systems (`LocalAIDecisionService`/`AIStatusService`, legacy v0.9.x capability router vs. `AIReasoningService`/`AIProviderConfig`, v0.14.4 reasoning router) — unclear if the legacy one still has callers.
- `CameraPreviewPanel.jsx` and `VisionPanel.jsx` both independently manage camera lifecycle and render near-identical pipeline dumps — worth confirming one is legacy.
- `BehaviourProfileMatcher`'s user-defined "Behaviour Library" labels never feed into `BehaviourRiskScoring`'s numeric score — they can disagree with each other.

### 7.2 Unwired-but-real code (not bugs, just not yet connected)
- `UserManager.registerFromIdentity()`/`resolveUserContext()` — never called.
- `WorkingMemoryService.promote()`/`noteAndPromote()` — never called outside tests.
- `CapabilityRouter`'s voice/vision/identity/robot branches — no call sites found in this review's scope.

### 7.3 Likely actual bugs
- `IdentityPanel.jsx` destructures `capabilityState`/`clearSimulation` from `useIdentityFoundation()`, but the hook never returns either — both will be `undefined`.
- `DecisionPanel.jsx` references `decision.dataState`/`decision.dataStateLabel`, which `useDecisionIntelligence.js` never returns — dead UI branch.
- `useVisionDiagnostics.getFaceState` reads a `faceFoundation.state` field that `FaceFoundationEngine` never emits.
- `DiagnosticsManager.evaluateNotificationStatus` has a redundant ternary where both branches return the same value (`DiagnosticsManager.js:458`) — status is always `READY` regardless of the condition.
- Unreachable `SEARCHING`/`DETECTED` identity states — defined in `IdentityTypes`, referenced by observation-building code, but `IdentityStateMachine.evaluate()` can never actually produce them.
- `ROUTE_TO_MEMORY` conversation-plan branch builds a real response every turn but can never surface in chat (excluded from the override allowlist, and "remember" messages are almost always intercepted earlier anyway).

### 7.4 Documentation drift
- Project docs state "no root README" — one exists at `mars-standalone/README.md`.
- `ConversationPanel.jsx`'s own footer text claims live chat doesn't route through the conversation engine — false since v0.14.3.
- `AIReasoningService.js`'s header comment says Cloud tier is "Claude API" only — `CloudProvider.js` actually supports four providers.
- `MK2Roadmap.jsx`/`marsConfig.jsx`/`FeaturesGrid.jsx` hardcode capability/roadmap claims with no shared link to the MVCH source of truth — a manual-sync risk if the roadmap changes.

### 7.5 Minor/cosmetic
- `PoseDetectionService` fetches MediaPipe assets from `@latest`/`latest` CDN paths — no version pinning, a stability risk independent of correctness.
- `DashboardPanel.jsx`'s pan/tilt D-pad buttons have no `onClick` handlers (decorative stub, consistent with "bridge not connected" framing).
- `Control.jsx`'s bottom-nav button order doesn't match its tab-content render order (cosmetic only).
- `typescript` is listed as a runtime dependency rather than devDependency despite an all-`.jsx`/`.js` codebase.

---

## 8. What I could not verify this pass

The shell/sandbox VM failed to start again this session (same as the prior session), so I could not run `npm test`, `npm run build`, or `git status`/`git log` myself. All findings above come from direct file reads, not from executing the code or the test suite. Recommend running `npm run release-check` and `git status` next session to confirm the 191-test baseline still holds and that `main` was fast-forwarded, before starting any v0.16 build work.
