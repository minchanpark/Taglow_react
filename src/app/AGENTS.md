# app Agent Guide

`src/app`은 앱 shell, routing, provider composition, query client 같은 전역 조립 코드를 둔다.

## Responsibilities

- `App.tsx`, `router.tsx`, `providers.tsx`, `queryClient.ts`를 관리한다.
- `/e/:eventId`, `/e/:eventId/posts/:votePostId`, `/e/:eventId/thanks`, `/e/:eventId/final` route를 구성한다.
- API controller singleton과 Query/Zustand provider 연결은 이 레이어 또는 controller 진입점에서 조립한다.
- 직접 접근한 thanks/final route가 API 없이도 깨지지 않게 한다.

## Guardrails

- feature business logic을 app shell에 넣지 않는다.
- page component 내부 상태를 app 전역 상태로 끌어올리기 전에 query/controller/store 책임인지 확인한다.
- Firebase Hosting path 정책은 루트 문서와 TDD를 따른다.
