# api/controller Agent Guide

`src/api/controller`는 React custom hook과 store action을 조합해 View에 화면 상태와 이벤트 handler를 제공한다.

## Responsibilities

- `useItemListController`, `useTaggingDetailController`, `useTagDraftController`, `useRewardController`, route helper를 둔다.
- TanStack Query로 server state loading/error/refetch를 관리한다.
- Zustand store로 draft, staged tag, overlay, reward form 같은 UI interaction state를 관리한다.
- View에는 domain model, derived state, callback만 반환한다.

## Guardrails

- `fetch`, generated client, raw payload를 직접 사용하지 않는다.
- localStorage는 `utils` wrapper 또는 session store를 통해서만 접근한다.
- Controller가 JSX를 반환하지 않는다.
- API error는 사용자에게 보여줄 수 있는 message와 retry action으로 정리한다.
