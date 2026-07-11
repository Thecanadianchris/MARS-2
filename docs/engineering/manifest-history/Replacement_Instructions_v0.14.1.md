# MARS v0.14.1 Replacement Instructions

## Milestone
MARS v0.14.1 – Wake Word & Command Routing

## Purpose
Apply the v0.14.1 replacement package to the existing `mars-standalone` project. This ZIP contains only changed and new files.

## Files Added
- `src/services/voice/WakeWordService.js`
- `src/services/voice/VoiceCommandRouter.js`
- `src/tests/WakeWordServiceSmokeTest.test.js`
- `src/tests/VoiceCommandRouterSmokeTest.test.js`

## Files Replaced
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

## Apply Instructions
1. Back up the current project or ensure Git is clean.
2. Extract this replacement ZIP into the root of `mars-standalone`.
3. Allow files to overwrite existing files.
4. Run:

```powershell
npm run release-check
```

5. Perform UI verification:

```powershell
npm run dev
```

6. Confirm the Voice panel shows:
   - v0.14.1 Wake Word & Command Routing
   - Wake MARS activation
   - Command routing controls
   - Route diagnostics
   - Live audio deferred notice

7. Commit and push:

```powershell
git status
git add .
git commit -m "feat: add v0.14.1 wake word command routing"
git push
```

## Expected Validation
- Test Files: 20 passed
- Tests: 69 passed
- Build: PASS
- Release Check: PASS
- UI Verification: Manual PASS required

## Known Non-Blocking Issue
The Vite bundle-size warning remains. It is non-blocking and deferred to a future performance-focused milestone.
