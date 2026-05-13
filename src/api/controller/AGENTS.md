# api/controller Agent Guide

`src/api/controller`는 gateway와 mapper를 조합하는 domain API facade와 client interaction store를 둔다.

## Responsibilities

- `ParticipantController` interface를 query hook이 사용하는 안정적인 domain API 계약으로 유지한다.
- `GatewayParticipantController`는 gateway 호출과 mapper 변환을 조합한다.
- provider는 gateway/mapper/controller singleton과 session store를 조립한다.

## Guardrails

- `fetch`나 generated client를 직접 사용하지 않는다.
- gateway가 반환한 raw payload는 mapper로만 전달하고 field를 직접 해석하지 않는다.
- localStorage는 `utils` wrapper 또는 session store를 통해서만 접근한다.
- Controller가 React hook이나 JSX를 반환하지 않는다.
- endpoint/header/path id 정책은 gateway로, raw field alias 정규화는 mapper로 보낸다.
