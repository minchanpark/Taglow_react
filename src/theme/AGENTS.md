# theme Agent Guide

`src/theme`은 디자인 token과 전역 CSS를 둔다.

## Responsibilities

- colors, spacing, radius, typography, global CSS variables를 관리한다.
- 하단 입력바의 검은 pill, 노란 border/glow, Taglow sticker visual 기준을 token으로 재사용 가능하게 한다.
- 모바일 frame, safe area, focus style, typography fallback을 제공한다.

## Guardrails

- feature-specific layout을 theme에 넣지 않는다.
- 큰 font asset을 무심코 bundle에 추가하지 않는다.
- 한 화면이 단일 색상 계열로만 보이지 않도록 token 사용을 점검한다.
