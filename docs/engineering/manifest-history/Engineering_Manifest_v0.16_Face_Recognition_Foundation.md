# Engineering Manifest — v0.16 Face Recognition Foundation

Document status: Milestone record (authoritative copy, `manifest-history/`)
Date: 13 July 2026 (live-camera verification completed 14 July 2026)
Branch: `feature/v0.13.0-identity-foundation`
**Confirmed baseline after this milestone: 40 test files, 211 tests, all passing. Build PASS.** (`npm run release-check`, run by Christian 13 July 2026 — exact match to the projection made while the shell/sandbox was unavailable this session.) **Live-camera verification: PASS (14 July 2026)** — see §7. Milestone is ✅ Complete.

Prior baseline: v0.15.5 — 39 files, 191 tests (committed `ae544ba`). Phase 6 Memory Intelligence complete.

---

## 1. Why this milestone exists

Phase 7, first milestone. MARS's identity framework (v0.13.0–v0.13.2) was deliberately built to receive a future recognizer — `IdentityEngine.evaluateRecognitionCandidate()`, `RecognitionCandidate`, the `PersonRegistry` pending→confirmed flow, and `MemoryIntelligenceService.setActivePerson()` all already existed, fully tested, waiting. A full codebase architecture review this session (13 July, `MARS_Full_Codebase_Architecture_Review_2026-07-13.md`) confirmed the exact gap in code: `IdentityTrackingService.updateFromPerception` hardcoded `identityConfidence: 0` and `candidateProfiles: []` on every candidate, so no live perception input could ever produce a matched profile. This milestone closes that gap with a real (if intentionally Foundation-grade) recognizer.

## 2. Decision made (scoping doc: `V0.16_SCOPING_Face_Recognition.md`)

Three options were presented: (A) landmark-geometry signature, (B) real face-embedding model, (C) honest-stub Foundation with a pluggable matcher interface. **Decision: Option C, with Option A's landmark-geometry approach as the actual matcher inside it** — real geometry comparison, not simulation, no new ML dependency (MediaPipe's `FaceLandmarker` was already an unused export of the installed `@mediapipe/tasks-vision` package). A real embedding model (Option B) remains a drop-in replacement for `FaceRecognitionService`'s matcher later without touching `IdentityEngine` or anything downstream.

Also decided and folded in from the same scoping pass:
- Confidence threshold for the `setActivePerson()` payoff: **≥0.85**, deliberately higher than `RecognitionCandidate`'s own 0.75 "recognised" bar, and never true on a weak match — including onto Finley's protected profile.
- Verification this session: unit/smoke tests with synthetic landmark data (no camera in this sandbox); live-camera verification deferred to Christian.
- The `SEARCHING` identity state (defined since v0.13.0 but never reachable) was wired as part of this milestone rather than as a separate fix.
- `PersonRegistry.protected` confirmed as the single canonical "is this person protected" source; face recognition introduces no new check.

## 3. What was built

**`services/vision/FaceLandmarkService.js` (new)** — MediaPipe `FaceLandmarker` wrapper (up to 478 face-mesh points), mirrors `PoseDetectionService`'s graceful-degrade pattern exactly (no camera/model failure → empty result, never throws). Pinned CDN versions (`@0.10.35` WASM, numbered model path) — not `@latest`, learned from this session's earlier cleanup pass.

**`services/identity/FaceSignatureEngine.js` (new, pure)** — derives an 8-dimension geometry-ratio signature from 11 standard MediaPipe Face Mesh landmark indices (eyes, nose, mouth, jaw edges, forehead, chin), normalised against inter-ocular distance for rough scale-invariance. `compareSignatures()` (Euclidean distance) and `distanceToConfidence()` (0–1) are fully deterministic and unit-testable without any MediaPipe model.

