# test/unit Agent Guide

`test/unit`은 Vitest 기반 순수 로직 테스트를 둔다.

## Responsibilities

- `coordinateConverter`, `imageBounds`, `inputValidator`, `localSessionStore`를 검증한다.
- mapper field alias, image URL priority, image ratio normalization, coordinate clamp, ownership 판단을 검증한다.
- gateway endpoint/header/bodyless GET 정책을 검증한다.

## Guardrails

- unit test가 DOM layout이나 network에 과하게 의존하지 않게 한다.
- 개인정보 body는 snapshot에 남기지 않는다.
