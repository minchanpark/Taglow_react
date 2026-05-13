# api/service Agent Guide

`src/api/service`는 gateway/mapper 같은 낮은 단계 서버 API adapter를 둔다. Domain API facade는 `src/api/controller`에 둔다.

## Responsibilities

- `gateway/`는 endpoint, header, path id, fetch/generated client transport 정책을 흡수한다.
- `mapper/`는 raw payload field alias와 domain model 변환을 흡수한다.
- server API 변경이 query hook이나 View로 새지 않게 adapter 경계를 유지한다.

## Guardrails

- domain API orchestration을 이 폴더에 새로 만들지 않는다. `src/api/controller`에 둔다.
- raw payload와 generated client type은 gateway/mapper/controller 경계 밖으로 새지 않게 한다.
- 개인정보 제출 body는 logging하지 않는다.
- View를 import하지 않는다.
