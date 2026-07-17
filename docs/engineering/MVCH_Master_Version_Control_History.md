# MARS SOFTWARE PROJECT
## Master Version Control History (MVCH)
### Engineering Release Timeline

Document ID: MVCH-001
Status: Living document — updated as each version is completed
Purpose: Permanent, single-source record of every MARS software version, completed and planned. To be included in every future engineering handover so anyone joining the project can immediately understand where MARS has been, its validated milestones, and the roadmap to the Mk1 production release.

---

# PHASE 0 — Project Foundation

| Version | Status | Date | Description |
|---|---|---|---|
| **v0.0.0** | ✅ Complete | 26 June 2026 | MARS software project created. Initial repository, engineering standards, architecture discussions and project vision established. |
| **v0.1** | ✅ Complete | 26 June 2026 | React/Vite application foundation, project structure and initial dashboard created. |
| **v0.2** | ✅ Complete | 26 June 2026 | User interface framework, navigation and panel architecture established. |
| **v0.3** | ✅ Complete | 26 June 2026 | Core service layer introduced, modular software architecture adopted. |
| **v0.4** | ✅ Complete | 26 June 2026 | AI provider abstraction and early service interfaces investigated. |
| **v0.5** | ✅ Complete | 26 June 2026 | Camera framework planning and early diagnostics groundwork. |
| **v0.6** | ✅ Complete | 27 June 2026 | Vision processing prototypes and engineering standards refined. |
| **v0.7** | ✅ Complete | 27 June 2026 | Camera services expanded, diagnostics framework evolved. |
| **v0.8** | ✅ Complete | 27 June 2026 | Modular architecture consolidated, testing framework introduced. |
| **v0.9** | ✅ Complete | 27 June 2026 | Preparation for live vision pipeline and observation architecture. |

---

# PHASE 1 — Vision Intelligence

| Version | Status | Date | Description |
|---|---|---|---|
| **v0.10** | ✅ Complete | 28 June 2026 | Vision Foundation. Camera pipeline, pose detection framework, body state architecture. |
| **v0.10.1** | ✅ Complete | 28 June 2026 | Camera services expanded. |
| **v0.10.2** | ✅ Complete | 28 June 2026 | Frame capture and processing improvements. |
| **v0.10.3** | ✅ Complete | 28 June 2026 | Vision pipeline restructuring. |
| **v0.10.4** | ✅ Complete | 28 June 2026 | Pose detection integration. |
| **v0.10.5** | ✅ Complete | 28 June 2026 | Body state engine introduced. |
| **v0.10.6** | ✅ Complete | 28 June 2026 | Movement analysis improvements. |
| **v0.10.7** | ✅ Complete | 28 June 2026 | Vision diagnostics and validation. |

---

# PHASE 2 — Observation Intelligence

| Version | Status | Date | Description |
|---|---|---|---|
| **v0.11** | ✅ Complete | 28 June 2026 | Observation Layer introduced. |
| **v0.11.1** | ✅ Complete | 28 June 2026 | Observation Registry standardised. |
| **v0.11.2** | ✅ Complete | 29 June 2026 | Observation stream improvements. |
| **v0.11.3** | ✅ Complete | 29 June 2026 | Personal observation engine. |

---

# PHASE 3 — Decision Intelligence

| Version | Status | Date | Description |
|---|---|---|---|
| **v0.12** | ✅ Complete | 29 June 2026 | Decision Intelligence Foundation. |
| **v0.12.1** | ✅ Complete | 29 June 2026 | Decision services expanded. |
| **v0.12.2** | ✅ Complete | 29 June 2026 | Decision Integration completed. |
| **v0.12.3** | ✅ Complete | 30 June 2026 | Performance optimisation. |
| **v0.12.4** | ✅ Complete | 30 June 2026 | Testing, stabilisation and release candidate. |

---

# PHASE 4 — Identity & Behaviour Intelligence

| Version | Status | Date | Description |
|---|---|---|---|
| **v0.13.0** | ✅ Complete | 1 July 2026 | Identity Foundation. |
| **v0.13.1** | ✅ Complete | 2 July 2026 | Identity Tracking. |
| **v0.13.2** | ✅ Complete | 3 July 2026 | User Management & Notifications. |
| **v0.13.3** | ✅ Complete | 4 July 2026 | Behaviour Intelligence Foundation. |
| **v0.13.4** | ✅ Complete | 5 July 2026 | Diagnostics UI Integration. |
| **v0.13.5** | ✅ Complete | 6 July 2026 | Live Pipeline Wiring. |
| **v0.13.6** | ✅ Complete | 6 July 2026 | Diagnostics Stabilisation. 15 test files, 54 tests, Build PASS, Release Check PASS, UI PASS. |

