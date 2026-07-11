# M2 – Diagnostics UI Integration

Document ID: M2-DIAG-001

Version: v0.13.4

Status: Planned

## Purpose

Integrate a permanent engineering diagnostics interface into the MARS user interface.

The Diagnostics UI exposes the internal state of the MARS software stack in
real time to assist development, testing, debugging and future field support.

## Objectives

- Display live camera state
- Display Vision Pipeline status
- Display Tracking ID
- Display Identity Engine state
- Display Recognition Confidence
- Display User Role
- Display Behaviour Engine state
- Display Body Position
- Display Head Orientation
- Display Movement State
- Display Risk Score
- Display Decision Engine output
- Display Notification status
- Display System Health
- Display Frame Rate

## UI Layout

1. Vision
2. Identity
3. Behaviour
4. Decision
5. Notifications
6. User
7. System Health

## Data Sources

VisionPipeline
IdentityEngine
RecognitionCandidate
RecognitionConfidence
BehaviourPatternEngine
Decision Engine
NotificationManager
UserManager

## Acceptance Criteria

- npm run build passes
- npm run smoke passes
- npm run release-check passes
- Dashboard updates live
- No diagnostic panel blocks pipeline execution

## Future Expansion

- Face Recognition
- Voice Recognition
- Memory Engine
- Learning Engine
- Seizure Behaviour Indicators
- Dementia Behaviour Indicators
- Fall Detection
- Environmental Awareness

End of Document
