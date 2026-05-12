# assets/sticker Agent Guide

`assets/sticker`는 태그 sticker visual에 필요한 asset을 둔다.

## Responsibilities

- text tag sticker의 state별 visual에 필요한 asset을 관리한다.
- stickerSeed로 변형을 줄 경우 deterministic하게 재현 가능한 asset 이름을 사용한다.

## Guardrails

- sticker asset은 pointer/touch interaction을 방해하지 않도록 투명 영역과 크기를 확인한다.
- MVP에서는 사진/영상 sticker asset을 과하게 추가하지 않는다.
