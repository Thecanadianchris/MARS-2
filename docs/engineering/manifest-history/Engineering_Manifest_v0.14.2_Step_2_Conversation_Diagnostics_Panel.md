# Engineering Manifest — v0.14.2 Step 2 Conversation Diagnostics Panel

## Status
Implemented, tested and manually UI-verified via live dev server (`npm run dev`) using browser automation. Not yet committed at time of writing — see Validation Required Locally.

## Scope
Give the v0.14.2 Natural Conversation Engine (built in Step 1) a UI diagnostics surface, mirroring the existing VoicePanel pattern. Diagnostics only — does not wire the engine into live chat.

## Context
Step 1 (`Engineering_Manifest_v0.14.2_Step_1_Natural_Conversation_Engine.md`) built `NaturalConversationEngine` and its supporting services fully tested (28 test files / 95 tests) but with zero UI surface — confirmed by grep, nothing in the live app imported it. `ChatPanel.jsx` (the Chat tab) runs its own separate regex-based reply logic and was, and remains, untouched by this step. This step closes that gap the same way v0.14.1 → v0.14.1.1 did for voice: add a dedicated diagnostics panel before any live-chat wiring is considered.

## Added
- `hooks/useConversationIntelligence.js` — React hook wrapping `NaturalConversationEngine`, mirrors `useVoiceIntelligence`.
- `components/conversation/ConversationPanel.jsx` + `components/conversation/index.js` — new diagnostics panel, mirrors `VoicePanel`. Sections: session/turn/history/topic metrics, a free-text conversation-turn input with Send/Reset, latest plan + reference resolution, latest response, safety boundary, "not included" notice.
- New "CONV" tab wired into `pages/Control.jsx`, positioned between Voice and Diagnostics.

## Added Smoke Tests
- `ConversationPanelSmokeTest.test.js` (4 tests) — validates the data shape the panel/hook consume: idle snapshot shape, a vision-routed turn, a memory-routed turn (safety boundary check), and reset behaviour.

Test baseline moved from 28 files / 95 tests to **29 files / 99 tests**, all passing.

## Manual UI Verification
Ran `npm run dev`, navigated the live app via browser automation:
- New CONV tab renders correctly with idle state (session: idle, turns: 0, history: 0, topic: —).
- Sent "who do you see right now" → Plan `route_to_vision` (VISION badge), response "Vision Conversation Request" at 78% confidence, matching lines rendered correctly. History incremented to 1, session became active.
- Sent "remember my birthday is June 5th" → Plan `route_to_memory` (MEMORY badge), response "Memory Not Yet Active" at 62% confidence, correct deferred-to-v0.15 messaging.
- Reset button correctly cleared session/history back to idle.
- Checked browser console: no errors. Only routine Vite dev-connection logs and pre-existing React Router future-flag warnings (unrelated to this change).
- Confirmed the separately-completed Notes rename (Memory tab → Notes tab, `MemoryPanel.jsx` → `NotesPanel.jsx`) also renders correctly live: "MARS Notes" header, "No notes stored yet.", "Clear Notes" button.

## Architecture Notes
Conversation UI lives under:
```text
src/components/conversation/
```
following the same per-capability folder convention as `voice/`, `behaviour/`, `decision/`, `identity/`, `notifications/`, `diagnostics/`.

## Deferred (unchanged from Step 1, still correctly out of scope)
- Wiring `NaturalConversationEngine` into live `ChatPanel` as the actual reply source.
- `CapabilityRouter.js` dispatch (confirmed in this session's earlier audit: built, tested-adjacent, but not imported anywhere — remains inert scaffolding).
- Live microphone capture, STT, TTS (targeted for v0.14.3 per MVCH).
- Persistent memory (targeted for v0.15).

## Safety Boundary
Unchanged from Step 1: the Natural Conversation Engine does not make medical diagnoses, does not execute robot hardware and does not write persistent memory. Every response and status object carries explicit `medicalDiagnosis: false`, `liveAudio: false`, `persistentMemory: false` flags, verified live in this panel's output during manual UI verification above.

## Validation Required Locally
```bash
npm test
npm run build
npm run release-check
```
All three already run and passed by Christian in this session (29/29 test files, 99/99 tests, clean build) prior to this manifest being written. Commit and push still outstanding — see below.

## Suggested Commit
```bash
git add -A
git commit -m "feat: add v0.14.2 Step 2 conversation diagnostics panel"
git push origin feature/v0.13.0-identity-foundation
```
