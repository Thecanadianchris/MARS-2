# Engineering Manifest — v0.14.4 AI Reasoning Layer

Document status: Milestone record (authoritative copy, `manifest-history/`)
Date: 11 July 2026
Branch: `feature/v0.13.0-identity-foundation`
Validated baseline after this milestone: **33 test files, 126 tests — Build PASS, Release Check PASS, UI PASS**

---

## 1. Why this milestone exists

Pulled forward from v0.19.3 ("Local AI Integration", Phase 10) by explicit decision on 11 July 2026. Until this milestone, MARS had no real AI anywhere: `NaturalConversationEngine` is deterministic by design, and `services/ai/` held only v0.9.1 placeholders returning hardcoded strings.

The design intent, stated by Christian and matching the v0.9.1 `LocalAIDecisionService` scaffolding exactly:

> MARS is asked a question (voice, text, or visual ID). A local LLM should easily tell the time or look things up. If the S22 can't find the information, go to the base station laptop (Snapdragon X). If still no answer, go to the Claude API.

## 2. Key-handling decision (was the blocker)

This is a client-side Vite/React app with no backend; a key in the bundle is visible to anyone. **Decision: runtime key entry.** API keys are pasted into the MARS Intelligence panel at runtime and stored in this browser's localStorage only (one per provider) — never in the repo, never in the bundle. Claude calls go directly from the browser using Anthropic's CORS opt-in header (`anthropic-dangerous-direct-browser-access: true`). If MARS is ever hosted publicly, revisit with a server-side proxy.

**Convenience addition (same session):** an optional gitignored `.env.local` with `VITE_CLOUD_AI_KEY` seeds the selected provider's key into the browser store on first load, so the key never needs pasting at all. Recorded trade-off: an env key is embedded in the served/built JS bundle — acceptable for this local-only machine, not for public hosting. `.gitignore` already covers `.env.*`.

## 3. Architecture

Three tiers, tried in order by `AIReasoningService`, every call returning an honest escalation trail (tier, outcome, detail — no silent fallbacks):

| Tier | Provider | v0.14.4 state |
|---|---|---|
| 1 | `LocalProvider` — on-device LLM (S22) | **Honest stub.** Truthfully unavailable until the Android build (v0.19.x); the chain starts at Home. |
| 2 | `HomeProvider` — Ollama on the base station (Snapdragon X) | **Real client.** Probes `/api/tags` (1.5s timeout, 5s cache), generates via `/api/generate` (30s timeout). Availability comes only from a live probe. Default endpoint `http://localhost:11434`; model = configured or first installed. Recommended runtime: Ollama native ARM64, ~4B Q4 model (e.g. `qwen3.5:4b`). |
| 3 | `CloudProvider` — selectable cloud AI | **Real multi-vendor client.** Provider dropdown in the panel: Claude (Anthropic, default), ChatGPT (OpenAI), Gemini (Google), or Other (any OpenAI-compatible endpoint, manual URL + model). One key stored per provider, so switching never loses a key. Direct browser calls (Anthropic via CORS opt-in header; Gemini supports browser keys; OpenAI may block browser CORS — error says so honestly). Max 512 tokens, editable model field. Honest 401/403/no-key/allowCloud-off reporting; never touches the network without a configured key (regression-guard tested). |

Shared system prompt (`MARS_REASONING_SYSTEM_PROMPT`) reasserts the non-medical safety boundary at the model level, consistent with the `medicalDiagnosis: false` flag on every engine response.

The legacy v0.9.1 `canHandle`/`process` interface on all three providers, and `LocalAIDecisionService`/`AIStatusService`, are preserved unchanged (still used by `DiagnosticsManager`).

## 4. Chat wiring — regression-safe by structure

`ChatReasoningBridge` (services/conversation/) layers **after** the v0.14.3 `ChatConversationBridge`: a turn escalates to the AI chain only if the reply that comes out of `buildChatReply` still contains the generic fallback marker ("How would you like me to assist?"). Memory commands, canned replies, and engine-overridden replies never contain that marker, so they can never be escalated, shadowed, or sent to any AI provider. If every tier is down, the original generic reply is returned unchanged — chat never breaks because a model is offline. `ChatPanel` records the answering provider in `model_used` when a turn was escalated.

## 5. Files

**Added:** `services/ai/AIProviderConfig.js` (provider selection, per-provider keys/models, env seed), `services/ai/AIReasoningService.js`, `services/conversation/ChatReasoningBridge.js`, `tests/AIReasoningSmokeTest.test.js` (16 tests incl. OpenAI/Gemini/Other dispatch and key-switching), `tests/ChatReasoningBridgeSmokeTest.test.js` (5 tests).

**Modified:** `services/ai/LocalProvider.js`, `services/ai/HomeProvider.js`, `services/ai/CloudProvider.js` (rewritten around the new reasoning interface, legacy interface intact), `services/conversation/index.js` (new exports), `components/mars/ChatPanel.jsx` (escalation step), `components/system/AIStatusPanel.jsx` (rebuilt: live per-tier status, key entry/clear with masked display, TEST AI ROUTE with trail, REFRESH TIER STATUS).

## 6. Validation record

- `npm test`: 33/33 files, 126/126 tests (Christian, 11 July 2026).
- `npm run build` and `npm run release-check`: PASS (known recurring Vite >500kB chunk warning, unchanged).
- Manual UI verification (Claude, live dev server via browser automation): MARS Intelligence panel shows honest tier status (Local stub message, "Ollama not reachable", "No Claude API key configured"); TEST AI ROUTE with no tiers up returns "Answered by: None" with the full three-tier trail; `remember my favourite colour is red` → real memory reply; `what is my favourite colour` → correct recall; `what is the capital of France` → graceful generic fallback, chat unbroken; zero console errors from the new layer (only pre-existing benign `no-speech` from VoiceInput).

## 7. Honest limitations / not yet verified

- No live end-to-end answer has been observed yet: Ollama was not installed on the base station at verification time, and no API key had been entered. The honest-failure path is what was verified live. First real end-to-end run (Home tier answering, then Cloud escalation) should be confirmed and noted in the next session.
- Voice and visual-ID inputs reach the reasoning chain only insofar as they land in ChatPanel's text flow; direct wiring of the Voice tab's command router to the reasoning chain is future work.
- `CapabilityRouter.js` remains unwired; decision still deferred to v0.15 scoping.

## 8. Roadmap effect

v0.19.3 "Local AI Integration (Samsung Galaxy S22)" now means: implement the real on-device tier inside the already-built escalation chain (replace the LocalProvider stub), not build AI integration from scratch.
