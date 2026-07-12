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
| 2 | `HomeProvider` — Ollama on the base station (Snapdragon X) | **Real client, verified live.** Probes `/api/tags` (1.5s timeout, 5s cache), generates via `/api/generate` (60s timeout, `think:false` with automatic retry-without-flag on HTTP 400 for non-thinking models). Availability comes only from a live probe. Default endpoint is `/ollama` — a same-origin Vite dev-server proxy to `localhost:11434` (see vite.config.js) that strips the browser Origin header, sidestepping browser CORS entirely (no `OLLAMA_ORIGINS` env var needed). Model = configured or first installed. Runtime in use: Ollama native ARM64, `qwen3.5:4b`. |
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

## 7. End-to-end verification — completed (12 July 2026)

All three live paths confirmed on the real stack (Ollama ARM64 + `qwen3.5:4b` on the Snapdragon X, Claude key entered at runtime):

- **Cloud escalation, live:** with the Home tier failing, TEST AI ROUTE was answered by `Cloud AI · claude-haiku-4-5-20251001` — the first real AI response in MARS history — with the honest trail Local: unavailable → Home: error → Cloud: success.
- **Home tier, live:** after fixes, TEST AI ROUTE answered by `Home AI Server · qwen3.5:4b`; trail Local: unavailable → Home: success, Cloud untouched. Local-first confirmed working.
- **Chat, live:** "what is the capital of France" returned a real Home-tier answer tagged `via HOME_AI_SERVER`; memory questions still answered locally (`via auto`), never escalated. Zero console errors.

**Debugging record (for future reference):** browser calls to Ollama initially failed with HTTP 503 on `/api/generate` while CLI/PowerShell calls succeeded; additionally `qwen3.5:4b` is a thinking model whose chain-of-thought blew the original 30s timeout on CPU. Fixes: (a) `think:false` in the generate request with a 400-retry fallback, (b) timeout raised to 60s, (c) replaced the direct-URL call with the `/ollama` same-origin Vite proxy (Origin header stripped), which eliminated the browser/CORS failure class completely. `setx OLLAMA_ORIGINS` proved unnecessary and can be removed from the user environment (`REG delete "HKCU\Environment" /v OLLAMA_ORIGINS /f`).

## 8. Remaining limitations

- ~~The `/ollama` proxy exists in the Vite dev server only~~ — resolved post-release: the same proxy is now applied to `vite preview` as well, so the production build served locally behaves identically to dev. Only a genuinely external deployment (Android app / base-station server, v0.19.x) will need its own equivalent, which is that phase's concern. The `OLLAMA_ORIGINS` user env var has been removed.
- Voice and visual-ID inputs reach the reasoning chain only insofar as they land in ChatPanel's text flow; direct wiring of the Voice tab's command router to the reasoning chain is future work.
- `CapabilityRouter.js` remains unwired; decision still deferred to v0.15 scoping.

## 9. Roadmap effect

v0.19.3 "Local AI Integration (Samsung Galaxy S22)" now means: implement the real on-device tier inside the already-built escalation chain (replace the LocalProvider stub), not build AI integration from scratch.
