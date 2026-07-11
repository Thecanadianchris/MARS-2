# MARS v0.13.3 Behaviour Intelligence Foundation

## Status

Engineering milestone for the MARS Software Project.

## Purpose

The Behaviour Intelligence Foundation introduces a neutral observation layer for body position, head direction, movement state and inactivity.

This subsystem supports the MARS mission:

```text
Observe → Understand → Decide → Notify
```

It does not diagnose medical conditions.

## Scope

This milestone adds:

```text
src/services/behaviour/
├── BehaviourProfile.js
├── BehaviourObservationBuilder.js
├── BehaviourPatternEngine.js
├── BehaviourRiskScoring.js
├── ProtectedBehaviourPolicy.js
└── index.js

src/tests/
└── BehaviourIntelligenceSmokeTest.test.js
```

## Behaviour Observations

The foundation supports observations including:

- body position
- floor or lying position
- head direction
- up-left or up-right head direction
- movement state
- unusual movement
- inactivity duration
- protected user observation priority

## Protected Users

Protected users, such as Finley or future vulnerable users, may receive elevated observation priority.

This affects concern scoring and notification recommendations only.

It must never be represented as a medical diagnosis.

## Example Statement

Correct:

```text
MARS has detected unusual body position or movement for a protected user. Please check on them.
```

Incorrect:

```text
MARS has diagnosed a seizure.
```

## Architecture

```text
Vision
  ↓
Body / Pose / Movement Observations
  ↓
Behaviour Intelligence
  ↓
Identity / Protected User Rules
  ↓
Decision Engine
  ↓
Notification Manager
```

## Validation

After applying this milestone, run:

```bash
npm run build
npm run smoke
npm run release-check
```

The milestone is not complete until all three pass.
