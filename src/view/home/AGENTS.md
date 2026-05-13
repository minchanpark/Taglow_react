# view/home Agent Guide

`view/home`은 `/e/:eventId` 항목 선택 화면을 담당한다.

## Responsibilities

- 이벤트/투표 제목, 설명, 항목 카드 목록, loading/error/empty 상태를 렌더링한다.
- `useItemListQuery`를 통해 event와 `VotePost[]`를 받는다.
- 항목 클릭 시 `/e/:eventId/posts/:votePostId`로 이동한다.

## Guardrails

- 홈 화면에서 API를 직접 호출하지 않는다.
- 카드 전체를 터치 영역으로 유지하고 최소 44px 이상의 hit target을 확보한다.
- 항목이 없어도 앱이 깨지지 않게 빈 상태를 제공한다.
