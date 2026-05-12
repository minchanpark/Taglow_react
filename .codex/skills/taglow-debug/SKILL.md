---
name: taglow-debug
description: "Debug Taglow React runtime, test, API, CORS, image loading, routing, state, drag/drop, storage, and deployment problems. Use when something fails, regresses, is flaky, shows blank/black image areas, loses tags, leaks boundary responsibilities, or behaves differently across mobile browsers."
---

# Taglow Debug

## Overview

Find the failing layer first, then fix the smallest responsible boundary. Preserve pending/failed user-visible states while debugging.

## Triage Map

- Route or blank page: `src/app`, Firebase rewrite, router params.
- Home data missing: gateway endpoint, mapper event/questions aliases, controller query state.
- Detail image blank: image URL priority, `<img>` load/error, CORS/network, image rect, CSS.
- Tag missing or wrong position: coordinate conversion, overlay rect, tagging engine, mapper coordinate aliases.
- Save failure: session header, createTag payload, pending marker recovery, service error handling.
- Reward failure: validation, consent gate, redacted event-users request.
- Mobile interaction failure: pointer capture, touch-action, safe area, keyboard.

## Workflow

1. Reproduce with the narrowest route or test.
2. Capture exact symptom, URL, viewport, data mode, and expected behavior.
3. Identify the layer by searching call paths with `rg`.
4. Add or adjust a failing test when practical.
5. Fix at the owning layer, not at a downstream workaround layer.
6. Re-run the focused test, then broader build/test as available.
7. Check for similar boundary leaks or duplicated fixes.

## Debug Commands

- Use `rg` first for ownership and call paths.
- Use `npm run test -- --run` or the repo's actual test command when available.
- Use Playwright for image visibility, mobile viewport, and drag/drop regressions.
- Use browser/network inspection for image request status, CORS, and natural dimensions.

## Do Not

- Do not "fix" DTO issues in View.
- Do not clear failed pending tags just to make UI clean.
- Do not add PII logs for diagnosis.
- Do not assume path changes affect CORS origin.
