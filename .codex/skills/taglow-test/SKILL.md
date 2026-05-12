---
name: taglow-test
description: "Create, update, run, and diagnose Taglow React tests across Vitest unit tests, React Testing Library component tests, MSW API mocks, and Playwright e2e flows. Use when adding test coverage, verifying a feature, reproducing bugs, checking API boundary behavior, image visibility, drag/drop, thanks/final, or release readiness."
---

# Taglow Test

## Overview

Test from the narrowest stable layer outward. Prioritize gateway/mapper boundaries, image visibility, coordinate math, and the core QR-to-final flow.

## Test Pyramid

- Unit: domain helpers, mapper, gateway, openapi service orchestration, session store, tagging engine.
- Component: pages/widgets state rendering and user events with mocked services/MSW.
- E2E: routing, image visibility, text tag creation, drag/default fallback, thanks/final, failure states.

## Required Cases

Unit:
- `imageRatio: 7353 -> 0.7353`
- proxy image URL priority
- coordinate aliases and clamp
- questions list/object selection
- `taglow-Session-Id` header on tag operations
- no `Content-Type` on bodyless GET
- event-users body redaction
- failed save marker recovery
- default center fallback

Component:
- home loading/error/empty/list
- `ItemCard` click
- image load/error fallback
- overlay ratio placement
- bottom input staged/cancel
- thanks consent and skip
- final home navigation

E2E:
- `/e/11 -> /e/11/posts/31 -> tag -> thanks -> final`
- detail image visible via request, `<img>.complete`, natural size, and screenshot non-background pixels
- drag sticker and default center fallback
- save failure retry
- image failure fallback

## Workflow

1. Read the target directory `AGENTS.md`.
2. Choose the lowest test layer that proves the behavior.
3. Use Mock Service/MSW rather than real API for deterministic tests.
4. Avoid PII in fixtures and snapshots.
5. Run focused tests first, then broader commands.
6. If a test cannot run because scaffolding is missing, state exactly what is missing.

## Anti-Patterns

- Do not use real production contact info.
- Do not make View tests assert raw DTO shapes.
- Do not rely on arbitrary waits in Playwright when state/network waits are possible.
- Do not skip image pixel checks for the core visibility risk.
