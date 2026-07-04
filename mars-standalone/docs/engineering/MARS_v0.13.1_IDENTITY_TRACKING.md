# MARS v0.13.1 Identity Tracking Layer

## Document Control

- Document: MARS v0.13.1 Identity Tracking Layer
- Version: v0.13.1
- Date Code: 040726
- Status: Engineering Milestone

## Purpose

This document records the Identity Tracking Layer introduced after the v0.13.0 Identity Foundation.

The purpose of this milestone is not biometric face recognition. The purpose is to establish the provider-neutral architecture that future recognition systems will use.

## Architectural Position

```text
Vision
  ↓
Identity Tracking
  ↓
Recognition Candidate
  ↓
Identity Engine
  ↓
Decision Engine
```

Vision answers where a person is.

Identity answers who the person may be.

User Management answers what permissions the person has.

Decision Intelligence answers what MARS should do.

## Added Components

### IdentityTrackingService

Maintains active tracking records for observed people and assigns tracking IDs such as `TRK-000001`.

### RecognitionCandidate

Defines the standard provider-neutral object passed into Identity. Future providers such as MediaPipe, OpenCV, Gemini or another local model must adapt into this format.

### RecognitionConfidence

Normalises confidence values from Vision, Tracking, Face Quality and future Identity Recognition providers.

### FaceQualityEngine

Determines whether face evidence is suitable for future recognition attempts.

### IdentityTimelineService

Maintains a lightweight timeline of identity tracking events for diagnostics, future memory and future notification reasoning.

## Engineering Constraints

- No biometric recognition is implemented in this milestone.
- Unknown people are never automatically promoted to trusted users.
- Tracking is not identity.
- Recognition candidates are not permission records.
- Identity remains separate from User Management, Decision Intelligence and Notifications.

## Validation

This milestone adds `IdentityTrackingSmokeTest.test.js`.

Expected validation commands:

```bash
npm run build
npm run smoke
npm run release-check
```

All three must pass before the milestone is considered complete.
