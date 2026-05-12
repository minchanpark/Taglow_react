---
name: taglow-api-boundary
description: "Implement, debug, or review Taglow API/domain boundaries: api/model, ParticipantService, MockParticipantService, OpenApiParticipantService, ParticipantApiGateway, FetchParticipantApiGateway, ParticipantPayloadMapper, session headers, endpoint mapping, and DTO alias normalization. Use whenever server payloads, requests, tags, events, questions, or reward submission are involved."
---

# Taglow API Boundary

## Overview

Keep server API changes from leaking into controllers and views. This skill owns the domain/API adapter contract.

## Required Reading

- Root `AGENTS.md`
- `src/api/AGENTS.md`
- Relevant child `AGENTS.md` under `src/api/model`, `service`, `gateway`, `mapper`, or `controller`
- TDD sections `API 적응 계층`, `Service 설계`, `Payload Mapper`, and `Fetch Gateway endpoint mapping`

## Boundary Contract

```text
server API
-> ParticipantApiGateway
-> raw payload
-> ParticipantPayloadMapper
-> api/model domain type
-> OpenApiParticipantService
-> ParticipantService
-> controller
-> view
```

## Gateway Rules

- Interpret route `eventId` as backend `voteId`.
- Interpret route `votePostId` as backend `questionId`.
- Return raw payloads, not domain models.
- Add `Accept: application/json`.
- Do not add `Content-Type` to bodyless GET requests.
- Add `Content-Type: application/json` only for JSON body POST/PATCH.
- Add `taglow-Session-Id` only where needed for tag/session operations.
- Do not log `/api/public/event-users` request bodies.

## Mapper Rules

- Convert numeric/string ids to domain string ids.
- Prefer `imageProxyUrl`, `image_proxy_url`, `proxiedImageUrl`, `proxied_image_url` before original image fields.
- Normalize server `imageRatio: 7353` to `0.7353`.
- Accept `locationX/locationY`, `xRatio/yRatio`, and nested `coordinate`.
- Clamp all coordinates to `0.0..1.0`.
- Normalize tag type case and aliases.
- Derive `isMine` and `canDelete` from explicit fields or session match.

## Workflow

1. Change `api/model` only for stable app domain concepts.
2. Change `ParticipantService` before implementation if controller needs a new capability.
3. Update Mock and OpenAPI implementations together.
4. Put endpoint/header/path logic in gateway.
5. Put field alias and payload conversion in mapper.
6. Add unit tests for mapper/gateway before relying on UI tests.
7. Search for boundary leaks with `rg "fetch\\(|localStorage|axios|questionId|voteId|raw|payload" src/view src/api/controller`.
