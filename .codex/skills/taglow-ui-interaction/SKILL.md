---
name: taglow-ui-interaction
description: "Build, debug, or review Taglow mobile UI and image tagging interactions: responsive mobile frame, home cards, DOM img detail image, image bounds, ratio coordinate conversion, tag overlay, staged sticker drag/drop, bottom SOI input bar, keyboard/safe-area behavior, thanks/final views. Use for view, CSS, pointer, layout, and visual interaction work."
---

# Taglow UI Interaction

## Overview

Implement the browser-native mobile tagging experience: fast visual feedback, stable image bounds, reliable touch/pointer interaction, and no hidden failure states.

## Required Reading

- `src/view/AGENTS.md`
- Target page/widget `AGENTS.md`
- `src/utils/AGENTS.md`
- PRD U1-U6 and TDD `이미지 및 좌표 설계`, `View 설계`, `View CSS 설계`

## UI Rules

- Mobile first: 360-430px must work; desktop uses a centered 430-520px mobile frame.
- Keep text inside containers with wrapping, stable dimensions, or ellipsis.
- Use 44px or larger touch targets for tappable controls.
- Render question images with DOM `<img>`, `object-fit: contain`, `decoding="async"`, and explicit load/error state.
- Do not let image taps create new tags.
- Do not hide pending or failed tag states.
- Keep reward PII only in thanks flow.

## Image And Tagging Rules

- Use one image rendered rect for `<img>`, overlay, and drop target.
- Compute image rect from container size and effective aspect ratio.
- Prefer natural image ratio after load; fallback to server `imageRatio`, then `4 / 5`.
- Store and pass `TagCoordinate`, never raw pixels.
- Convert pointer client position to local image ratio at drop time.
- Use `(0.5, 0.5)` fallback when no drag happened or bounds are unavailable.
- Use `touch-action: none` on draggable sticker elements.

## Workflow

1. Identify whether the work belongs in page, widget, utils, or page-local CSS.
2. Keep component props domain-oriented and callback-based.
3. Put pure coordinate math in `src/utils` or `tagDropGeometry`.
4. Keep API saves in controller callbacks, not widgets.
5. Verify loading, empty, error, failed, pending, and success visuals.
6. Check desktop and mobile viewport screenshots when a dev server exists.

## Common Acceptance Checks

- Home card click navigates to detail.
- Broken image shows fallback, not a black/blank surface.
- Staged sticker can be dragged and saved.
- Completing without drag saves center coordinate.
- Mobile keyboard does not permanently hide the input flow.
