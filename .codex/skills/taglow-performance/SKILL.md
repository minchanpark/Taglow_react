---
name: taglow-performance
description: "Measure, debug, and improve Taglow React performance: QR-to-first-screen, first text tag within 30 seconds, Vite bundle size, route-level code splitting, font/asset loading, DOM image loading, layout shift, mobile input responsiveness, and Firebase cache headers. Use when checking speed, bundle growth, image performance, or production readiness."
---

# Taglow Performance

## Overview

Optimize the field experience: fast app shell, stable image loading, and quick first tag. Avoid adding non-MVP weight to the initial bundle.

## Performance Targets

- JS loading should not leave a blank white screen.
- First route must show app shell quickly on slow 4G.
- First text tag should be possible within 30 seconds.
- Detail images should load through DOM `<img>` and never remain a black/blank surface after successful network load.
- Fonts/assets should not block first paint.

## Optimization Rules

- Keep media upload SDKs out of the MVP initial bundle.
- Lazy-load thanks/final and future media modules when useful.
- Prefer WOFF2 subset or system font fallback; do not ship multiple large OTFs by default.
- Keep logo/favicon small and purpose-sized.
- Use `decoding="async"` for detail images.
- Use server image ratio or natural ratio to reduce layout shift.
- Cache hashed assets long-term, but keep app shell/index no-cache.

## Measurement Workflow

1. Build the app and inspect bundle output.
2. Check initial route payload and route-level chunks.
3. Run Playwright or browser profiling for:
   - `/e/:eventId` app shell visible
   - home visible
   - detail image visible
   - input focus
   - submit
   - tag visible
4. Check mobile viewport layout and safe-area effects.
5. Make the smallest change that removes measurable bottleneck.
6. Re-measure and record before/after.

## Watch List

- Large dependencies added to `dependencies`.
- Fonts or images imported into app shell.
- Whole-page rerenders during drag.
- Unstable image rect causing overlay layout shift.
- Query refetch loops on route changes.
