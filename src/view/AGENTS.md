# view Agent Guide

`src/view`는 사용자에게 보이는 page와 component를 둔다.

## Responsibilities

- View는 `src/api/query` hook을 호출하고 화면 상태를 렌더링한다.
- 모바일 우선으로 360-430px 폭을 검증하고, desktop에서는 430-520px 중심 프레임을 유지한다.
- loading, error, empty, success, failed/pending 상태를 숨기지 않는다.
- 이미지 상세 화면은 DOM `<img>`와 overlay가 같은 rendered bounds를 공유하게 한다.

## Guardrails

- View에서 `fetch`, localStorage, raw DTO, generated client를 직접 사용하지 않는다.
- 이미지 탭을 새 태그 생성 trigger로 만들지 않는다.
- 텍스트가 작은 화면에서 넘치지 않도록 줄바꿈, ellipsis, stable size를 확인한다.
- 개인정보 입력은 thanks 흐름에만 둔다.
