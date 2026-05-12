# test/component Agent Guide

`test/component`는 React Testing Library와 MSW 기반 component test를 둔다.

## Responsibilities

- `ParticipantHomePage` loading/error/empty/list 상태를 검증한다.
- `TaggingImageArea` image load/error fallback을 검증한다.
- `BottomTagInputBar` input/staged/cancel 흐름을 검증한다.
- `ThanksPage` consent submit과 skip flow를 검증한다.

## Guardrails

- component test에서 실제 서버 API를 호출하지 않는다.
- View가 controller/service boundary를 우회하도록 mock하지 않는다.
