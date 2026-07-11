# MARS v0.13.0 Identity Foundation

Document: MARS_v0.13.0_IDENTITY_FOUNDATION  
Version: v0.13.0  
Status: Active Development  
Date Code: 030726

## Purpose

The v0.13.0 Identity Foundation introduces the first dedicated identity subsystem for MARS.

Identity answers:

> Who is this?

It does not answer:

> What permissions do they have?  
> What should MARS do?  
> Who should be notified?

Those responsibilities remain separate and belong to future User Management, Decision Intelligence and Notification subsystems.

## Architecture

```text
Vision
  ↓
Identity
  ↓
Decision Context
  ↓
Decision Intelligence
```

The Identity Foundation is deliberately local, replaceable and testable.

## Implemented Modules

```text
src/services/identity/
├── IdentityDiagnosticsService.js
├── IdentityEngine.js
├── IdentityObservationBuilder.js
├── IdentityStateMachine.js
├── IdentityTypes.js
├── PersonRegistry.js
├── ProfileAuthorisationService.js
└── index.js
```

## User Types

The foundation recognises the following identity categories:

- Owner
- Administrator
- Trusted User
- Protected User
- Guest
- Unknown
- Blocked

Unknown users must never automatically become trusted.

## Protected Users

Protected users are supported as an identity category for observation and decision priority only.

This does not create diagnosis capability and does not turn MARS into a medical device.

## Current Known Profiles

The registry currently contains placeholder local profiles for:

- Christian
- Ann
- Finley

These are static software profiles only. Real face recognition and biometric matching are future work.

## Future Work

The Identity Foundation prepares for:

- v0.13.1 Identity Recognition
- v0.13.2 User Management and Notifications
- v0.14.0 Voice Intelligence
