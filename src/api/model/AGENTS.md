# api/model Agent Guide

`src/api/model`은 View와 Controller가 사용하는 앱 내부 domain type의 기준점이다.

## Responsibilities

- `ParticipantEvent`, `VotePost`, `ParticipantTag`, `TagCoordinate`, `TagType`, `TagMedia`, `CreateTagRequest`, `FinalEntry`를 둔다.
- helper는 순수 함수로 작성하고, 가능하면 unit test를 둔다.
- coordinate 생성 함수는 ratio를 항상 `0.0..1.0`으로 clamp한다.

## Guardrails

- 서버 DTO 이름을 그대로 노출하지 않는다.
- `fetch`, localStorage, React hook, browser DOM API를 import하지 않는다.
- model은 service 구현이나 View layout을 알면 안 된다.