**`services/identity/FaceEnrollmentStore.js` (new)** — in-memory, on-device-only signature store keyed by `personId`, up to 5 samples per person (oldest dropped). Explicitly scoped as the Foundation-level matching primitive; persistence and a management UI are v0.16.1's job ("Face Registration & Known Person Database"), not this milestone's.

**`services/identity/FaceRecognitionService.js` (new)** — the pluggable recognizer: `recognise({landmarks, faceQualityResult})` quality-gates via the existing `FaceQualityEngine`, computes a signature, matches against `FaceEnrollmentStore`, returns `RecognitionCandidate`-shaped `{identityConfidence, candidateProfiles}`. `enroll(personId, landmarks)` performs no trust checks itself — matches `FaceEnrollmentStore`'s scope; the existing `ProfileAuthorisationService`/`PersonRegistry` pending→confirmed gate remains the only path to trust.

**Identity wiring (the real unlock):**
- `IdentityTrackingService.updateFromPerception` now calls `FaceRecognitionService.recognise()` instead of hardcoding `identityConfidence: 0`/`candidateProfiles: []`. `RecognitionCandidate`'s `state` is now left to self-derive (`RECOGNISED` vs `SEARCHING`) on suitable-quality frames instead of always being forced to `SEARCHING`.
- `IdentityStateMachine` gained an `attemptingRecognition` input → `SEARCHING` state, inserted between `GUEST` and the `UNKNOWN` fallback.
- `IdentityEngine.isAttemptingRecognition()` (new, pure) computes that input from the tracked face's `framesSeen`, giving a face up to `IDENTITY_RECOGNITION_PATIENCE_FRAMES` (3) frames before falling back to `UNKNOWN` — a brief glance no longer immediately reads as "unrecognised."
- `IdentityEngine.shouldActivatePerson()` (new, pure, unit-tested in isolation from the vision pipeline) — the gate: only `KNOWN`/`TRUSTED`/`PROTECTED`, never pending, never below `IDENTITY_ACTIVE_PERSON_CONFIDENCE_THRESHOLD` (0.85).
- `IdentityEngine.createRecognitionSummary()` now honestly reports `faceRecognitionActive: true` / `recognitionProvider: 'FACE_RECOGNITION_LANDMARK_GEOMETRY'` (was hardcoded `false` / `'not_implemented_in_v0.13.1'`).
- `IdentityDiagnosticsService` — `capabilities.faceRecognition` flipped `false → true`, backed by `FaceRecognitionService.getStatus()`.
- `DiagnosticsManager`'s `face-recognition` check summary corrected from "Planned identity sensor" to reflect the real (Foundation-grade) matcher.

**The payoff — `services/vision/VisionPipeline.js`:**
- Calls `FaceLandmarkService.detectFace(frame)` alongside `FaceFoundationEngine` (a separate, coarser pose-based head-orientation read — unchanged), threads `faceLandmarks` into the perception result.
- After `IdentityEngine.evaluate()`, calls `MemoryIntelligenceService.setActivePerson(identity.profile.id)` **only if** `IdentityEngine.shouldActivatePerson(identity)` — no other code needed changing on the memory side; `setActivePerson`/`getActivePersonId` were already fully wired on the read side (confirmed in the architecture review) and just needed a real caller.

