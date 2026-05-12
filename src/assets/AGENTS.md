# assets Agent Guide

`src/assets`는 앱 bundle에 포함되는 정적 asset을 둔다.

## Responsibilities

- logo, sticker, icon asset을 용도별 하위 디렉토리에 보관한다.
- 초기 route에 필요한 asset은 작고 최적화된 형식으로 유지한다.
- 비핵심 media는 lazy loading 또는 public CDN 정책을 검토한다.

## Guardrails

- 사진/영상 tag upload SDK나 대형 media를 MVP 초기 bundle에 넣지 않는다.
- 개인정보가 포함된 sample asset을 커밋하지 않는다.
- asset 이름은 용도와 상태를 알 수 있게 짓는다.
