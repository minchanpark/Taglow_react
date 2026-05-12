# view/detail/widgets Agent Guide

`detail/widgets`는 이미지 태깅 경험의 핵심 UI 조각을 둔다.

## Responsibilities

- `TaggingImageArea`는 `<img>` load/error, natural ratio, rendered image rect, drop coordinate 변환을 관리한다.
- `ParticipantTagOverlay`는 ratio 좌표를 pixel 위치로 변환해 태그와 pending marker를 표시한다.
- `BottomTagInputBar`는 text input, submit, staged tray, cancel 흐름을 관리한다.
- `TagSticker`는 sticker visual, active/pending/failed 상태, pointer interaction affordance를 표현한다.
- `tagDropGeometry` 같은 helper는 image rect 기준 변환을 순수 함수로 둔다.

## Guardrails

- overlay와 drop target은 반드시 같은 image rect를 기준으로 한다.
- pointer drop이 이미지 밖에서 끝나면 clamp하거나 `(0.5, 0.5)` fallback을 사용한다.
- sticker drag에는 `touch-action: none`을 적용해 모바일 스크롤 충돌을 줄인다.
- widget은 API 저장을 직접 호출하지 않고 callback으로 controller에 위임한다.