**Bug fix found and fixed while touching this code:** `useIdentityFoundation.js` was missing `capabilityState`/`clearSimulation` from its return object even though `IdentityPanel.jsx` destructures both (flagged in the architecture review as a likely live bug on a tab used constantly during this milestone's UI verification). Added both — `capabilityState` reflects waiting/simulation status via the shared `capabilityState.js` model, `clearSimulation` resets the panel's scenario back to waiting.

## 4. Safety design (carried forward, unchanged in substance)

- **On-device only.** No face signature/descriptor is ever sent anywhere — `FaceEnrollmentStore` is in-memory, same-process, matches the existing on-prem posture used by `PersonalContextService`.
- **High, separate confidence bar for the memory payoff.** `shouldActivatePerson()`'s 0.85 threshold is intentionally higher than `RecognitionCandidate`'s own 0.75 "recognised" bar — a candidate can be recognised enough to resolve a `KNOWN`/`TRUSTED`/`PROTECTED` identity state without being confident enough to flip the whole memory system's active person. Verified in tests: never activates below threshold, including on Finley's protected profile.
- **No new auto-enrollment.** `FaceRecognitionService.enroll()` performs no trust decision; unknown/new faces still only reach a real profile through the existing `createPendingProfile → confirmPendingProfile` trusted-user gate, untouched by this milestone.
- **`medicalDiagnosis: false`** carries forward; face recognition still answers "who," never anything clinical.

## 5. Regression safety

Two existing tests asserted a fresh (untracked) face immediately reports `UNKNOWN` — with the new patience window, a fresh track's first frame now correctly reports `SEARCHING` first. Both were updated (not silently left broken) to exercise the real `SEARCHING → UNKNOWN` transition explicitly over a fixed `trackingId` across the patience window, rather than changing the expected end-state: `IdentityFoundationSmokeTest.test.js` ("keeps a visible but unrecognised person unknown...") and `IdentityPanelSmokeTest.test.js` ("keeps an unrecognised person in a confirmation workflow..."). `IdentityTrackingSmokeTest.test.js`'s integration test and `IdentityPanelSmokeTest.test.js`'s capabilities test were updated for the same reason (`faceRecognitionActive`/`capabilities.faceRecognition` are now honestly `true`, not `false`). Confirmed via grep across the full `src/tests/` tree that no other test asserts on these fields. No memory-writer paths, conversation routing, or existing Vision/Behaviour/Decision/Notification logic were touched.

## 6. Files

**Added:** `services/vision/FaceLandmarkService.js`, `services/identity/FaceSignatureEngine.js`, `services/identity/FaceEnrollmentStore.js`, `services/identity/FaceRecognitionService.js`, `tests/FaceRecognitionFoundationSmokeTest.test.js` (20 new tests: signature math, enrollment store incl. sample-cap eviction, recognition service incl. no-match/weak-match/strong-match, SEARCHING state incl. patience window, `shouldActivatePerson` gate incl. protected-profile weak-match refusal, end-to-end `IdentityTrackingService` with a real enrolled match).

**Modified:** `services/identity/IdentityTrackingService.js` (real matcher wiring), `services/identity/IdentityStateMachine.js` (`SEARCHING`), `services/identity/IdentityEngine.js` (`isAttemptingRecognition`, `shouldActivatePerson`, honest recognition summary), `services/identity/IdentityTypes.js` (`IDENTITY_RECOGNITION_PATIENCE_FRAMES`, `IDENTITY_ACTIVE_PERSON_CONFIDENCE_THRESHOLD`), `services/identity/IdentityDiagnosticsService.js` (`faceRecognition: true`), `services/diagnostics/DiagnosticsManager.js` (corrected check summary), `services/vision/VisionPipeline.js` (face landmark detection + `setActivePerson` payoff wiring), `hooks/useIdentityFoundation.js` (bug fix: `capabilityState`/`clearSimulation`), `tests/IdentityTrackingSmokeTest.test.js`, `tests/IdentityPanelSmokeTest.test.js`, `tests/IdentityFoundationSmokeTest.test.js` (updated for the reasons in §5).

**Not touched:** `PersonRegistry`, `ProfileAuthorisationService`, the pending→confirmed profile flow, `MemoryIntelligenceService`'s internals (only gained a real caller of the pre-existing `setActivePerson`), any Behaviour/Decision/Notification/Conversation/Voice code.

## 7. Validation

**`npm run release-check` — DONE (13 July 2026, Christian).** 40 test files, 211 tests, all passing. Build PASS (`vite build`, 2117 modules transformed, 3.60s). Matches the projection exactly. One pre-existing (not new to this milestone) build warning: the production JS bundle is 821.56 kB (229.34 kB gzip), over Vite's 500 kB chunk-size warning threshold — `@mediapipe/tasks-vision` was already a dependency before v0.16 added its second consumer (`FaceLandmarkService`, alongside `PoseDetectionService`); code-splitting is a reasonable future cleanup but not a v0.16 regression or blocker.

**Live-camera check — DONE (14 July 2026).** Identity tab confirmed clean (no `capabilityState`/`clearSimulation` errors). With no enrollment UI yet (that's v0.16.1's job), the test bootstrapped an enrollment directly via `FaceRecognitionService.enroll('christian', landmarks)`, called against the live Vite dev-server module singleton from the browser devtools console (landmarks read from `LivePipelineStore.getLatestResult().faceLandmarks`, 478 points from the real webcam feed). 4 samples enrolled. The next processed frame resolved `identity.state: 'trusted'`, `profile.id: 'christian'`, `identityConfidence: 0.93` (candidate confidence 0.9335), and `MemoryIntelligenceService.getActivePersonId()` flipped from its prior value to `'christian'` — confirming `shouldActivatePerson()`'s ≥0.85 gate and the `setActivePerson` payoff both fire correctly against a real camera feed, not just synthetic test data or UI simulation. No console errors during camera operation. A page reload cleared the enrollment (confirms `FaceEnrollmentStore` is in-memory-only, as designed) and identity correctly returned to `searching`.

**Matcher upgrade — done same day (14 July 2026), before commit.** Christian ran a further live test pointing the camera at Ann (unenrolled) with only Christian enrolled — the landmark-geometry matcher misidentified her as Christian. Diagnosed live (see `ENGINEERING_BACKLOG.md`'s "Known safety-relevant limitation" entry): the 8-ratio geometry signature isn't discriminative enough between two real different people. Christian's call: "this is not good enough at this stage" — rather than retune thresholds on a fundamentally weak matcher, swapped it for a real on-device face-embedding model (`@vladmandic/face-api`, 128-d descriptors), exactly the "Option B" drop-in replacement the original scoping doc designed `FaceRecognitionService`'s interface to allow. New: `FaceEmbeddingService.js` (vision), `FaceEmbeddingEngine.js` (identity). `FaceSignatureEngine.js` kept but superseded. Full detail in `ENGINEERING_BACKLOG.md`. **This changes §3/§6 above** (matcher description, files list) — treat this note as the authoritative update rather than editing history above.

**Outstanding before commit:**
1. Christian needs to run `npm install` (added `@vladmandic/face-api` to `package.json`, no shell access this session to install it directly) then `npm run release-check`.
2. The actual re-test that motivated this — enroll Ann for real and confirm the embedding model can tell her and Christian apart live — has not happened yet. This was tested with synthetic data in the rewritten smoke tests, not yet with two real people.

Once both pass:
```
git add -A
git commit -m "feat: v0.16 face recognition foundation — real face-embedding matcher, SEARCHING state, setActivePerson payoff, live-camera UI"
git push origin feature/v0.13.0-identity-foundation
```

## 8. What's next

**v0.16.1 — Face Registration & Known Person Database.** Build the actual enrollment UI (currently only reachable programmatically via `FaceRecognitionService.enroll()`), and decide whether `FaceEnrollmentStore` needs to persist across reloads (today it's session-only, consistent with the rest of Vision/Identity being in-memory-only). **v0.16.2 — Identity Confirmation & Continuous Recognition. v0.16.3 — Face Recognition Diagnostics** (live recognition state/confidence/active person surfaced in the diagnostics framework — `DiagnosticsManager`'s check already exists and now genuinely passes).

## 9. Safety boundary (reinforced)

`medicalDiagnosis: false` everywhere, unchanged. The two hard rules for this milestone: **no biometric data leaves the device**, and **`setActivePerson` never fires below a high, separate confidence threshold** — a weak or ambiguous match resolves an identity state but does not silently redirect the memory system, especially not onto a protected profile.
