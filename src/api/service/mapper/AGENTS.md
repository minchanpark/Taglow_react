# api/service/mapper Agent Guide

`mapper`는 raw payload와 앱 내부 domain model 사이의 유일한 변환 지점이다.

## Responsibilities

- id, title, description, questions/posts, image URL, image ratio, coordinate, ownership field alias를 정규화한다.
- `imageProxyUrl` 계열을 원본 `imageUrl`보다 우선한다.
- 서버 `imageRatio: 7353`은 domain `0.7353`으로 변환한다.
- `locationX/locationY`, `xRatio/yRatio`, nested `coordinate`를 `TagCoordinate`로 변환한다.
- `CreateTagRequest`와 `FinalEntry`를 서버 body payload로 변환한다.

## Guardrails

- mapper는 fetch를 호출하지 않는다.
- View 또는 controller 친화적 임시 필드를 raw payload에 기대지 않는다.
- 좌표는 항상 clamp한다.
- 개인정보 body 변환은 가능하지만 저장하거나 logging하지 않는다.
