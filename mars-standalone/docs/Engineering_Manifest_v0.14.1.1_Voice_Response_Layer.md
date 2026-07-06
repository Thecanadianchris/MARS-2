# MARS Engineering Manifest

## Version
v0.14.1.1

## Title
Voice Response Layer

## Status
Release Candidate

## Objective Achieved
Completed the v0.14.1 voice routing feedback loop by adding deterministic UI-visible responses for routed commands.

## Scope
This is a patch release for v0.14.1. It does not introduce live microphone capture, speech-to-text, text-to-speech, Android audio, or natural conversation.

## Added
- VoiceResponseService
- Latest Voice Response UI panel
- Response diagnostics
- Response smoke tests

## Commands With Visible Responses
- wake mars
- voice status
- system status
- describe scene
- help
- cancel
- unknown command handling
- protected user route deferred response

## Validation Summary
Validated in generation environment:

- Test Files: 21/21 PASS
- Tests: 74/74 PASS
- Build: PASS
- Release Check: PASS

## UI Verification Required
Manual UI verification is still required on the user's local machine before Git commit and push.

## Known Issues
Vite bundle-size warning remains. This is non-blocking and deferred to a future performance-focused milestone.

## Next Milestone
v0.14.2 — Natural Conversation Engine