---

# PHASE 5 — Voice Intelligence

| Version | Status | Date | Description |
|---|---|---|---|
| **v0.14** | ✅ Complete | 6 July 2026 | Voice Intelligence Foundation. |
| **v0.14.1** | ✅ Complete | 6 July 2026 | Wake Word & Command Routing. |
| **v0.14.1.1** | ✅ Complete | 6 July 2026 | Voice Response Layer. |
| **v0.14.2** | ✅ Complete | 9 July 2026 | Natural Conversation Engine (Steps 1–2). Conversation sessions, context, history, reference resolution, planner, diagnostics panel — both steps built, tested, and UI-verified live. Chat routing was shared with the engine starting in v0.14.3 (cancel/confirm/clarify/vision cases); memory routing remains local-only by design. Diagnostics-panel baseline: 29 test files, 99 tests, Build PASS, Release Check PASS, UI PASS. |
| **v0.14.3** | ✅ Complete | 11 July 2026 | Voice Diagnostics & Audio Pipeline. `SpeechCapabilityService` (real Speech-to-Text/Text-to-Speech browser support, surfaced on VoicePanel and VoiceService/VoiceDiagnosticsService without disturbing the existing simulated-layer flags), and `ChatConversationBridge` — a regression-safe layer wiring `NaturalConversationEngine` into live ChatPanel so it now handles cancel, confirm/continue, clarify, and vision-routing turns, while real memory commands remain fully protected and untouched. 31 test files, 109 tests, Build PASS, Release Check PASS, UI PASS (verified live: memory preserved, new conversational responses confirmed, zero console errors). |
| **v0.14.4** | ✅ Complete | 11 July 2026 | AI Reasoning Layer. Pulled forward from v0.19.3. Three-tier escalation chain, real: `LocalProvider` (S22, honest stub until v0.19.x) → `HomeProvider` (real Ollama client for the Snapdragon X base station, live probe-based availability) → `CloudProvider` (real Claude API client). `AIReasoningService` router returns an honest escalation trail on every call. Key handling resolved: runtime entry via the rebuilt MARS Intelligence panel, localStorage only, direct browser call with Anthropic's CORS opt-in header — never in repo or bundle. Chat wired via `ChatReasoningBridge`: only generic-fallback turns escalate; memory commands and canned replies structurally protected (same guarantee as v0.14.3). Multi-provider cloud dropdown (Claude/ChatGPT/Gemini/Other) with one key per provider and optional `.env.local` seed. End-to-end verified live 12 July 2026: Home tier (Ollama ARM64, qwen3.5:4b via same-origin Vite proxy) and Cloud tier (Claude, first real AI response in MARS history) both answered with honest escalation trails; chat answers general questions via HOME_AI_SERVER while memory stays local. 33 test files, 130 tests, Build PASS, Release Check PASS, UI PASS. | |

---

# PHASE 6 — Memory Intelligence

