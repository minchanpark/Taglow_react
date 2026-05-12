# Taglow React Agent Guide

이 문서는 Taglow React 참여자용 서비스에서 모든 에이전트가 먼저 읽어야 하는 루트 지침이다. 세부 제품/기술 기준은 `dev/Taglow_React_PRD.md`와 `dev/Taglow_React_TDD.md`를 우선한다.

## Product Invariants

- MVP 범위는 참여자용 모바일 웹이다. 관리자, 대시보드, 외부 디스플레이, AI 분석, 로그인은 제외한다.
- 운영 진입 route는 `/e/:eventId`이고, 상세 route는 `/e/:eventId/posts/:votePostId`이다.
- route의 `eventId`는 서버 API에서는 `voteId`로 해석한다.
- route의 `votePostId`는 서버 API에서는 `questionId`로 해석한다.
- 태그 생성은 이미지 탭이 아니라 하단 SOI 태그 입력바에서만 시작한다.
- 태그 좌표는 항상 이미지 rendered bounds 기준 `0.0..1.0` ratio로 저장한다.
- 참여자는 로그인 없이 태그를 남길 수 있어야 한다.
- 리워드 개인정보 입력은 태그 제출 이후의 선택 흐름이며, 태그 데이터와 분리한다.
- React 구현은 DOM `<img>`를 기본 이미지 렌더링 경로로 사용한다.
- Mock Service와 OpenAPI Service는 같은 `ParticipantService` 계약으로 교체 가능해야 한다.

## Architecture

의존성 방향은 아래 흐름을 유지한다.

```text
view
  -> api/controller
  -> api/service
  -> api/service/gateway + api/service/mapper
  -> api/model + utils + browser API wrapper + server API
```

금지 규칙:

- View에서 `fetch`, `axios`, generated API client, localStorage를 직접 사용하지 않는다.
- View와 Controller는 서버 DTO field name을 알면 안 된다.
- Service는 React component를 import하지 않는다.
- Gateway 밖에서는 endpoint, header, path id 해석 정책을 다루지 않는다.
- Mapper 밖에서는 raw payload field alias를 정규화하지 않는다.
- 개인정보 body를 console/debug/error log에 남기지 않는다.

## Project Structure

```text
src/
├── main.tsx
├── app/
├── api/
│   ├── model/
│   ├── service/
│   │   ├── gateway/
│   │   └── mapper/
│   └── controller/
│       └── stores/
├── view/
│   ├── home/
│   │   └── widgets/
│   ├── detail/
│   │   └── widgets/
│   ├── thanks/
│   └── final/
├── utils/
├── theme/
├── assets/
│   ├── logo/
│   ├── sticker/
│   └── icon/
└── test/
    ├── unit/
    ├── component/
    └── e2e/
```

## Agent Skill Map

이 섹션의 "스킬"은 설치형 Codex skill이 아니라, 이 프로젝트에서 작업을 나누는 역할 기준이다.

- Product skill: PRD의 사용자 플로우, 개인정보 정책, MVP/비MVP 범위를 확인한다.
- Architecture skill: TDD의 MVC 확장 구조와 의존성 방향을 지킨다.
- API boundary skill: `ParticipantService`, gateway, mapper의 경계를 유지한다.
- Interaction skill: 이미지 bounds, ratio 좌표, pointer drag, 하단 입력바 흐름을 검증한다.
- UI skill: 모바일 360-430px, desktop 430-520px 중심 프레임, 텍스트 overflow, safe area를 확인한다.
- QA skill: Vitest, React Testing Library, Playwright 기준으로 mapper/gateway/core flow를 검증한다.
- Deployment skill: Firebase Hosting same-origin, `/e/**` React, `/flutter/**` 비교 정책을 유지한다.

## Implementation Defaults

- React + TypeScript + Vite를 기본으로 한다.
- Server state는 TanStack Query, client interaction state는 Zustand를 기본으로 한다.
- Styling은 CSS Modules 또는 plain CSS + `src/theme` token을 우선한다.
- body 없는 GET에는 `Content-Type`을 붙이지 않는다.
- JSON body가 있는 POST/PATCH에만 `Content-Type: application/json`을 사용한다.
- session header는 `taglow-Session-Id`를 사용한다.
- localStorage에는 `taglow.participant.sessionId.v1` session id만 저장한다.
- 사진/영상 태그와 S3 upload SDK는 React 첫 MVP bundle에 넣지 않는다.

## Testing Expectations

- domain/model helper와 utils는 unit test를 둔다.
- mapper는 field alias, image URL 우선순위, `imageRatio: 7353 -> 0.7353`, 좌표 clamp, ownership 판단을 검증한다.
- gateway는 endpoint, session header, bodyless GET header 정책을 검증한다.
- View는 loading/error/empty/success 상태를 component test로 확인한다.
- Playwright core flow는 `/e/11 -> /e/11/posts/31 -> tag -> thanks -> final`을 포함한다.
