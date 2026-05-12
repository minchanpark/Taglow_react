# api/controller/stores Agent Guide

`stores`는 Zustand 기반 client interaction state를 둔다.

## Responsibilities

- tag draft, tagging overlay, reward form 등 서버 cache가 아닌 UI 상태를 관리한다.
- action 이름은 사용자 의도 기준으로 짓는다. 예: `markTextStaged`, `clearPendingDraft`, `updateConsent`.
- store snapshot은 controller에서 View 친화 상태로 조합한다.

## Guardrails

- store action에서 server API를 직접 호출하지 않는다.
- 개인정보인 이름/전화번호를 persistent storage에 저장하지 않는다.
- 서버 데이터 원본 cache를 Zustand에 중복 저장하기 전에 React Query 책임인지 확인한다.
