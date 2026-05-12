---
name: taglow-security-privacy
description: "Review and harden Taglow React security and privacy: reward PII separation, consent gating, localStorage/session policy, log redaction, API headers, CORS/origin assumptions, S3/media secrets, dependency exposure, and safe error diagnostics. Use before release, when touching thanks/contact, storage, logging, API gateway, media upload, deployment, or security-sensitive code."
---

# Taglow Security Privacy

## Overview

Protect participant privacy and avoid client-side secret or logging mistakes. This MVP is anonymous by default; reward contact details are optional and isolated.

## Required Reading

- PRD `개인정보 및 보안 요구사항`
- TDD `Fetch policy`, `Firebase Hosting 설계`, `리스크 및 대응`
- Root `AGENTS.md`
- `src/api/service/gateway/AGENTS.md`
- `src/view/thanks/AGENTS.md`
- `src/utils/AGENTS.md`

## Privacy Rules

- Do not require PII before tag submission.
- Collect reward PII only on `/e/:eventId/thanks`.
- Do not call `submitFinalEntry` before explicit consent.
- Do not store name or phone in localStorage, sessionStorage, query cache persistence, URL params, or logs.
- localStorage may contain only `taglow.participant.sessionId.v1`.
- Treat session id as non-sensitive but do not join it with PII in client analytics.

## API And Logging Rules

- Do not log `/api/public/event-users` body.
- Redact PII from thrown errors, console logs, analytics, snapshots, and test fixtures.
- Do not put AWS access keys or S3 credentials in client code or env.
- Do not add `Content-Type` to bodyless GET.
- Add CORS notes by origin, not path.
- Keep diagnostics useful without PII: status, operation name, redacted endpoint, image load state.

## Review Checklist

1. Search for unsafe storage/logs: `rg "localStorage|sessionStorage|console\\.|analytics|phone|name|event-users|AWS|S3|secret|token|accessKey"`.
2. Inspect thanks/controller/service flow for consent gate.
3. Inspect gateway request construction and redaction.
4. Inspect tests/fixtures for real PII.
5. Report risks by severity with file references and concrete fixes.
