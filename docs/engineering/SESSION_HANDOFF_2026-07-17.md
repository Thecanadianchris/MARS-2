# Session Handoff — 17 July 2026 (paste this at the start of a new chat)

I'm continuing the MARS Software Project (Christian's assistive-robotics project). Read `docs/engineering/MEM-0005_Manifest_5.0_Claude_Takeover.md` and `docs/engineering/MVCH_Master_Version_Control_History.md` first — they are the living references. This note is the detailed "where we are / how it works / where we're going" supplement. It supersedes `SESSION_HANDOFF_2026-07-12.md`.

---

## 1. Headline state

**Phase 7 — Face Recognition is COMPLETE.** This session took Face Recognition from a working single-person foundation (v0.16/v0.16.1, built the session before) through Identity Lock, a visual lock indicator, multi-person simultaneous locking, live threshold tuning, and a final test-coverage close-out (v0.16.10 → v0.16.15).

- **Validated baseline: 41 test files, 259 tests — Build PASS, Release Check PASS.** Confirmed by Christian via `npm run release-check` twice this session (40 files/225 tests mid-session at v0.16.10, then 41 files/259 tests after v0.16.15).
- **Branch: single `main`.** Consolidated this session per Christian's explicit instruction ("dont want any branches just to be the same as my folder we test everthing"). The long-lived `feature/v0.13.0-identity-foundation` branch was fast-forward merged into `main` and deleted, both locally and on GitHub. Going forward: commit/push directly to `main`, no feature branches.
- **Repo:** `https://github.com/Thecanadianchris/MARS-2` — public, up to date, fully pushed.
- **Christian still needs to run one final `git add -A` / `git commit` / `git push` for the v0.16.15 CameraStreamStore test work** if he hasn't already — check `git status` / `git log` first thing.

---

## 2. What got built this session (Identity Lock, in order)

All identity/lock code lives in `mars-standalone/src/services/identity/`. The Vision tab overlay is `components/mars/VisionFaceOverlay.jsx`; the Identity tab status card is `components/identity/IdentityStatusCard.jsx`.

**v0.16.10 — Personalised Enrollment Confirmation.** Small: the spoken enrollment wrap-up now says "Got it, thanks, {name}!" instead of a generic line.

