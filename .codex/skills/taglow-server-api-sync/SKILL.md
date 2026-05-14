---
name: taglow-server-api-sync
description: "Sync Taglow React participant API adapters with the live server/OpenAPI at https://vote.newdawnsoi.site. Use when the backend contract changes, Swagger/OpenAPI is updated, endpoints, headers, request bodies, response fields, VITE_TAGLOW_API_BASE_URL, or server payloads require frontend API gateway/mapper/controller/test updates."
---

# Taglow Server API Sync

## Overview

Use this skill when the Taglow server contract changes and the React participant app must be realigned. Keep server volatility inside the API boundary: gateway for transport/path/header/id policy, mapper for DTO aliases and payload conversion, controller for domain orchestration.

## Required Reading

- Root `AGENTS.md`
- `.codex/skills/AGENTS.md`
- `src/api/AGENTS.md`
- Relevant child guides under `src/api/controller`, `src/api/service/gateway`, `src/api/service/mapper`, and `src/api/model`
- `dev/Taglow_React_TDD.md` sections for API adapter, service, mapper, and gateway endpoint mapping
- Also use `$taglow-api-boundary` whenever editing gateway, mapper, controller, request payloads, server DTO aliases, session headers, tags, questions, events, or reward submission.

## Server Sources

- Default server base URL: `https://vote.newdawnsoi.site`
- Frontend override: `VITE_TAGLOW_API_BASE_URL`
- OpenAPI JSON: `https://vote.newdawnsoi.site/v3/api-docs`
- Swagger UI: `https://vote.newdawnsoi.site/swagger-ui/index.html`

Treat the live OpenAPI spec as the current source of truth. Use live GET requests for inspection, but ask the user before sending live POST/PATCH/DELETE requests because they can create externally visible server data.

Store temporary server artifacts under `/tmp` unless the user asks to commit generated docs.

## Workflow

1. Establish the target server.
   - Check `.env.example`, `src/api/controller/participantAPIProvider.ts`, and any deployment config for `VITE_TAGLOW_API_BASE_URL`.
   - Prefer the environment value when it exists; otherwise use `https://vote.newdawnsoi.site`.

2. Inspect the current server contract.
   - Fetch `/v3/api-docs` and identify changed paths, methods, request bodies, response schemas, required headers, and error shapes.
   - If OpenAPI is unavailable or stale, use safe GET probes and Swagger UI, then infer carefully from observed JSON.

3. Compare server contract to the current API boundary.
   - Gateway files: `src/api/service/gateway/ParticipantApiGateway.ts`, `FetchParticipantApiGateway.ts`
   - Mapper files: `src/api/service/mapper/ParticipantPayloadMapper.ts`
   - Controller files: `src/api/controller/ParticipantAPI.ts`, `GatewayParticipantAPI.ts`, `participantAPIProvider.ts`
   - Tests: `src/test/unit/fetchParticipantApiGateway.test.ts`, `src/test/unit/participantPayloadMapper.test.ts`, `src/test/unit/gatewayParticipantController.test.ts`

4. Implement in boundary order.
   - Change `ParticipantApiGateway` only when frontend capabilities or gateway methods must change.
   - Put endpoint, method, header, query string, path id, and base URL policy in `FetchParticipantApiGateway`.
   - Keep route `eventId` as frontend/domain naming, but translate it to backend `voteId` at the gateway boundary.
   - Keep route `votePostId` as frontend/domain naming, but translate it to backend `questionId` at the gateway boundary.
   - Put raw response aliases, request body conversion, enum normalization, image URL priority, `imageRatio` normalization, coordinate parsing, and ownership derivation in `ParticipantPayloadMapper`.
   - Keep `GatewayParticipantAPI` focused on orchestrating gateway + mapper into the stable `ParticipantAPI` domain contract.

