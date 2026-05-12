# utils Agent Guide

`src/utils`는 레이어 독립적인 순수 함수와 browser API wrapper를 둔다.

## Responsibilities

- coordinate conversion, contained image rect, input validation, responsive helpers, local session storage wrapper를 관리한다.
- browser storage access는 실패해도 앱 참여를 막지 않게 safe wrapper로 작성한다.
- localStorage에는 session id만 저장한다.

## Guardrails

- utils에서 React component나 service 구현을 import하지 않는다.
- 개인정보를 storage나 log에 남기지 않는다.
- DOM 의존 helper는 입력/출력을 명확히 하고 unit test 가능한 core 계산을 분리한다.
