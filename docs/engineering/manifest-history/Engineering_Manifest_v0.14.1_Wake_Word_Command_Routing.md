# MARS Engineering Manifest

## Version
v0.14.1

## Title
Wake Word & Command Routing

## Status
Release Package Prepared

## Objective Achieved
Extended the v0.14.0 Voice Intelligence Foundation into a simulated voice activation and command-routing framework without introducing live microphone capture, Android audio, speech-to-text, or text-to-speech.

## Architecture Summary
The v0.14.1 voice pipeline is:

```text
Voice Activation Layer
        ↓
WakeWordService
        ↓
VoiceIntentParser
        ↓
VoiceCommandRouter
        ↓
Capability Route Target
```

Voice remains loosely coupled. Commands are routed to capability targets rather than directly executing Vision, Diagnostics, Memory, Robot Control, or Protected User logic.

## Files Added
- `src/services/voice/WakeWordService.js`
- `src/services/voice/VoiceCommandRouter.js`
- `src/tests/WakeWordServiceSmokeTest.test.js`
- `src/tests/VoiceCommandRouterSmokeTest.test.js`

## Files Modified
- `src/services/voice/VoiceService.js`
- `src/services/voice/VoiceCommandRegistry.js`
- `src/services/voice/VoiceIntentParser.js`
- `src/services/voice/VoiceDiagnosticsService.js`
- `src/services/voice/index.js`
- `src/hooks/useVoiceIntelligence.js`
- `src/components/voice/VoicePanel.jsx`
- `src/services/diagnostics/DiagnosticsManager.js`
- `src/tests/VoiceFoundationSmokeTest.test.js`
- `src/tests/VoiceDiagnosticsSmokeTest.test.js`
- `src/tests/VoicePanelSmokeTest.test.js`

## Capability Added
- Simulated wake-word activation
- Voice activation state
- Command routing service
- Route history
- Wake/routing diagnostics
- Interactive Voice Panel controls

## Supported Initial Commands
- `wake mars`
- `voice status`
- `system status`
- `describe scene`
- `cancel`
- `help`
- `check protected user` deferred route

## Explicitly Not Included
- Live microphone capture
- Browser Speech API
- Android audio integration
- Speech-to-text
- Text-to-speech
- Natural conversation engine

## Validation Summary
Validated in the build environment:

```text
npm run release-check
Test Files: 20 passed
Tests: 69 passed
Build: PASS
Release Check: PASS
```

## Known Issues
The Vite bundle-size warning remains. This is non-blocking and deferred to a future performance-focused milestone.

## Next Milestone
v0.14.2 – Natural Conversation Engine