| Version | Status | Date | Description |
|---|---|---|---|
| **v0.15** | ✅ Complete | 12 July 2026 | Memory Intelligence Foundation. Real `MemoryIntelligenceService` store with a richer schema, loss-free migration, absorbed the Notes/`memory.js` store via a regression-safe shim (ChatPanel/Notes untouched), honest conversation-layer read-wiring, and the MEM-I diagnostics panel. |
| **v0.15.1** | ✅ Complete | 12 July 2026 | Person-Scoped Memory (Multi-User). Memory keyed by an unbounded `personId` (owner default + explicit "remember Finley's X" person tags), a face-recognition-ready `setActivePerson` hook, chained v2→v3 migration, and a per-person MEM-I view. Pulled in ahead of the originally-planned Short-Term engine because the multi-user monitoring requirement surfaced. Committed with v0.15 in one commit. 35 test files, 155 tests, Build PASS, Release Check PASS, UI PASS. |
| **v0.15.2** | ✅ Complete | 12 July 2026 | Short-Term Memory Engine. `WorkingMemoryService` bridges the conversation session/context layer to the long-term store: seeds the active person's facts on session start, and promotes working items to long-term through the first genuine `CapabilityRouter` memory-write dispatch. Regression-guarded so the engine's per-turn processing never writes (ChatPanel stays the typed-chat writer). 36 test files, ~162 tests, Build PASS, Release Check PASS, UI PASS. |
| **v0.15.3** | ✅ Complete | 12 July 2026 | Long-Term Memory Engine. Pure `MemoryClassifier` + `LongTermMemoryEngine`: auto-categorisation (incl. a protected `safety` category), access-based salience ranking, and a safety-aware retention policy. Explicit and safety facts are never auto-forgotten — verified no-op retention on today's data. 37 test files, ~174 tests, Build PASS, Release Check PASS, UI PASS. |
| **v0.15.4** | ✅ Complete | 12 July 2026 | Personal Context. `PersonalContextService` injects the active person's identity + salience-ranked facts into the v0.14.4 reasoning chain so MARS's LLM answers are person-aware. Privacy posture is **on-prem only** — Local/Home tiers get the context, the Cloud (Claude) tier gets none, and safety facts never leave the device. Additive to `reason()` and regression-guarded. 38 test files, 182 tests, Build PASS, Release Check PASS, UI PASS. |
| **v0.15.5** | ✅ Complete | 12 July 2026 | Behaviour Learning (Inferred Facts). `InferenceParser` + `BehaviourLearningService`: MARS infers facts from conversation ("I love gardening") and from repeated behaviour-engine signals, as **confirm-gated candidates** (identity-style pending→confirmed). Two hard rules: inference never creates a `safety` fact, and nothing is stored/recalled until a human confirms. Confirmed facts are `source: 'inferred'`, confidence <1 (first real users of the v0.15.3 decay path). Silent observation never alters a chat reply. 39 test files, 191 tests, Build PASS, Release Check PASS, UI PASS. |

---

# PHASE 7 — Face Recognition

