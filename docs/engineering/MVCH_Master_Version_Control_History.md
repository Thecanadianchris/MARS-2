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
