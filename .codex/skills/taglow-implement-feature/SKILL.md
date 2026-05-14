---
name: taglow-implement-feature
description: "Implement Taglow React MVP features in React/TypeScript while preserving PRD/TDD architecture. Use when adding pages, controllers, stores, services, models, utils, view-local CSS, app routing, or feature behavior for home, detail tagging, bottom input, thanks, final, or session flow."
---

# Taglow Implement Feature

## Overview

Implement features end to end without leaking responsibilities across layers. Favor the existing `src` structure and directory `AGENTS.md` over inventing new patterns.

## Start Here

- Read `AGENTS.md` and the nearest directory `AGENTS.md`.
- Use `taglow-product-architecture` if scope or phase is unclear.
- Use `taglow-api-boundary` for API/model/service work.
- Use `taglow-ui-interaction` for image bounds, overlay, drag, input, mobile layout.
- Use `taglow-test` before finishing.

## Workflow

1. Identify the feature phase and owning directories.
2. Add or update domain types first if the feature needs new data shape.
3. Add service interface changes before implementations.
4. Implement gateway/mapper only for server-facing behavior.
5. Implement controller hooks/stores for state, derived values, and event callbacks.
6. Implement View components as rendering/composition only.
7. Add focused tests in the smallest layer that proves the behavior.
8. Run available build/test commands and report any command that cannot run.

## Layer Placement

- `src/app`: router, providers, query client, app shell.
- `src/api/model`: pure domain types and helpers.
- `src/api/service`: `ParticipantService`, mock/openapi service, tagging engine.
- `src/api/service/gateway`: endpoint/header/path-id transport adapters.
- `src/api/service/mapper`: raw payload to domain conversion.
- `src/api/controller`: hooks and store orchestration.
- `src/view`: pages and widgets only.
- `src/utils`: pure functions and safe browser wrappers.
- View CSS lives beside each page/component; do not add `src/theme` or runtime global CSS.

## Non-Negotiables

- Do not call `fetch` from View or Controller.
- Do not call localStorage outside safe utils/session store.
- Do not store pixel coordinates.
- Do not require reward PII before tag completion.
- Do not add photo/video/S3 upload to the MVP bundle unless explicitly requested.
- Do not hide failed/pending tag states.

## Finish Criteria

- Feature works through the controller/View contract.
- Required loading/error/empty/success states exist.
- Relevant tests or a clear verification note exist.
- Files changed are scoped to the requested feature.