| Version | Status | Date | Description |
|---|---|---|---|
| **v0.16** | ✅ Complete | 14 July 2026 | Face Recognition Foundation. `RecognitionCandidate`/`SEARCHING` state/`setActivePerson()` payoff wired and live-verified. Matcher upgraded same day from landmark-geometry ratios to a real on-device face-embedding model (`@vladmandic/face-api`, 128-d descriptors) after a live test showed the geometry approach misidentified an unenrolled person (Ann) as the only enrolled profile (Christian). `npm run release-check` PASS (14 July, post-upgrade, post-`vite.config.js` module-resolution fix): all suites green, build PASS. Committed and pushed to `feature/v0.13.0-identity-foundation`. See `ENGINEERING_BACKLOG.md` for the full account, including the "Known safety-relevant limitation" entry. |
| **v0.16.1** | ✅ Complete | 14 July 2026 | Face Registration & Known Person Database. Built same day, before the Ann re-test, so both people could be enrolled through the real product UI instead of devtools. `FaceEnrollmentPanel.jsx` (Identity tab) + `useFaceEnrollment.js` hook; `FaceEnrollmentStore` now persists to `localStorage` (on-device only, same pattern as `MemoryIntelligenceService`). `npm run release-check` PASS. Live two-person (Christian + Ann) discrimination test PASS via the real UI — the embedding-matcher fix holds up in practice. Known gap carried into the backlog: enrollment only captures 4 near-identical frontal frames (no pose/distance variation), and recognition only ever looks at one face per frame (no simultaneous multi-person identification). |
| **v0.16.4** | 🚧 In Progress | 16 July 2026 | Multi-Person Simultaneous Recognition & Live Video Overlay. `FaceEmbeddingService.detectFaces()` switched from `detectSingleFace` to `detectAllFaces` — every face in frame now gets a descriptor + bounding box + landmark points, sorted largest-first so the existing single-primary-person trust/memory-activation pipeline (`IdentityTrackingService`/`IdentityEngine`/`MemoryIntelligenceService.setActivePerson()`) is untouched and keeps working exactly as before. New `FaceRosterService` builds a lightweight per-frame "who's on screen" roster (box + name + confidence) for display only — reuses `FaceRecognitionService.matchBest()`, never feeds the trust/pending-profile machinery. New `VisionFaceOverlay.jsx` draws a live bounding box + name label per detected face directly on the video feed (Vision tab), plus a landmark-point overlay on the primary face while an enrollment capture is running (`FaceCaptureUiStore`, a small cross-tab signal). Not yet ✅: `npm run release-check` and live multi-person UI verification are still pending. |
| **v0.16.5** | 🚧 In Progress | 16 July 2026 | Guided Multi-Pose Enrollment. `useFaceEnrollment.js` replaced the blind "4 frames 600ms apart" capture with a 5-step guided pose sequence (frontal, turn left, turn right, chin down, step back), each shown to the person via a new `currentStepLabel` the `FaceEnrollmentPanel.jsx` UI now displays. `FaceEnrollmentStore`'s `MAX_SAMPLES_PER_PERSON` raised 5 → 10 to hold that pose diversity. Addresses the gap Christian identified during the v0.16.4 live test: enrollment previously gave the matcher no real pose/distance variation to match against. Not yet ✅: `npm run release-check` and a live guided-enrollment UI test are still pending. |
| **v0.16.6** | 🚧 In Progress | 16 July 2026 | Enrollment Camera Preview & Quality-Gated Capture. Two more issues Christian found live-testing v0.16.5: no way to see yourself while enrolling from the Identity tab, and each pose step advanced on a blind timer regardless of whether a usable frame actually landed. New `CameraStreamStore` lets the same live `MediaStream` feed a second `<video>` element; new `EnrollmentCameraPreview.jsx` renders a floating pop-up feed (with the same box/name/landmark overlay) on the Identity tab while a capture runs. `useFaceEnrollment.js`'s `waitForUsableFrame()` actively polls for the next genuinely new processed frame carrying a face embedding (by `performance.processedFrameCount`, so stale pre-instruction frames are never reused) instead of sleeping a fixed duration, and shows a "Captured!" confirmation (`stepStatus`) before advancing. Live-tested twice (re-enrolling Christian, re-enrolling Ann) with no console errors — pop-up rendered correctly, samples landed (10 and 9 respectively), test enrollments cleaned up afterward. Not yet ✅: `npm run release-check` is still pending. |
| **v0.16.7** | 🚧 In Progress | 16 July 2026 | Voice-Narrated Enrollment. Even with `stepStatus` confirmation, Christian found the pacing "still way too quick." New `services/voice/SpeechOutputService.js` (a reusable text-to-speech wrapper, extracted from `ChatPanel.jsx`'s inline `speak()`, same `en-GB`/rate 0.95/pitch 0.9 voice) narrates each pose instruction aloud in `useFaceEnrollment.js`, and the step genuinely waits for speech to finish before checking for a usable frame — real speech duration paces the wait instead of a fixed guessed constant, and it answers "what is required" out loud, not just as on-screen text. Includes a spoken intro line and a spoken wrap-up. `speak()` never hangs indefinitely (length-based fallback timeout) even if the browser never fires the speech-end event. Live-tested (enrolling Finley) with no console errors. Not yet ✅: `npm run release-check` is still pending. |
| **v0.16.8** | 🚧 In Progress | 16 July 2026 | Add New People. Christian asked "how can we add more users" — until now the only local profiles were the three seeded ones (Christian/Ann/Finley), hardcoded in `PersonRegistry.js` with no way to add anyone else. New `PersonRegistry.addProfile()`/`removeProfile()` let the owner add a named person directly (Trusted User / Protected User / Guest — never Owner) from a new `AddPersonPanel.jsx` on the Identity tab, with a unique id generated from the display name. Any profile beyond the three defaults now persists to `localStorage['mars_person_registry_v1']` (same on-device-only pattern as `FaceEnrollmentStore`) — previously only enrolled face samples survived a reload, not the profile they belonged to, which would have orphaned them. `FaceEnrollmentPanel.jsx` already renders an Enroll button for every profile `PersonRegistry` knows about, so a newly added person is immediately enrollable with no further wiring. 5 new smoke tests (reject empty name, add + list immediately, never becomes Owner, unique id on duplicate names, remove added person but refuse to remove a seeded default). Not yet ✅: `npm run release-check` and a live add-a-person UI test are still pending. |
| **v0.16.9** | 🚧 In Progress | 16 July 2026 | Enroll Starts the Camera Automatically. Christian deleted his own enrollment, then hit a dead end: "the button is not active and has a circle half cross over it (Not Usable)... it needs to activate if not active from there." Root cause: the Enroll/Re-enroll button on the Identity tab was hard-disabled whenever the camera wasn't already streaming, with no path to turn it on short of switching to the Vision tab first. `CameraStreamStore` gained a registered "start handler" (`setStartHandler()`/`requestStart()`) — `VisionPanel.jsx` registers its own `startCamera()` via a ref-indirection pattern (never a stale closure across re-renders) on mount. New `ensureCameraActive()` in `useFaceEnrollment.js` checks `LivePipelineStore` first and, if not already healthy, calls `requestStart()` and polls (up to 8s) until the live pipeline actually comes up before the guided pose sequence begins. `FaceEnrollmentPanel.jsx`'s Enroll button no longer disables on `!cameraReady` (only while a capture is already running), the camera-status banner is now informational rather than a blocker, and a distinct failure message appears if the camera genuinely can't start (e.g. permission denied). Live-tested end-to-end (16 July, Christian): fresh page load, camera never started, clicked Enroll directly from the Identity tab — camera activated automatically, pop-up preview appeared, full 5-step guided pose sequence ran with voice narration, 5/5 samples captured, zero console errors. Not yet ✅: `npm run release-check` is still pending. |
| **v0.16.10** | ✅ Complete | 16 July 2026 | Personalised Enrollment Confirmation. Christian: "once identified it needs to say got it thanks but with the persones iD name." The spoken wrap-up line in `useFaceEnrollment.js` now looks up the enrolled person's `displayName` via `PersonRegistry.getProfile()` and says "Got it, thanks, {name}!" on a successful capture, instead of a generic "Got it, thanks!". Verified via a monkey-patched `speechSynthesis.speak` that the full spoken instruction sequence still fires correctly end-to-end. `npm run release-check` PASS (40 test files, 225 tests). Committed (`29a4050`) and pushed by Christian. |
| **v0.16.11** | ✅ Complete | 17 July 2026 | Identity Lock. Christian: "once its id'd someone at a high percentage can it lock in and track... if finley has a sezure and is on the floor face id will not recognize him as a seizue could be missed but if it has a lock on it will continue to recognise the person on the floor without face it." Built a full lock lifecycle (`IdentityLockService`, new) that, once a face match sustains ≥90% confidence for 3 consecutive frames on the same tracked person, keeps reporting that identity through frames where the face becomes undetectable (turned away, occluded, collapsed), as long as person-presence evidence stays alive — releases only on a confidently-matched different person or the track actually expiring. Uncovered and fixed two pre-existing bugs this required: (1) `VisionPipeline.js` never passed a `trackingId` into `IdentityEngine.evaluate()`, so `IdentityTrackingService` minted a brand-new track every single frame and no continuity was ever possible — fixed with `resolveTrackingId()`, which now reuses the active track. (2) `IdentityStateMachine.evaluate()` discarded the matched profile outright the instant `faceDetected` went false, dropping straight to generic "tracking, unknown" — the exact failure mode Christian's seizure scenario described. Both fixed as prerequisites before the lock itself could do anything. Live-testing (16–17 July) surfaced a third, deeper, pre-existing bug: Christian noticed two mismatched on-screen "confidence" numbers ("is it worth noting there are two comfidence levels in two seperate aeras" / "not alwas 85") and pushed past what looked like two UI quirks (one was a fixed per-state constant, the other a general pose/risk score — neither was live face-match confidence) to the real number, read directly out of the live pipeline via console instrumentation: a genuinely good real match (Christian's own face, distance ≈0.27, well inside the accept boundary) was only producing ~55% confidence. `FaceEmbeddingEngine.distanceToConfidence()` was using a linear formula that compressed the entire useful range — no lock threshold tried (0.9, then 0.8, then 0.75) could ever have worked, since the real ceiling for a good match sat below all of them. Given the choice between recalibrating the scale or just lowering the lock's thresholds further, Christian chose the former ("Recalibrate the confidence scale (Recommended)") — fixed at the source with a logistic curve centred on the same 0.6 distance boundary, restoring the lock's acquire threshold to a genuine 0.9 "high percentage" bar. Also added leaky-bucket hysteresis to the lock's consecutive-frame counter (decrements by 1 on a sub-threshold frame instead of resetting to 0) so ordinary frame-to-frame jitter doesn't discard an otherwise-good streak. Live-verified post-fix: real confidence for Christian's own face now reads ~90–91% (vs ~55% before). Live-verified end-to-end that the lock survives a real face-visibility gap by driving the app's own running `IdentityEngine`/`IdentityTrackingService`/`FaceEnrollmentStore` instances directly with Christian's real enrolled embedding (three staged live-webcam turn-away attempts were confounded by the pose/face detectors' own real-world limitations — full occlusion and profile angles didn't reliably trigger a clean "person present, no face" frame from a live human on request): 3 confident frames → `state: trusted`, `identityHeld: false`; a subsequent no-face-but-person-present frame → `state` stays `trusted` (not dropped to generic tracking), `identityHeld: true`, reason correctly appends "Tracking held through a face-visibility gap." 21 new/updated smoke tests (lock unit tests, end-to-end pipeline tests including a seeded `finley` PROTECTED-state scenario, and fixes to existing exact-value assertions broken by the now-asymptotic confidence curve). |
| **v0.16.12** | ✅ Complete | 17 July 2026 | Visual Lock Indicator. Christian: "i want to see a visual id in this when its locked on" — the v0.16.11 "Tracking held" badge lived only on the Identity tab, not the camera view itself. New `identityLocked` flag (distinct from `identityHeld`: true any time the lock is engaged at all, including live-confirmed frames, not just held ones) threaded `IdentityLockService` → `RecognitionCandidate` → `IdentityEngine` → `VisionPipeline`/`LivePipelineStore` → `VisionPanel` → `VisionFaceOverlay`. The primary face's bounding box recolours to cyan with a padlock glyph and "LOCKED" appended to its label once the lock engages; when the face is genuinely undetected (no box to draw on) a floating "Tracking held — {name}" banner renders instead. Live-verified both paths in the same session: the LOCKED badge engaged naturally at 90% confidence after a few steady seconds in frame, and the "Tracking held" banner fired correctly during a real momentary detection gap moments later. |
| **v0.16.13** | ✅ Complete | 17 July 2026 | Multi-Person Simultaneous Locking. Live-testing with two enrolled people (Christian + Ann) in frame together found the lock acquired on Ann, then "turned off" on Christian — "it needs to tack more than one person especialy in development. in my case Finley is the priorary however there might be some places that need to to track and monitor more than one persone." Root cause: `IdentityTrackingService.resolveTrackingId()` only ever tracked ONE global slot, shared by whoever's face was largest/most-prominent that frame, and `IdentityLockService`'s lock is keyed by trackingId — a second, simultaneously-visible recognised person could only ever steal the lock, never hold their own. New `profileTrackMap` (profileId → trackingId) gives every recognised profile its own stable, dedicated track independent of face size/position, so simultaneously-visible enrolled people each accumulate and hold their own independent lock. `VisionPipeline` now runs the tracking/lock update for EVERY detected face each frame (not just the largest), and selects which ONE face drives the existing single decision/notification/memory-activation pipeline by priority: protected profile (Finley) first, then anyone already locked, then the original largest-face default. `VisionFaceOverlay` shows an independent LOCKED badge per simultaneously-locked person via a new `identityRoster`. Live-verified against the real running app using Christian's and Ann's actual enrolled embeddings: distinct trackingIds, Christian's lock stays intact after Ann joins and locks in alongside him. Known, disclosed limitation carried forward: "held through a face-visibility gap" still only works reliably for whichever ONE person is primary that frame — the underlying pose/body person-presence signal is itself single-person, so true simultaneous held-tracking for 2+ people needs multi-person body detection, a bigger follow-up not solved here. |
| **v0.16.14** | ✅ Complete | 17 July 2026 | Lock Acquire Threshold Tuning. Christian, live-testing: "the lock on is not happening quick enough or not at all" / "the lock needs to happen a bit lower than 90%." `IDENTITY_LOCK_ACQUIRE_CONFIDENCE_THRESHOLD` lowered 0.9 → 0.85 (matches the existing `IDENTITY_CONFIDENCE.TRUSTED` constant) — real live confidence for a genuine match jitters ~0.84-0.91 frame to frame, so 0.9 only cleared on the better frames. Live-verified: locked at 87% by frame 24 on a fresh load; Christian confirmed noticeably faster/more reliable. |
| **v0.16.15** | ✅ Complete | 17 July 2026 | CameraStreamStore Smoke Test Coverage. Closed a backlog item open since v0.16.9: `CameraStreamStore.requestStart()`/`setStartHandler()` had no test coverage. Added `reset()` (test-only, same convention as other singleton services) and a new 16-test smoke test file covering stream storage, subscribe/emit (including a throwing listener and a non-function subscriber), and `requestStart()`'s full already-active/no-handler/started/start-failed contract, plus the ref-indirection handler-replacement pattern `VisionPanel.jsx` relies on. |
| **v0.16.2** | Planned | — | Identity Confirmation & Continuous Recognition. |
| **v0.16.3** | Planned | — | Face Recognition Diagnostics. |

