# view/final Agent Guide

`view/final`은 `/e/:eventId/final` 완료 화면을 담당한다.

## Responsibilities

- API 없이도 정적 완료 메시지를 렌더링한다.
- 처음으로 돌아가기 버튼은 `/e/:eventId`로 이동한다.
- 참여 완료 상태를 명확히 보여준다.

## Guardrails

- final 화면에서 추가 개인정보나 태그 입력을 요구하지 않는다.
- route param이 없거나 잘못되어도 앱 전체 crash로 이어지지 않게 한다.
