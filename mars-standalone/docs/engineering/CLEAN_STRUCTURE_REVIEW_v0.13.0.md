# MARS Clean Structure Review

## Version
v0.13.0 Identity Foundation Clean Baseline

## Purpose
This document records the clean project structure prepared before continuing MARS v0.13.0 Identity Foundation.

## Clean-up Performed
Removed from the clean deliverable:

- `node_modules/` — dependency install output; restored with `npm install`.
- `dist/` — production build output; recreated by `npm run build`.
- `.idea/` — local IDE metadata; not part of source control.
- `patch/` — historical patch ZIPs; superseded by Git history and release packages.
- duplicate/broken Identity filename `IdentityEngine (2).js` — corrected to `IdentityEngine.js`.

## Architecture Preserved
The existing MARS architecture was preserved. Source folders were not unnecessarily renamed or moved.

Current major source areas:

- `src/components/` — user interface components.
- `src/core/observations/` — shared observation registry.
- `src/models/` — decision models.
- `src/pages/` — application pages.
- `src/services/ai/` — local/cloud AI provider abstraction.
- `src/services/decision/` — decision intelligence layer.
- `src/services/identity/` — v0.13.0 Identity Foundation.
- `src/services/vision/` — vision and perception pipeline.
- `src/tests/` — smoke test framework.

## Engineering Position
This clean baseline keeps MARS focused on the established roadmap:

Vision Intelligence → Decision Intelligence → Identity Intelligence → Voice → Memory → Environment → Home → Robotics → Mk1.

MARS remains primarily a non-medical assistive monitoring and alerting platform designed to detect possible trouble states and support human intervention.

## Validation Performed
The working source was validated before packaging:

- `npm run build` passed.
- `npm run smoke` passed.
- Identity Foundation smoke test passed after correcting the IdentityEngine filename.

Note: the Vite bundle-size warning remains unchanged from the existing project baseline and is not a blocking defect.
