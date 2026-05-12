---
name: taglow-review-refactor
description: "Review, audit, and refactor Taglow React code for architecture boundaries, correctness, maintainability, tests, mobile UX risks, security/privacy regressions, and performance risks. Use for code review, pre-merge cleanup, refactoring, boundary leak checks, or when asked to find bugs and risks."
---

# Taglow Review Refactor

## Overview

Review with a bug-risk-first stance. Refactor only when it reduces real complexity, removes meaningful duplication, or restores project boundaries.

## Review Order

1. Product invariants: routes, tag entry point, coordinates, PII separation.
2. Layer boundaries: View -> Controller -> Service -> Gateway/Mapper.
3. API behavior: endpoint mapping, headers, DTO aliases, raw payload containment.
4. Interaction correctness: image rect, overlay, pointer drag, fallback center.
5. Error states: loading/error/empty/pending/failed are visible and retryable.
6. Security/privacy: consent, storage, redaction, no secrets.
7. Performance: bundle, fonts/assets, route splitting, image loading.
8. Tests: right layer, meaningful coverage, no brittle waits.

## Boundary Leak Searches

Use `rg` patterns like:

```sh
rg "fetch\\(|axios|localStorage|sessionStorage" src/view src/api/controller
rg "voteId|questionId|locationX|locationY|image_proxy|imageProxy" src/view src/api/controller
rg "console\\.|event-users|phone|privacy|AWS|accessKey|secret" src
```

## Refactor Rules

- Keep edits scoped to the requested area.
- Preserve user-facing behavior unless the task asks for a behavior change.
- Move logic to the owning layer instead of duplicating workaround code.
- Add tests before or with risky refactors.
- Avoid broad style churn while behavior is being fixed.
- Do not revert unrelated user changes.

## Review Output

- Lead with findings ordered by severity.
- Include file/line references when code exists.
- Include open questions only when they block correctness.
- Keep summary secondary to findings.
