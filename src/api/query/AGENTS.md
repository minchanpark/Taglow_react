# api/query Agent Guide

`src/api/query`는 TanStack Query 기반 React hook을 둔다.

## Responsibilities

- `useItemListQuery`, `useTaggingDetailQuery`, reward/final query hook, query key를 둔다.
- server state loading/error/refetch/cache update를 관리한다.
- `ParticipantController`와 session store를 조합해 View 친화 상태와 callback을 반환한다.

## Guardrails

- `fetch`, generated client, raw payload를 직접 사용하지 않는다.
- endpoint/header/path id 정책을 다루지 않는다.
- server DTO field alias를 해석하지 않는다.
- JSX를 반환하지 않는다.
