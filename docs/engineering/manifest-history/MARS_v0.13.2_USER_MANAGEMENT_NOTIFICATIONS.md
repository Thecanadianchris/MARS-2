# MARS v0.13.2 — User Management and Notification Architecture

## Status

Engineering milestone package.

## Purpose

This milestone introduces the User Management and Notification architecture for MARS.

Identity answers:

> Who is this?

User Management answers:

> What permissions do they have?

Decision Intelligence answers:

> What should MARS do?

Notification Management answers:

> Who should be informed?

## User Roles

- Owner
- Administrator
- Trusted User
- Protected User
- Guest
- Unknown
- Blocked

Unknown users must never become trusted automatically.

## Protected Users

Protected users increase observation and notification priority only.

MARS does not diagnose medical conditions.

## Notification Rule

Notifications are generated from Decision Engine outputs and user context.

Vision and Identity must not directly send notifications.

## Validation

After applying this milestone, run:

```bash
npm run build
npm run smoke
npm run release-check
```

Only commit after all checks pass.
