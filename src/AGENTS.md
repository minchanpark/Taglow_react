# src Agent Guide

`src`는 React 참여자용 앱의 전체 소스 루트이다. 이 아래의 코드는 PRD/TDD의 MVP 범위와 MVC 확장 의존성 방향을 유지해야 한다.

## Responsibilities

- route, controller, service, view, utils, theme, assets, tests를 명확히 분리한다.
- `eventId`는 프론트 route/domain 이름으로 유지하되 API 경계에서는 `voteId`로 해석한다.
- `votePostId`는 프론트 route/domain 이름으로 유지하되 API 경계에서는 `questionId`로 해석한다.
- 이미지 좌표는 pixel이 아니라 `TagCoordinate` ratio로만 저장한다.

## Guardrails

- 새 파일을 만들 때 먼저 어느 레이어의 책임인지 정한다.
- 레이어 경계를 흐리는 shared helper를 만들기 전에 기존 `api`, `utils`, `theme` 위치가 맞는지 확인한다.
- View에서 server DTO, browser storage, transport detail을 직접 import하지 않는다.
