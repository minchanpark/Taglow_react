---
name: taglow-deploy-qa
description: "Prepare and verify Taglow React deployment and release QA: Firebase Hosting rewrites, no-cache app shell, immutable assets, `/e/**` React ownership, `/flutter/**` comparison, same-origin CORS expectations, build output, smoke tests, browser matrix, and release readiness. Use before deploys, when editing firebase config, or when validating production-like routes."
---

# Taglow Deploy QA

## Overview

Make sure deployment preserves the same-origin comparison strategy and the core participant route works after refresh, direct entry, and mobile browser testing.

## Deployment Rules

- React owns `/e/**`.
- Flutter comparison may live under `/flutter/**`.
- Both paths share the same Firebase origin, so CORS allowlist does not change by path.
- SPA direct refresh under `/e/**` must rewrite to React `index.html`.
- App shell and `index.html` should use `no-cache, no-store, must-revalidate`.
- Hashed `/assets/**` can use long immutable caching.

## QA Workflow

1. Build locally and verify output paths.
2. Inspect Firebase config for rewrite order:
   - `/flutter/**` to `/flutter/index.html`
   - fallback to React `/index.html`
3. Confirm no-cache headers for app shell and route entries.
4. Run smoke routes:
   - `/e/11`
   - `/e/11/posts/31`
   - `/e/11/thanks`
   - `/e/11/final`
5. Check real API and S3 image requests on the Firebase origin.
6. Run Playwright core flow when available.
7. Manually check iOS Safari and Android Chrome when release-bound.

## Release Readiness

- `npm run build` succeeds.
- Tests pass or known gaps are documented.
- `/e/11` home displays.
- `/e/11/posts/31` image displays.
- Text tag creation and default center fallback work.
- Thanks skip and final work without PII.
- No PII in logs, storage, fixtures, or URLs.
- Same-origin CORS expectation is verified by origin, not path.

## Avoid

- Do not deploy Flutter and React to the same exact path.
- Do not assume `/react/e/**` or `/flutter/e/**` changes CORS origin.
- Do not leave app shell aggressively cached.
