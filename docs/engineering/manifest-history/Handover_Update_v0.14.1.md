# MARS Software Engineering Handover Update

## Version
v0.14.1

## Milestone
Wake Word & Command Routing

## Current Stable Baseline After Validation
v0.14.1 extends the Voice Intelligence Foundation with a simulated activation layer and command router.

## Validation Figures
- 20 test files PASS
- 69 tests PASS
- Build PASS
- Release Check PASS
- UI verification required after local extraction

## What Changed
The Voice subsystem now supports the first logical command pipeline:

```text
Wake Trigger
      ↓
WakeWordService
      ↓
VoiceIntentParser
      ↓
VoiceCommandRouter
      ↓
Capability Route Target
```

This is intentionally not a live audio milestone. It validates the architecture needed for future microphone, Android audio and speech-to-text integration.

## Engineering Notes
- Voice does not directly call Vision, Diagnostics, Memory or Robot Control.
- Voice routes commands to capability targets.
- Wake word is simulated for now.
- Live audio remains deferred.
- Medical diagnosis remains explicitly out of scope.

## Next Roadmap Item
v0.14.2 – Natural Conversation Engine

## Workflow Reminder
Going forward, continue using:

```text
Project ZIP
Replacement ZIP
Replacement Instructions
Engineering Manifest
Updated Handover
npm run release-check
UI verification
Git commit
Git push
```
