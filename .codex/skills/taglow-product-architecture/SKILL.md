---
name: taglow-product-architecture
description: "Taglow React PRD/TDD 기반 제품 범위, MVP 단계, 라우팅, Firebase same-origin 전략, MVC 확장 아키텍처를 정리하고 의사결정한다. Use when planning features, deciding scope, updating project structure, reconciling PRD/TDD/AGENTS.md, or checking whether a requested change belongs in MVP."
---

# Taglow Product Architecture

## Overview

Taglow React 작업을 시작하기 전에 제품 불변 조건과 기술 경계를 맞춘다. 구현이 아니라 방향, 범위, 단계, 구조를 결정하는 스킬이다.

## Required Reading

- Read `AGENTS.md` first.
- Read the nearest `AGENTS.md` under the target directory.
- Use `rg -n "keyword" dev/Taglow_React_PRD.md dev/Taglow_React_TDD.md` to load only the relevant sections.
- For phase planning, read TDD `Migration 단계` and PRD `React 이관 MVP 범위`.

## Workflow

1. Classify the request: product scope, architecture, migration phase, routing/deploy, or layer ownership.
2. Confirm MVP invariants:
   - participant-only mobile web
   - `/e/:eventId`, `/e/:eventId/posts/:votePostId`, `/thanks`, `/final`
   - `eventId` maps to backend `voteId`
   - `votePostId` maps to backend `questionId`
   - tag creation starts from the bottom SOI input bar
   - coordinates are image rendered-bounds ratios
   - reward PII is optional and separated from tags
3. Map the work to a TDD phase:
   - Phase 0 scaffold
   - Phase 1 domain/API boundary
   - Phase 2 home
   - Phase 3 detail image
   - Phase 4 text tagging
   - Phase 5 thanks/final
   - Phase 6 deploy comparison
4. Decide the owning directory and layer before editing.
5. State any non-MVP request as deferred unless the user explicitly asks to expand scope.

## Architecture Rules

- Keep the dependency direction: `view -> api/controller -> api/service -> gateway/mapper -> api/model/utils/browser/server`.
- Keep View free of `fetch`, localStorage, raw DTOs, and generated clients.
- Keep server endpoint/header/path-id interpretation inside gateway.
- Keep raw payload field alias normalization inside mapper.
- Keep state split: TanStack Query for server state, Zustand for interaction state.

## Output Shape

- For planning: provide phases, owning directories, risks, and acceptance checks.
- For structure updates: edit `AGENTS.md` only when the rule should guide future agents.
- For scope conflict: name the PRD/TDD rule and propose the smallest compliant path.
