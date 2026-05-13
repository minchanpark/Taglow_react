# view/detail Agent Guide

`view/detail`은 `/e/:eventId/posts/:votePostId` 태깅 상세 화면을 담당한다.

## Responsibilities

- 질문 이미지, 상단 bar, 완료 버튼, 오류 배너, 하단 SOI 입력바, 태그 overlay를 조합한다.
- `useTaggingDetailQuery`와 필요한 interaction store/hook을 사용한다.
- 완료 버튼은 pending draft가 있으면 기본 좌표 저장 fallback을 시도한 뒤 thanks route로 이동한다.
- 이미지 load/error와 태그 저장 success/failure 상태를 사용자에게 보여준다.

## Guardrails

- 새 태그 생성은 하단 입력바에서만 시작한다.
- 저장 실패 시 pending marker와 draft를 숨기지 않는다.
- image bounds 계산은 widget/utils로 위임하고 임의 pixel 좌표를 저장하지 않는다.
