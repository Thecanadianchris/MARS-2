# MARS Software Project — Engineering Backlog

Status: living document — append/update as items are found or resolved. Source: the 13 July 2026 full-codebase architecture review (`MARS_Full_Codebase_Architecture_Review_2026-07-13.md`), plus anything found afterward. This doc exists so findings from a review don't get lost between sessions — check it before starting a new milestone in case something here overlaps.

---

## Resolved (13 July 2026, pre-v0.16 cleanup batch)

- `DiagnosticsManager.evaluateNotificationStatus` — removed a redundant ternary where both branches returned `DIAGNOSTIC_STATUS.READY`; now a plain constant.
- `PoseDetectionService` — pinned the MediaPipe CDN paths that were previously using `@latest`/`latest` (unversioned, a stability risk): WASM now pinned to `@0.10.35` (matches the installed npm package version), pose model pinned to the numbered `float16/1/` path instead of `float16/latest/`.
- `AIReasoningService.js` header comment — corrected "CLOUD_AI — Claude API" to reflect the actual v0.14.4 multi-provider support (Claude/ChatGPT/Gemini/custom OpenAI-compatible endpoint).
- `ConversationPanel.jsx` footer copy — corrected the stale claim that live chat doesn't route through the Natural Conversation Engine (it has, via `ChatConversationBridge`, since v0.14.3).
- `package.json` — moved `typescript` from `dependencies` to `devDependencies` (no `.ts`/`.tsx` files exist in the codebase; it's a tooling dependency only).
- `SESSION_HANDOFF_2026-07-12.md` — struck the "repo has no root README" note; `mars-standalone/README.md` exists.

---

## Resolved (13 July 2026, v0.16 Face Recognition Foundation build)

- **`SEARCHING` identity state wired.** `IdentityStateMachine` now accepts `attemptingRecognition`; `IdentityEngine.isAttemptingRecognition()` computes it from the tracked face's `framesSeen` against a 3-frame patience window (`IDENTITY_RECOGNITION_PATIENCE_FRAMES`) before falling back to `UNKNOWN`.
- **Canonical "protected" source confirmed, not touched.** Face recognition reads/writes only through `PersonRegistry`/`IdentityEngine`; no new protected-status check was introduced. The pre-existing triplication (`services/users/ProtectedUserService`, `services/behaviour/ProtectedBehaviourPolicy`) is unchanged and still on the list below.
- **Camera-agnostic by convention, honoured.** `FaceRecognitionService`/`FaceLandmarkService` take a frame/landmarks as input; neither reaches into `CameraService`'s singleton state, so the future multi-camera phase (below) isn't harder to retrofit than it already would have been.
- **`useIdentityFoundation.js` bug fixed.** Was missing `capabilityState`/`clearSimulation` from its return object despite `IdentityPanel.jsx` destructuring both — found in the architecture review, fixed while touching this code for v0.16.

Still open, not part of v0.16's scope:

- **Face enrollment persistence decision.** `FaceEnrollmentStore` is in-memory/session-only for this milestone (consistent with the rest of Vision/Identity). v0.16.1 (Face Registration & Known Person Database) needs to decide whether enrolled signatures should survive a reload, and if so, where (likely alongside `MemoryIntelligenceService`'s `localStorage` pattern, on-device only).
- **Live-camera verification still pending.** `npm run release-check` is DONE (13 July, Christian — 40 files/211 tests, all passing, build PASS, exact match to projection). What's left before this milestone is marked ✅ Complete in the MVCH: a real live-camera pass (enroll a face via `FaceRecognitionService.enroll()` from the console, confirm live recognition reaches `KNOWN`/`TRUSTED`/`PROTECTED` and the MEM-I panel's active person actually changes), then `git commit`/`push`. Currently 🚧 In Progress precisely to avoid repeating the v0.14.2 mistake (marked complete before ever being verified).
- **Minor, not new to this milestone:** the production build now flags the JS bundle (821.56 kB / 229.34 kB gzip) as over Vite's 500 kB chunk-size warning. `@mediapipe/tasks-vision` was already a dependency; v0.16 just added a second consumer of it (`FaceLandmarkService`). Worth a code-splitting pass eventually, not urgent.

---

## Genuine bugs — fix opportunistically, not urgent

- ~~`IdentityPanel.jsx`/`useIdentityFoundation()` missing `capabilityState`/`clearSimulation`~~ — fixed 13 July during the v0.16 build (see above).
- `DecisionPanel.jsx` references `decision.dataState`/`decision.dataStateLabel`, which `useDecisionIntelligence.js` never returns — dead/unreachable UI branch, renders as `undefined`.
- `useVisionDiagnostics.getFaceState` reads a `faceFoundation.state` field that `FaceFoundationEngine` never actually emits (its shape is `head.orientation`/`faceDetected`, no top-level `state`) — the face-state chip on the Vision diagnostics card is effectively always showing the wrong/fallback value.
- `ROUTE_TO_MEMORY` conversation-plan branch builds a real response every turn but can never surface in chat (excluded from `ChatConversationBridge`'s override allowlist, and "remember" messages are almost always intercepted earlier by `createMemoryAwareReply` anyway) — low priority, functionally inert today.

---

## Larger deferred cleanups (real, but don't interrupt the roadmap for these)

- **Two parallel, non-interoperable notification pipelines** (`createFromDecision`→`NotificationPolicy`→`NotificationQueue` vs. `evaluateDecision`→`NotificationEngine`→`NotificationProfiles`/`NotificationTargets`). Only the second is wired to any UI. Recommendation: consolidate when v0.17 (Protected User Alerting) forces a decision on real delivery channels anyway — don't do it twice.
- **`services/users` (roles/permissions) is fully built but has zero live callers.** `UserManager.registerFromIdentity()`/`resolveUserContext()` are never invoked anywhere in the app; `PersonRegistry`'s own flags are what actually drive behaviour. Decide: wire it in, or formally mark it as not-yet-integrated and keep `PersonRegistry` as the source of truth. Don't grow v0.16's scope to answer this unless it turns out to matter for pending-profile confirmation permissions.
- **`CameraPreviewPanel.jsx` and `VisionPanel.jsx` appear to duplicate the same live-camera UI** (both independently manage camera lifecycle + render near-identical pipeline dumps). Confirm whether one is legacy before deleting either.
- **`BehaviourProfileMatcher`'s user-defined "Behaviour Library" labels never feed into `BehaviourRiskScoring`'s numeric score** — a user-defined profile and the risk engine can disagree about the same observation with no reconciliation. Product decision needed on whether user-defined labels should ever override/adjust the numeric score.
- **Two independent "which AI handles this" systems**: `LocalAIDecisionService`/`AIStatusService` (legacy v0.9.x capability router) vs. `AIReasoningService`/`AIProviderConfig` (v0.14.4 reasoning router). Confirm whether the legacy one still has callers before considering removal.
- **`Control.jsx`'s bottom-nav button order doesn't match its tab-content render order** — cosmetic only, but easy to lose track of when adding future tabs (e.g. a Face Recognition diagnostics tab in v0.16.3).

---

## Roadmap addition: Multi-camera / distributed monitoring

Raised 13 July 2026 (Christian): extend MARS beyond the single S22-mounted camera to WiFi/Bluetooth pan-tilt cameras placed around the house, so monitoring isn't limited to whatever room the robot is physically in.

**Where this sits relative to current work:** this is a separate future phase, not part of v0.16. v0.16 (Face Recognition) and v0.17 (Protected User Alerting) both currently assume a single active camera source feeding one `VisionPipeline`. The right shape for a multi-camera system is: one MARS "brain" (identity/memory/decision/notification — all already person/session-scoped, not camera-scoped) consuming a stream of per-camera perception results, each tagged with a camera/location id, rather than one hardcoded camera. That's a moderate `CameraService`/`FrameCaptureService`/`VisionPipeline` refactor (they're currently singletons with no camera-id concept) plus a pairing/discovery UI for adding cameras, and is naturally easier to build once Identity (v0.16) already resolves a `personId` independent of which camera saw them — so a person recognized in the kitchen camera and later the hallway camera can resolve to the same active person.

**Recommendation:** treat this as its own roadmap phase, positioned after Face Recognition and Protected User Alerting are live (so multi-camera has a real identity/alerting system to plug into), not before. Added to the MVCH as **Phase 9 — Multi-Camera / Distributed Monitoring**, `v0.18.x`, sitting between Phase 8 (Protected User Alerting) and Robot Control — Christian's call, 13 July 2026, since it's a pure software/sensor extension that belongs before the hardware-control phases. Robot Control/Android/Mk1 Release were renumbered accordingly (now v0.19.x/v0.20.x/v0.21.x). Milestones: Camera Discovery & Pairing Foundation → Per-Camera Vision Pipeline (camera-id-tagged perception) → Cross-Camera Identity Continuity → Monitoring Dashboard (multi-feed). See `MVCH_Master_Version_Control_History.md`.

**What to do now, if anything:** nothing required for v0.16. The one thing worth keeping in mind while building Face Recognition: don't hardcode "the camera" in new code in a way that would require a rewrite later — e.g. if a new face-recognition service takes a frame, keep it agnostic to where that frame came from rather than reaching into `CameraService`'s singleton state directly. This is a design-awareness note, not new scope.
