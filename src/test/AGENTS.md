# test Agent Guide

`src/test`는 unit, component, e2e 테스트 자산을 둔다.

## Responsibilities

- domain/API boundary는 unit test로 빠르게 검증한다.
- View state와 user event는 component test로 검증한다.
- QR 진입부터 final까지 core flow는 Playwright e2e로 검증한다.

## Guardrails

- 서버 의존 테스트는 MSW나 Mock Service로 격리한다.
- 실제 개인정보를 fixture에 넣지 않는다.
- 실패/재시도/image fallback 같은 현장 리스크를 happy path보다 늦게 미루지 않는다.
