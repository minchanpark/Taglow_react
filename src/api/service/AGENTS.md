# api/service Agent Guide

`src/api/service`는 Controller가 사용하는 stable domain API와 서버/Mock 구현을 둔다.

## Responsibilities

- `ParticipantService` interface를 모든 controller의 API 계약으로 유지한다.
- `OpenApiParticipantService`는 gateway 호출과 mapper 변환을 조합한다.
- `MockParticipantService`는 같은 interface로 서버 없이 UX와 테스트를 제공한다.
- `TaggingEngineService`는 pending draft, local overlay, failure recovery, default center fallback을 담당한다.
- `participantServiceProvider`는 환경변수 기반으로 Mock/OpenAPI 구현을 선택한다.

## Guardrails

- public method는 domain type을 받거나 반환한다.
- raw payload와 generated client type은 service public API 밖으로 새지 않게 한다.
- 개인정보 제출 body는 logging하지 않는다.
- View를 import하지 않는다.