**v0.16.11 — Identity Lock (the big one).** Christian's ask: if a protected user (e.g. Finley) has a seizure and ends up on the floor, face-ID alone would lose them the moment their face isn't visible — a seizure could be missed. Built `IdentityLockService`: once a face match sustains ≥ threshold confidence for 3 consecutive frames on the same tracked person, the lock keeps reporting that identity through frames where the face becomes undetectable, as long as person-presence evidence stays alive. Releases only on a confidently-matched *different* person or the track expiring. Building this surfaced and required fixing two pre-existing bugs (`VisionPipeline` never passed a `trackingId` into `IdentityEngine`, so no continuity ever existed; `IdentityStateMachine` discarded the matched profile the instant a face wasn't detected) — both fixed as prerequisites. Live-testing then surfaced a third, deeper bug: the confidence *scale* itself was wrong (a linear distance-to-confidence formula meant a genuinely good match only ever read ~55%, so no lock threshold could ever clear). Fixed by recalibrating to a logistic curve — a good match now reads ~90%, as it should. `identityHeld` (true only when the lock is carrying someone with zero live face evidence this frame) is the flag this milestone introduced.

**v0.16.12 — Visual Lock Indicator.** Christian: "i want to see a visual id in this when its locked on." Added `identityLocked` (true any time the lock is engaged at all, including frames where the face IS visible — distinct from `identityHeld`). The primary face's bounding box turns cyan with a padlock + "LOCKED" label; when there's no box to draw on (face genuinely gone), a floating "Tracking held — {name}" banner shows instead.

**v0.16.13 — Multi-Person Simultaneous Locking.** Live-testing with Christian + Ann both in frame found the lock could only ever hold one person — Ann locking in "stole" Christian's lock. Root cause: tracking only had one global slot, shared by whoever's face was biggest. Fixed with `profileTrackMap` (profileId → trackingId) giving every recognised profile its own dedicated, stable track, so simultaneously-visible people each hold their own independent lock. Priority for which ONE face drives the single decision/notification/memory pipeline: protected profile (Finley) first, then anyone locked, then largest-face default — per Christian's explicit "Finley is the priority." Live-verified with Christian's and Ann's real enrolled embeddings: distinct locks, no stealing.

**v0.16.14 — Lock Acquire Threshold Tuning.** Christian: "the lock needs to happen a bit lower than 90%." Real live confidence for a genuine match jitters ~84–91% frame to frame, so the 0.9 acquire threshold only cleared on the better frames. Lowered to 0.85 (matches the existing `TRUSTED` constant). Live-verified: locked at 87% by frame 24, confirmed noticeably faster/more reliable.

**v0.16.15 — CameraStreamStore Smoke Test Coverage.** Closed a backlog item open since v0.16.9 — `CameraStreamStore` (shared-stream store behind the pop-up enrollment preview and the Enroll-can-start-the-camera flow) had no tests. Added `reset()` plus a 16-test smoke test file.

**Known, explicitly disclosed limitation — not solved, logged in MVCH and `ENGINEERING_BACKLOG.md`:** simultaneous "held through a face-visibility gap" for 2+ people at once doesn't work. The underlying person-presence signal (pose/body detection) is itself single-person — if a second, non-primary person's face drops out, MARS can't honestly tell that apart from them having genuinely left. Fixing this needs multi-person body/pose presence detection, a materially bigger vision-pipeline change than anything built this session. Don't let a fresh chat assume this was quietly solved — it wasn't.

---

## 3. Where the identity architecture stands (read this before touching vision/identity code)

`VisionPipeline.processFrame()` → per-face loop, one call per detected face to `IdentityTrackingService.updateFromPerception()` (own dedicated trackingId via `profileTrackMap` if the face matches a known profile) → `IdentityEngine.evaluate(facePerception, { trackingResult })` reusing that same trackingResult (avoids double-counting `framesSeen`) → priority-based primary selection (`protected > locked > largest`) → the single primary `identity` feeds the pre-existing decision/notification/memory-activation pipeline, unchanged.

Two flags to keep straight: `identityHeld` (lock carrying someone with **no** live face evidence this frame) vs. `identityLocked` (lock engaged at all, **including** live-confirmed frames — this is what drives the persistent "LOCKED" badge).

`resolveTrackingId(now, matchedProfileId, hasOwnFace)`'s `hasOwnFace` parameter is the subtle bit: `true` only when there's a genuinely distinct, *unrecognized* face this frame (safe to exclude tracks already claimed by a recognized profile); `false` for the whole-frame "no face at all" fallback, which **must** be allowed to resume a claimed/locked track — this is what preserves held-through-occlusion continuity. Don't "simplify" this away.

---

## 4. Safety rules established (carry forward, unchanged from prior sessions)

- `medicalDiagnosis: false` on every engine response.
- `safety`-category memory facts never leave the device and are never auto-forgotten; inference never creates a safety fact.
- The monitor → check-in → escalate use case is **non-diagnostic anomaly detection + human escalation** — MARS flags "this looks different, are you OK?" and escalates to a human; it never diagnoses.
- The Identity Lock is itself a safety-relevant claim about who MARS thinks it's looking at — that's why `identityHeld`/`identityLocked` are surfaced visibly (amber badge on Identity tab, cyan badge + banner on Vision tab) rather than silently assumed correct.

---

## 5. Operational facts (needed to run/verify anything)

- App lives in `02 - Software/Mars 2/mars-standalone/` — `npm run dev`, `npm test`, `npm run build`, `npm run release-check` (= test + build), all run from there.
- **Claude's sandbox/shell had no connectivity all of this session** (`mcp__workspace__bash` consistently returned "Workspace still starting" and timed out) — Christian ran all `npm`/`git` commands himself in PowerShell and pasted output back for verification. If shell access works in the new session, that's new — otherwise expect the same handoff pattern.
- Live UI verification this session was done via Chrome DevTools MCP (`mcp__claude-in-chrome__*`) plus direct console-level ES module instrumentation (dynamically importing the live app's real running modules via `javascript_tool` and calling them directly with real enrolled embeddings) — this is how the lock/multi-person behaviour was proven against the actual deployed code, not just the test suite, when staging a live physical action (e.g. Christian turning away from the camera) proved unreliable.
- **Known pitfall:** dynamically importing the same module specifier via a fresh `javascript_tool` call can resolve to a stale Vite HMR module instance different from the one actually wired into the running app. If a diagnostic looks wrong ("this should be locked and isn't"), don't trust a second import — read state off the return value of the call you already made into the live pipeline instead.
- Git workflow going forward: single `main` branch, commit/push directly, no feature branches.

---

## 6. Where we're going — Phase 8: Protected User Alerting (confirmed, starting now)

Christian has confirmed Phase 8 as the next body of work: **v0.17 Protected User Alerting Foundation**, then v0.17.1 Risk Assessment Engine, v0.17.2 Alert Routing & Escalation, v0.17.3 Protected User Monitoring Dashboard.

**Read `docs/engineering/V0.17_KICKOFF_Protected_User_Alerting.md` next** — it lays out what already exists to build on (Decision engine, two parallel notification pipelines with only one wired to UI, `NotificationTargets` with real vs. planned delivery channels, `ProtectedUserService`/`UserRoles`/`UserPermissions` fully built but with zero live callers), what's genuinely missing (an escalation state machine, real alert delivery, a monitoring dashboard), and the open product/architecture decisions Christian needs to make before or during scoping (which notification pipeline to consolidate onto, whether `services/users` gets wired in or `PersonRegistry` stays the sole source of truth, what "risk" actually measures given `medicalDiagnosis: false`).

This is the same scope-first workflow as every prior phase: read the kickoff doc, present risk-tiered options, Christian decides, then build.

---

## 7. Small open items (not blockers for Phase 8)

- `DecisionPanel.jsx` references `decision.dataState`/`decision.dataStateLabel`, which the hook never returns — dead/unreachable UI branch. Fix opportunistically.
- `useVisionDiagnostics.getFaceState` reads a `faceFoundation.state` field that `FaceFoundationEngine` never emits — the face-state chip on Vision Diagnostics effectively always shows the fallback value. Fix opportunistically.
- `v0.16.2` (Identity Confirmation & Continuous Recognition) and `v0.16.3` (Face Recognition Diagnostics) were originally scoped as their own milestones but ended up superseded/covered by the Identity Lock work and the existing Identity tab UI respectively — marked "Deferred" in MVCH, not blockers.
- Production JS bundle is over Vite's 500 kB chunk-size warning (821.56 kB / 229.34 kB gzip) — not urgent, worth a code-splitting pass eventually.
- Simultaneous held-through-occlusion for 2+ people (see section 2 above) — real, disclosed, not started. Needs multi-person body/pose presence detection — bigger than a Phase 8 sub-task, probably its own future scoping conversation.
