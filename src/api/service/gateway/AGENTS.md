# api/service/gateway Agent Guide

`gateway`는 서버 API transport와 endpoint 정책을 흡수하는 낮은 단계 adapter이다.

## Responsibilities

- `ParticipantApiGateway` interface와 `FetchParticipantApiGateway` 구현을 둔다.
- `eventId` route param을 backend `voteId` path로 사용한다.
- `votePostId` route param을 backend `questionId` path로 사용한다.
- `GET /api/public/votes/{voteId}/display`, `GET /api/public/votes/{voteId}/questions`, tag create/update/delete, reward submit endpoint를 관리한다.
- `taglow-Session-Id` header를 필요한 요청에만 붙인다.
- body 없는 GET에는 `Content-Type`을 붙이지 않는다.

## Guardrails

- gateway는 raw `Record<string, unknown>` 계열 payload를 반환하고 domain model을 만들지 않는다.
- field alias normalization은 mapper에 맡긴다.
- `/api/public/event-users` body는 debug log에 남기지 않는다.