---

# PHASE 8 — Protected User Alerting *(Planned)*

| Version | Description |
|---|---|
| **v0.17** | Protected User Alerting Foundation |
| **v0.17.1** | Risk Assessment Engine |
| **v0.17.2** | Alert Routing & Escalation |
| **v0.17.3** | Protected User Monitoring Dashboard |

---

# PHASE 9 — Multi-Camera / Distributed Monitoring *(Planned)*

Raised 13 July 2026 (Christian): extend MARS beyond the single S22-mounted camera to WiFi/Bluetooth pan-tilt cameras placed around the house, so monitoring isn't limited to whatever room the robot is physically in. Positioned after Face Recognition (Phase 7) and Protected User Alerting (Phase 8) so multi-camera has a real identity/alerting system to plug into rather than building it first, and before Robot Control since it's a pure software/sensor extension. See `ENGINEERING_BACKLOG.md` for the full design-awareness note.

| Version | Description |
|---|---|
| **v0.18** | Camera Discovery & Pairing Foundation — add/pair additional WiFi/Bluetooth cameras, no live pipeline yet |
| **v0.18.1** | Per-Camera Vision Pipeline — camera-id-tagged perception results, `CameraService`/`VisionPipeline` extended from a single hardcoded source to a keyed set of sources |
| **v0.18.2** | Cross-Camera Identity Continuity — a person recognised on one camera resolves to the same active `personId` when seen on another |
| **v0.18.3** | Multi-Feed Monitoring Dashboard |

