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
| **v0.14.2** | 🚧 In Progress | 9 July 2026 | Natural Conversation Engine. Conversation sessions, context, history, reference resolution, planner, diagnostics panel. Chat routing now partially shared with the engine (see v0.14.3) for cancel/confirm/clarify/vision cases; memory routing remains local-only by design, so full "shared chat/voice routing" is not yet claimed. Diagnostics-panel baseline: 29 test files, 99 tests, Build PASS, Release Check PASS, UI PASS. |
| **v0.14.3** | ✅ Complete | 11 July 2026 | Voice Diagnostics & Audio Pipeline. `SpeechCapabilityService` (real Speech-to-Text/Text-to-Speech browser support, surfaced on VoicePanel and VoiceService/VoiceDiagnosticsService without disturbing the existing simulated-layer flags), and `ChatConversationBridge` — a regression-safe layer wiring `NaturalConversationEngine` into live ChatPanel so it now handles cancel, confirm/continue, clarify, and vision-routing turns, while real memory commands remain fully protected and untouched. 31 test files, 109 tests, Build PASS, Release Check PASS, UI PASS (verified live: memory preserved, new conversational responses confirmed, zero console errors). |
| **v0.14.4** | ✅ Complete | 11 July 2026 | AI Reasoning Layer. Pulled forward from v0.19.3. Three-tier escalation chain, real: `LocalProvider` (S22, honest stub until v0.19.x) → `HomeProvider` (real Ollama client for the Snapdragon X base station, live probe-based availability) → `CloudProvider` (real Claude API client). `AIReasoningService` router returns an honest escalation trail on every call. Key handling resolved: runtime entry via the rebuilt MARS Intelligence panel, localStorage only, direct browser call with Anthropic's CORS opt-in header — never in repo or bundle. Chat wired via `ChatReasoningBridge`: only generic-fallback turns escalate; memory commands and canned replies structurally protected (same guarantee as v0.14.3). Multi-provider cloud dropdown (Claude/ChatGPT/Gemini/Other) with one key per provider and optional `.env.local` seed. End-to-end verified live 12 July 2026: Home tier (Ollama ARM64, qwen3.5:4b via same-origin Vite proxy) and Cloud tier (Claude, first real AI response in MARS history) both answered with honest escalation trails; chat answers general questions via HOME_AI_SERVER while memory stays local. 33 test files, 130 tests, Build PASS, Release Check PASS, UI PASS. | |

---

# PHASE 6 — Memory Intelligence *(Planned)*

| Version | Description |
|---|---|
| **v0.15** | Memory Intelligence Foundation |
| **v0.15.1** | Short-Term Memory Engine |
| **v0.15.2** | Long-Term Memory Engine |
| **v0.15.3** | Behaviour Learning & Personal Context |

---

# PHASE 7 — Face Recognition *(Planned)*

| Version | Description |
|---|---|
| **v0.16** | Face Recognition Foundation |
| **v0.16.1** | Face Registration & Known Person Database |
| **v0.16.2** | Identity Confirmation & Continuous Recognition |
| **v0.16.3** | Face Recognition Diagnostics |

---

# PHASE 8 — Protected User Alerting *(Planned)*

| Version | Description |
|---|---|
| **v0.17** | Protected User Alerting Foundation |
| **v0.17.1** | Risk Assessment Engine |
| **v0.17.2** | Alert Routing & Escalation |
| **v0.17.3** | Protected User Monitoring Dashboard |

---

# PHASE 9 — Robot Control *(Planned)*

| Version | Description |
|---|---|
| **v0.18** | Robot Control Foundation |
| **v0.18.1** | Bluetooth Communication Layer |
| **v0.18.2** | Movement Control Engine |
| **v0.18.3** | Navigation & Sensor Integration |
| **v0.18.4** | Robot Diagnostics |

---

# PHASE 10 — Android Robot Application *(Planned)*

| Version | Description |
|---|---|
| **v0.19** | Android Robot Application |
| **v0.19.1** | Onboard Camera Integration |
| **v0.19.2** | Voice & Robot Integration |
| **v0.19.3** | Local AI Integration (Samsung Galaxy S22) — reasoning chain already built in v0.14.4; this slot now means replacing the LocalProvider stub with a real on-device model |
| **v0.19.4** | Android Diagnostics & Deployment |

---

# PHASE 11 — MARS Mk1 Release *(Planned)*

| Version | Description |
|---|---|
| **v0.20** | MARS Mk1 Working Application |
| **v0.20.1** | Full System Integration |
| **v0.20.2** | System Validation & Performance Optimisation |
| **v0.20.3** | Mk1 Release Candidate |
| **v0.20.4** | MARS Mk1 Production Release |

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
- Natural Conversation Foundation (current)
- Voice Audio Pipeline & Chat/Voice Bridge
- AI Reasoning Layer (Local → Home → Cloud escalation)

### Planned
- Memory Intelligence
- Face Recognition
- Protected User Alerting
- Robot Control
- Android Runtime
- Full Mk1 Integration
