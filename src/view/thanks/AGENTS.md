# view/thanks Agent Guide

`view/thanks`는 `/e/:eventId/thanks` 리워드 연락처 선택 입력 화면을 담당한다.

## Responsibilities

- 이름, 전화번호, 개인정보 동의 checkbox, 제출, 건너뛰기 흐름을 렌더링한다.
- `useRewardController`로 form state와 validation을 받는다.
- 건너뛰기는 개인정보 API 호출 없이 `/e/:eventId/final`로 이동한다.
- 제출 성공 시 final route로 이동한다.

## Guardrails

- 개인정보 입력은 태그 등록의 전제 조건이 아니다.
- 이름/전화번호를 browser storage에 저장하지 않는다.
- 동의 전에는 submit API를 호출하지 않는다.
