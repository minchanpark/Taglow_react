# view/home/widgets Agent Guide

`home/widgets`는 홈 화면 안에서 재사용되는 작은 UI 조각을 둔다.

## Responsibilities

- `ItemCard` 같은 항목 표시 component를 관리한다.
- props는 domain model 또는 View 전용 primitive로 제한한다.
- press/hover/focus state와 텍스트 overflow를 다룬다.

## Guardrails

- routing, API, storage 접근을 widget에 넣지 않는다.
- 카드 내부에서 eventId/questionId 변환 정책을 처리하지 않는다.
