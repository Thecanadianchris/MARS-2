# Engineering Manifest — v0.14.2 Step 1 Natural Conversation Engine

## Status
Prepared for local replacement and validation.

## Scope
Standalone conversation capability foundation only.

## Added Services
- ConversationSessionService
- ConversationHistoryService
- ConversationContextService
- ReferenceResolver
- ConversationPlanner
- NaturalConversationEngine
- ConversationDiagnosticsService
- conversation index barrel

## Added Smoke Tests
- ConversationSessionSmokeTest
- ConversationHistorySmokeTest
- ConversationContextSmokeTest
- ReferenceResolverSmokeTest
- ConversationPlannerSmokeTest
- NaturalConversationEngineSmokeTest
- ConversationDiagnosticsSmokeTest

## Architecture Notes
Conversation is now a separate capability module under:

```text
src/services/conversation/
```

Voice is not modified in this step.

## Deferred
- UI diagnostics card
- VoiceService integration
- Live audio pipeline
- Persistent memory
- Text-to-speech
- Speech-to-text

## Safety Boundary
The Natural Conversation Engine does not make medical diagnoses, does not execute robot hardware and does not write persistent memory.

## Validation Required Locally
```bash
npm test
npm run build
npm run release-check
```
