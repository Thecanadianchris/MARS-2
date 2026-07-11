# Engineering Manifest — v0.14.3 Speech Capability & Chat Conversation Bridge

## Status
Implemented, tested, manually UI-verified live (including regression checks), committed pending. Christian confirmed test/build passing before this manifest was written.

## Scope
Two coupled pieces of work, done together per an explicit decision this session (the "coupled" option, chosen over doing v0.14.3 as diagnostics-only and leaving chat wiring for later):

1. **Formalize real browser audio capability.** `ChatPanel.jsx` was discovered to already have real, working Speech-to-Text (`VoiceInput.jsx`, Web Speech API) and Text-to-Speech (`ChatPanel`'s `speak()`), completely separate from the `services/voice/` architecture, which explicitly declared `speechToTextEnabled: false` / `textToSpeechEnabled: false` / `liveAudioEnabled: false` as "future milestones." This step gives that real capability a central, honest, reportable home without touching the working recognition/synthesis code itself.
2. **Wire `NaturalConversationEngine` into live chat**, without regressing anything that currently works.

## Context — why "coupled" instead of the safer split
Original plan was to keep v0.14.3 (audio diagnostics) and "wire conversation into chat" (a separate, bigger decision) apart, matching the project's usual low-risk incremental pattern. Scoping v0.14.3 surfaced that ChatPanel's real audio and the formal voice architecture were two disconnected implementations of the same capability — closing that gap made the two pieces of work naturally coupled. Christian explicitly chose the coupled option after this was explained.

## Critical design constraint — no regression to real memory
`NaturalConversationEngine`'s `ROUTE_TO_MEMORY` plan branch is a v0.15 placeholder ("Memory is planned for v0.15; answer with current limitation") — it does not read or write real storage. `ChatPanel`'s existing `remember`/`recall`/`clear memory` commands are real, working, and back the Notes tab. Blindly routing all chat replies through the engine would have silently broken "remember my birthday is June 5th" — replacing a real answer with a placeholder. This was caught during design, before any code was written, and is the reason `ChatConversationBridge` exists instead of a direct swap.

## Added
- `services/voice/SpeechCapabilityService.js` — pure, honest detection of `SpeechRecognition`/`SpeechSynthesis` browser support. Extracted from the inline check that previously lived only in `VoiceInput.jsx`.
- `services/conversation/ChatConversationBridge.js` — the regression-safe decision layer. `NaturalConversationEngine.processTurn()` is now consulted on every chat turn (real session/context/reference tracking — pronoun resolution, cancel, confirm/continue — capabilities ChatPanel had zero of before), but its response only replaces the reply text when ChatPanel's own logic would otherwise return the generic `"...How would you like me to assist?"` fallback, and only for plan actions genuinely new to chat (`cancel_action`, `continue_previous_action`, `ask_clarifying_question`, `route_to_vision`). Every existing memory command and every specific canned reply in `createLocalMarsReply` is structurally protected — the bridge never sees them as override candidates because they never produce the generic marker.
- New "Browser Audio Capability" section in `VoicePanel.jsx` — reports real STT/TTS support with an explicit note that this is separate from the Voice tab's own simulated command routing.
- `browserSpeechCapability` field added to `VoiceService.getStatus()` and `VoiceDiagnosticsService.evaluate()` — additive only. The existing `speechToTextEnabled` / `textToSpeechEnabled` / `liveAudioEnabled` flags at the simulated-command-routing layer remain `false`, and remain correct: VoicePanel itself is still typed-transcript only, no live mic wired into it.
- `ChatConversationBridgeSmokeTest.test.js` (7 tests, including two explicit REGRESSION GUARD tests) and `SpeechCapabilitySmokeTest.test.js` (3 tests).

Test baseline moved from 29 files / 99 tests to **31 files / 109 tests**, all passing.

## Modified (behavior-preserving)
- `VoiceInput.jsx` — uses `SpeechCapabilityService.getSpeechRecognitionConstructor()` instead of an inline `window.SpeechRecognition || window.webkitSpeechRecognition` check. Identical runtime behavior.
- `ChatPanel.jsx` — `sendMessage` now computes both `localReply` (unchanged existing logic) and `engineResult` (`NaturalConversationEngine.processTurn`), and passes both through `buildChatReply` to get the final reply text.

## Manual UI Verification (live, via browser automation against `npm run dev`)
- "remember my birthday is June 5th" → real memory reply unchanged: *"Understood, Christian. I will remember that your birthday is June 5th."*
- "what is my birthday" → real recall unchanged: *"Your birthday is June 5th, Christian."*
- Notes tab confirmed genuine storage: `birthday: June 5th`.
- "who do you see right now" (a message local reply logic has no specific answer for) → engine enhancement fired correctly: *"I can use the current conversation context to route this towards vision."*
- "never mind" → engine cancellation enhancement fired correctly: *"I have cancelled the current conversational action."*
- Voice tab's new Browser Audio Capability section renders correctly: Speech-to-Text Supported, Text-to-Speech Supported (Chrome).
- Console checked: zero errors.

## Deferred (unchanged, still correctly out of scope)
- `CapabilityRouter.js` dispatch — still confirmed unwired.
- Persistent memory (real storage inside the conversation engine itself, as opposed to the separate working `memory.js` store) — v0.15.
- Wake-word/command-routing layer (`VoicePanel`) gaining real live audio — the simulated-flags there remain accurate and untouched.
- Android audio pipeline.

## Safety Boundary
Unchanged: no medical diagnosis, no hardware execution, no persistent memory written by the conversation engine. `ChatConversationBridge` was specifically designed so that even the illusion of memory regression is structurally prevented, not just avoided by convention.

## Validation Required Locally
```bash
npm test
npm run build
npm run release-check
```
All three run and passed by Christian (31/31 test files, 109/109 tests, clean build) prior to this manifest being written.

## Suggested Commit
```bash
git add -A
git commit -m "feat: v0.14.3 speech capability service + regression-safe chat conversation bridge"
git push origin feature/v0.13.0-identity-foundation
```
