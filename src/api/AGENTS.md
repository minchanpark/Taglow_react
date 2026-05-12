# api Agent Guide

`src/api`는 앱 내부 domain model, 서버 API 적응 계층, controller hook/store를 포함한다.

## Responsibilities

- View가 안정적인 controller 계약만 보도록 API 복잡도를 숨긴다.
- 서버 endpoint/header/path id/DTO 변화는 service/gateway/mapper 경계에서 흡수한다.
- Mock Service와 OpenAPI Service가 같은 `ParticipantService` interface를 구현하게 한다.

## Guardrails

- raw payload는 `service` 경계 밖으로 반환하지 않는다.
- server DTO field alias는 `mapper` 밖에서 해석하지 않는다.
- React component는 `api`에서 import하지 않는다.
