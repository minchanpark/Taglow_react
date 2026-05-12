# test/e2e Agent Guide

`test/e2e`는 Playwright 기반 브라우저 flow 테스트를 둔다.

## Responsibilities

- `/e/11 -> /e/11/posts/31 -> tag -> thanks -> final` core flow를 검증한다.
- 상세 이미지가 실제로 보이는지 `<img>.complete`, natural size, screenshot pixel check로 확인한다.
- drag/drop, default center fallback, save failure retry, image failure fallback을 검증한다.
- 모바일 viewport와 desktop mobile-frame viewport를 모두 확인한다.

## Guardrails

- 테스트는 route path와 same-origin 정책을 문서 기준으로 유지한다.
- 불안정한 timeout 대신 UI state와 network response를 기다린다.
