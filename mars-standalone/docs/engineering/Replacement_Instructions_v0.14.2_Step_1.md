# MARS v0.14.2 Natural Conversation Engine — Step 1 Replacement Instructions

## Purpose
Adds the standalone Natural Conversation Engine service skeleton and smoke tests.

This step does not wire conversation into the UI or live voice pipeline yet.

## Copy these folders into the project root

```text
src/services/conversation/
src/tests/
```

## New service files

```text
src/services/conversation/ConversationSessionService.js
src/services/conversation/ConversationHistoryService.js
src/services/conversation/ConversationContextService.js
src/services/conversation/ReferenceResolver.js
src/services/conversation/ConversationPlanner.js
src/services/conversation/NaturalConversationEngine.js
src/services/conversation/ConversationDiagnosticsService.js
src/services/conversation/index.js
```

## New tests

```text
src/tests/ConversationSessionSmokeTest.test.js
src/tests/ConversationHistorySmokeTest.test.js
src/tests/ConversationContextSmokeTest.test.js
src/tests/ReferenceResolverSmokeTest.test.js
src/tests/ConversationPlannerSmokeTest.test.js
src/tests/NaturalConversationEngineSmokeTest.test.js
src/tests/ConversationDiagnosticsSmokeTest.test.js
```

## Commands to run

```bash
npm test
npm run build
npm run release-check
```

## Expected baseline if successful

```text
28 test files
Approx. 95 tests
Build PASS
Release Check PASS
```

## Notes

Conversation is intentionally separate from Voice.
Voice remains input/output and command routing.
Conversation now owns temporary session context, history, reference resolution, planning and diagnostics.

Persistent memory remains deferred until v0.15.
Live audio remains deferred until v0.14.3.
Medical diagnosis remains false.