5. Update tests before trusting the UI.
   - Gateway tests should assert paths, methods, headers, bodyless GET behavior, JSON POST `Content-Type`, session header usage, and id translation.
   - Mapper tests should assert new field aliases, request payloads, response shapes, image URL priority, `imageRatio: 7353 -> 0.7353`, coordinate clamp, tag ownership, and fallback behavior.
   - Controller tests should assert domain orchestration when gateway/mapper contracts change.
   - Do not make tests depend on the live server; mock `fetch` or gateway interfaces.

6. Check for boundary leaks.
   - View/query code must not know server DTO names, backend ids, endpoint paths, generated clients, `fetch`, `axios`, or raw payload shapes.
   - Search after edits:

```bash
rg "fetch\\(|axios|questionId|voteId|raw|payload|Content-Type|taglow-Session-Id" src/view src/api/query src/api/controller
```

## Probe Commands

Use these as starting points; adjust for the user's requested server if different.

```bash
API_BASE="${VITE_TAGLOW_API_BASE_URL:-https://vote.newdawnsoi.site}"
curl -fsS "$API_BASE/v3/api-docs" > /tmp/taglow-openapi.json
node -e "const spec=JSON.parse(require('fs').readFileSync('/tmp/taglow-openapi.json','utf8')); console.log(Object.keys(spec.paths || {}).sort().join('\n'))"
node -e "const spec=JSON.parse(require('fs').readFileSync('/tmp/taglow-openapi.json','utf8')); for (const [p, ops] of Object.entries(spec.paths || {})) for (const m of Object.keys(ops)) console.log(m.toUpperCase(), p)"
```

When checking a concrete GET endpoint, keep the request bodyless and do not add `Content-Type`.

## Change Matrix

- Base URL changed: update `.env.example`, provider fallback, deployment docs/config, and gateway tests if they assert absolute URLs.
- Endpoint/path/method/header changed: update `FetchParticipantApiGateway` and gateway tests.
- Request body changed: update `ParticipantPayloadMapper.createTagRequestToPayload` or relevant mapper method, then gateway/controller tests.
- Response field aliases changed: update `ParticipantPayloadMapper` and mapper tests.
- Stable domain concept changed: update `src/api/model` and `ParticipantAPI` only after confirming the UI needs the new concept.
- Reward/contact/PII API changed: also use `$taglow-security-privacy`; never log personal data bodies.
- Loading/routing/UI symptoms appear after API sync: also use `$taglow-debug` or `$taglow-ui-interaction` as appropriate.

## Guardrails

- Do not move endpoint, header, path id, or server field alias logic into View or query hooks.
- Do not add `Content-Type` to bodyless GET requests.
- Add `Content-Type: application/json` only for JSON body POST/PATCH.
- Use `taglow-Session-Id` for participant session operations where the server requires it.
- Keep `localStorage` access inside the session/browser wrapper, not View or gateway code.
- Do not introduce generated API clients into the first MVP bundle unless the user explicitly asks and the architecture is updated.
- Do not fix CORS by adding client-side hacks; verify origin/deploy expectations instead.
- Do not commit full OpenAPI snapshots or raw server payload captures unless the user asks.

## Verification

Run focused checks first:

```bash
pnpm test:run src/test/unit/fetchParticipantApiGateway.test.ts src/test/unit/participantPayloadMapper.test.ts src/test/unit/gatewayParticipantController.test.ts
pnpm typecheck
```

Run `pnpm build` when the change affects shared types, env config, deployment behavior, or production readiness. For manual smoke, use the local app with the intended `VITE_TAGLOW_API_BASE_URL`, then verify `/e/:eventId` and `/e/:eventId/posts/:votePostId` without creating live POST data unless approved.

## Done Criteria

- The current server contract is reflected in gateway and mapper code.
- Existing domain names remain stable for controllers, query hooks, and views.
- The real-server implementation satisfies the stable `ParticipantAPI` contract.
- Gateway and mapper tests cover each server contract change.
- Boundary leak search is clean or each remaining match is intentional and explained.