---

# PHASE 10 — Robot Control *(Planned)*

| Version | Description |
|---|---|
| **v0.19** | Robot Control Foundation |
| **v0.19.1** | Bluetooth Communication Layer |
| **v0.19.2** | Movement Control Engine |
| **v0.19.3** | Navigation & Sensor Integration |
| **v0.19.4** | Robot Diagnostics |

---

# PHASE 11 — Android Robot Application *(Planned)*

| Version | Description |
|---|---|
| **v0.20** | Android Robot Application |
| **v0.20.1** | Onboard Camera Integration |
| **v0.20.2** | Voice & Robot Integration |
| **v0.20.3** | Local AI Integration (Samsung Galaxy S22) — reasoning chain already built in v0.14.4; this slot now means replacing the LocalProvider stub with a real on-device model |
| **v0.20.4** | Android Diagnostics & Deployment |

---

# PHASE 12 — MARS Mk1 Release *(Planned)*

| Version | Description |
|---|---|
| **v0.21** | MARS Mk1 Working Application |
| **v0.21.1** | Full System Integration |
| **v0.21.2** | System Validation & Performance Optimisation |
| **v0.21.3** | Mk1 Release Candidate |
| **v0.21.4** | MARS Mk1 Production Release |

---

## Engineering Milestones

### Completed
- Vision Intelligence
- Observation Layer
- Decision Intelligence
- Identity Intelligence
- Behaviour Intelligence
- Diagnostics Framework
- Live Pipeline
- Voice Foundation
- Wake Word & Routing
- Voice Response Layer
- Natural Conversation Foundation
- Voice Audio Pipeline & Chat/Voice Bridge
- AI Reasoning Layer (Local → Home → Cloud escalation)
- Memory Intelligence Foundation & Person-Scoped Memory (Multi-User)
- Memory Intelligence: Short-Term & Long-Term Engines (working memory, categorisation, salience, safety-aware retention)
- Memory Intelligence: Personal Context (on-prem, memory-aware AI) & Behaviour Learning (confirm-gated inferred facts) — Phase 6 complete

### Planned
- Face Recognition
- Protected User Alerting
- Robot Control
- Android Runtime
- Full Mk1 Integration
- Multi-Camera / Distributed Monitoring
