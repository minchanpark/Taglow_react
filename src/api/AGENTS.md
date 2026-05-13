# api Agent Guide

`src/api`는 앱 내부 domain model, React Query hook, API controller, 서버 API 적응 계층을 포함한다.

## Responsibilities

- View가 안정적인 query hook 계약만 보도록 API 복잡도를 숨긴다.
- 서버 endpoint/header/path id/DTO 변화는 controller/gateway/mapper 경계에서 흡수한다.
- Mock 구현과 OpenAPI 구현이 같은 `ParticipantController` interface를 구현하게 한다.

## Guardrails

- raw payload는 gateway/mapper/controller 경계 밖으로 반환하지 않는다.
- server DTO field alias는 `mapper` 밖에서 해석하지 않는다.
- React component는 `api`에서 import하지 않는다.
