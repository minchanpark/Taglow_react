# Taglow React 참여자용 서비스 PRD v0.1

## 0. 문서 개요

### 0-1. 문서 목적

본 문서는 현재 Flutter Web으로 구현된 **Taglow 참여자용 모바일 웹 MVP**를 React 기반 웹 앱으로 이관하거나 병행 구현하기 위한 제품 요구사항을 정의한다.

이 문서는 기존 [Taglow_PRD.md](Taglow_PRD.md)의 제품 범위를 유지하되, React 구현에서 반드시 보존해야 하는 사용자 경험, 라우팅, 데이터 정책, 성능 목표, 검증 기준을 더 구체화한다.

### 0-2. 작성 배경

현재 Flutter Web 구현은 MVP 기능을 상당 부분 갖추고 있으나, 현장 QR 참여 서비스의 핵심 지표인 **초기 로딩 속도**와 **특정 브라우저 이미지 렌더링 안정성**에서 리스크가 확인되었다.

React 이관 검토 배경:

- Flutter Web은 앱 초기 로딩 시 Flutter runtime, CanvasKit/Skwasm, Dart bundle, 폰트/에셋을 함께 로드해야 한다.
- 특정 브라우저에서는 이미지 네트워크 요청이 200으로 성공해도 CanvasKit 렌더링 경로에서 이미지가 보이지 않는 사례가 있었다.
- Taglow의 핵심 경험은 복잡한 네이티브 앱 UI보다 `QR 진입 -> 이미지 표시 -> 하단 입력 -> 이미지 위 태그 표시`라는 브라우저 친화적 모바일 웹 흐름이다.
- React는 `<img>`, pointer events, CSS layout, browser storage, Playwright 검증 등 웹 기본 기능을 직접 사용하기 쉬워 현장 모바일 웹 MVP에 더 적합할 가능성이 있다.

### 0-3. 문서 범위

포함 범위:

- React 참여자용 앱의 제품 목표와 MVP 범위
- 기존 Flutter 화면/흐름을 React로 옮길 때 유지해야 할 UX 요구사항
- Firebase Hosting에서 기존 origin을 유지하는 배포/비교 정책
- 홈, 상세 태깅, 하단 태그 입력, thanks/contact, final 화면 요구사항
- 텍스트 태그 MVP, 이미지 좌표, optimistic UI, 실패/재시도 정책
- 익명 세션, 리워드 개인정보 분리, CORS/이미지 로딩 운영 요구사항
- 서버 API DTO와 React domain model 사이의 API 적응 계층 요구사항
- React 이관 성공 판단 기준과 QA 시나리오

구현 구조 참고: 현재 React 구현은 Flutter/Riverpod식 service/controller 분리를 줄여
`api/query`의 TanStack Query hook이 화면 상태를 담당하고, `api/controller`의
`ParticipantController`가 gateway/mapper를 조합하는 domain API facade 역할을 한다.
문서의 `ParticipantService`/`OpenApiParticipantService` 표현은 이 구조에서는
`ParticipantController`/`GatewayParticipantController`에 대응한다.

제외 범위:

- 관리자 페이지
- 분석 대시보드
- 외부 디스플레이 실시간 화면
- AI 분석/요약
- 로그인/회원가입
- 결제/멤버십/조직 권한
- 전체 Flutter 코드 제거 계획

### 0-4. 기존 Flutter 구현에서 확인된 제품 불변 조건

React 이관 시에도 아래 조건은 변경하지 않는다.

- 참여자용 서비스만 MVP 범위에 포함한다.
- QR entry는 `/e/{voteId}`이며, `{voteId}`는 백엔드 `voteId`이다.
- 프론트 도메인 모델에서는 현재 Flutter처럼 `eventId`라는 이름을 계속 사용할 수 있으나, 서버 API 호출에서는 `voteId`로 해석한다.
- 항목 상세 route는 `/e/{voteId}/posts/{questionId}`이다.
- 태그 생성은 이미지 탭이 아니라 하단 SOI 태그 입력바에서 시작한다.
- 첫 텍스트 태그는 QR 진입 후 30초 안에 등록 가능해야 한다.
- 태그 저장 전후 좌표는 이미지 기준 `0.0..1.0` ratio로 관리한다.
- 참여자는 로그인/회원가입 없이 태그를 남길 수 있어야 한다.
- 리워드 개인정보 입력은 태그 제출 이후의 선택 흐름이어야 한다.
- 개인정보는 태그 데이터와 논리적으로 분리한다.

---

## 1. 제품 정의

### 1-1. 제품명

**Taglow React 참여자용 서비스**

### 1-2. 한 줄 정의

참여자가 QR로 접속해 이미지 자료를 보고, 하단 SOI 태그 입력바에서 짧은 텍스트 태그를 작성한 뒤 이미지 위에 즉시 남길 수 있는 React 기반 모바일 웹 서비스.

### 1-3. React 이관의 제품 목표

React 구현은 단순 기술 교체가 아니라 현장 참여 경험의 병목을 줄이기 위한 제품 실험이다.

목표:

1. 기존 Flutter MVP의 핵심 사용자 흐름을 React에서 동일하게 제공한다.
2. 초기 로딩 체감 시간을 줄인다.
3. 특정 브라우저 이미지 렌더링 실패 가능성을 줄인다.
4. 같은 Firebase Hosting origin을 사용해 CORS allowlist 변경 없이 비교한다.
5. 브라우저 기본 이미지/드래그/입력/viewport 동작을 활용해 모바일 웹 안정성을 높인다.
6. React 구현이 MVP에 적합한지 실제 route와 API로 비교한다.
7. 서버 API와 프론트 domain model 사이에 gateway/mapper 계층을 두어 API 변경이 View로 전파되지 않게 한다.

### 1-4. 성공 판단

React 이관은 다음 조건을 만족할 때 성공으로 본다.

- `/e/{voteId}` 진입 후 홈 화면이 안정적으로 표시된다.
- 첫 항목 선택 후 `/e/{voteId}/posts/{questionId}` 상세 화면이 열린다.
- 상세 화면의 질문 이미지가 iOS Safari, Android Chrome, desktop Chrome에서 안정적으로 보인다.
- 하단 입력바에서 텍스트 태그를 작성하고 이미지 위에 배치/저장할 수 있다.
- 저장 성공 시 태그가 즉시 이미지 위에 표시된다.
- 저장 실패 시 사용자가 실패 상태를 보고 재시도할 수 있다.
- 태그 완료 후 thanks/contact prompt와 final 화면으로 이동할 수 있다.
- 개인정보 입력 없이도 참여가 완료된다.
- 같은 origin에서 API와 S3 이미지 CORS가 유지된다.

---

## 2. 배포 및 비교 정책

### 2-1. 운영 origin

React 앱은 기존 Firebase Hosting origin을 사용한다.

현재 문서 기준 origin:

```text
https://taglow-acca6.web.app
https://taglow-acca6.firebaseapp.com
```

사용자가 실제로 말한 요구는 "CORS 때문에 도메인을 똑같이 쓰고 싶다"이다. 브라우저 CORS 기준은 전체 URL path가 아니라 origin이므로, 아래 URL들은 모두 같은 origin이다.

```text
https://taglow-acca6.web.app/e/11
https://taglow-acca6.web.app/react/e/11
https://taglow-acca6.web.app/flutter/e/11
```

### 2-2. React/Flutter 비교 route 정책

비교 기간에는 같은 origin 안에서 path를 나눠 운영한다.

권장 비교 구조:

```text
/e/{voteId}
  React 후보 앱

/e/{voteId}/posts/{questionId}
  React 후보 앱 상세

/flutter/e/{voteId}
  Flutter 비교 앱

/flutter/e/{voteId}/posts/{questionId}
  Flutter 비교 앱 상세
```

이 구조의 장점:

- 서버 CORS allowlist는 기존 Firebase origin만 유지하면 된다.
- React가 최종 선택되면 운영 URL `/e/**`를 그대로 사용할 수 있다.
- Flutter 비교 버전은 `/flutter/**` 아래에서 유지할 수 있다.
- 사용자의 QR URL 형식을 최종 제품 기준으로 미리 검증할 수 있다.

### 2-3. 완전히 같은 URL 동시 운영 정책

동일한 `host + path`에 React와 Flutter를 동시에 연결할 수는 없다.

예:

```text
https://taglow-acca6.web.app/e/11/posts/31
```

위 URL은 한 요청에 하나의 응답만 반환하므로 React 또는 Flutter 중 하나만 소유해야 한다.

동일 path에서 A/B 라우팅이 필요하면 Firebase Hosting 단독 정적 rewrite보다 Cloud Run, Cloud Functions, 또는 작은 HTML router가 필요하다. MVP 비교 단계에서는 path 분리가 더 단순하고 안전하다.

---

## 3. 사용자와 사용 환경

### 3-1. 1차 사용자: 현장 방문자

상황:

- 축제, 전시, 팝업, 데모데이 현장에서 QR을 스캔한다.
- 앱 설치 없이 바로 참여하고 싶다.
- 긴 설문보다 짧은 반응을 남기고 싶다.
- 개인정보 입력은 리워드가 있을 때만 고려한다.

React 구현에서 중요한 점:

- 첫 화면은 빠르게 보여야 한다.
- 이미지는 브라우저 기본 이미지 로딩 경로로 안정적으로 표시되어야 한다.
- 모바일 키보드가 하단 입력바를 가리지 않아야 한다.
- 드래그가 어려운 사용자도 기본 위치로 태그 저장을 완료할 수 있어야 한다.

### 3-2. 2차 사용자: 운영자/PM

상황:

- 현장에서 참여자 반응을 빠르게 수집하고 싶다.
- API/CORS/이미지 배포 장애가 있을 때 원인을 빠르게 확인하고 싶다.
- Flutter와 React를 같은 origin에서 비교하고 싶다.

React 구현에서 중요한 점:

- API 요청, 이미지 요청, 라우팅, 태그 좌표 계산을 Playwright로 검증할 수 있어야 한다.
- Mock Service로 서버 장애 없이 UX를 확인할 수 있어야 한다.
- DTO 변화는 Service/Mapper에서 흡수되어 View 변경이 최소화되어야 한다.
- 서버 endpoint, header, path id 해석, DTO field alias 변화는 API 적응 계층에서만 추적 가능해야 한다.

---

## 4. 핵심 사용자 플로우

### 4-1. MVP 기본 플로우

```text
QR 접속
-> /e/{voteId}
-> 투표/이벤트 표시 정보 로딩
-> 질문/항목 카드 목록 표시
-> 항목 카드 선택
-> /e/{voteId}/posts/{questionId}
-> 질문 이미지 표시
-> 하단 SOI 태그 입력바에서 텍스트 입력
-> 제출
-> 스티커/태그 draft 표시
-> 드래그 배치 또는 기본 위치 저장
-> 서버 저장
-> 이미지 위 내 태그 즉시 표시
-> 완료
-> /e/{voteId}/thanks
-> 연락처 선택 입력 또는 건너뛰기
-> /e/{voteId}/final
```

### 4-2. 드래그 가능한 태그 배치 플로우

React MVP에서는 Flutter의 현재 UX를 유지한다.

1. 사용자가 하단 입력바에 텍스트를 작성한다.
2. 제출 버튼 또는 keyboard submit을 누른다.
3. 입력바가 staged tray로 전환된다.
4. 사용자는 스티커를 이미지 위로 드래그한다.
5. 드롭 위치를 실제 이미지 rendered bounds 기준 ratio 좌표로 변환한다.
6. 서버 저장 요청을 보낸다.
7. 저장 성공 시 스티커가 확정 태그로 표시된다.

드래그 실패 fallback:

- 사용자가 드래그하지 않고 완료를 누르면 기본 좌표 `(0.5, 0.5)`에 저장한다.
- 이미지 bounds를 계산할 수 없으면 저장은 막지 않되 기본 좌표를 사용하고 오류를 기록한다.

### 4-3. 실패 플로우

항목 목록 실패:

- 홈 화면에 오류 문구와 재시도 버튼을 표시한다.

상세 이미지 실패:

- 이미지 영역에는 명확한 fallback surface와 재시도/새로고침 안내를 표시한다.
- API는 성공했지만 이미지 요청만 실패한 경우 이미지 URL과 CORS 상태를 diagnostics에 기록할 수 있어야 한다.

태그 저장 실패:

- pending marker는 사라지지 않는다.
- 오류 배너를 표시한다.
- 사용자는 같은 draft를 다시 저장할 수 있어야 한다.

리워드 제출 실패:

- 입력값은 유지한다.
- 오류 문구와 재시도 버튼을 표시한다.

---

## 5. 화면별 요구사항

## U0. 앱 Shell 및 초기 로딩

### 화면 목적

QR 진입 직후 사용자가 빈 화면을 오래 보지 않도록 최소 앱 shell을 빠르게 표시한다.

### 요구사항

- React 앱은 초기 HTML/CSS/JS payload를 Flutter Web보다 가볍게 유지한다.
- `index.html`에는 앱 root와 최소 loading UI를 포함한다.
- 첫 paint 전 대형 폰트/로고/비핵심 media asset을 blocking하지 않는다.
- Pretendard는 WOFF2 subset 또는 system font fallback을 우선 검토한다.
- `/e/**` SPA route는 Firebase Hosting에서 `index.html`로 rewrite된다.
- app shell과 main bundle에는 `no-cache, no-store, must-revalidate` 정책을 적용한다.

### Acceptance Criteria

- 느린 4G 조건에서도 사용자는 빈 흰 화면 대신 앱 로딩 상태를 볼 수 있다.
- JS 로딩 전에도 배경색과 최소 loading affordance가 표시된다.
- `/e/{voteId}` 직접 새로고침이 404가 되지 않는다.

## U1. 항목 선택 화면

### 화면 목적

참여자가 어떤 이미지/질문에 태그를 남길지 빠르게 선택한다.

### 주요 UI

- Taglow 로고
- 이벤트/투표 제목
- 이벤트 설명
- 항목 카드 리스트
- 로딩 상태
- 오류 및 재시도 상태
- 빈 항목 상태

### 기능 요구사항

- `/e/{voteId}` route param을 읽는다.
- `GET /api/public/votes/{voteId}/display`를 호출한다.
- 응답의 `questions` 또는 별도 `GET /api/public/votes/{voteId}/questions` 결과를 프론트 도메인 `VotePost[]`로 변환한다.
- 카드 전체가 터치 영역이어야 한다.
- 카드 클릭 시 `/e/{voteId}/posts/{questionId}`로 이동한다.
- 항목이 없으면 "열린 항목이 없습니다" 성격의 문구를 보여준다.
- 오류 시 재시도 버튼을 제공한다.

### UX 요구사항

- 모바일 360-430px 폭에서 카드 텍스트가 넘치지 않는다.
- desktop에서는 430-520px 중심 모바일 프레임을 사용한다.
- 첫 화면에서 사용자는 "항목을 고르면 된다"는 것을 즉시 이해해야 한다.

### Acceptance Criteria

- 유효한 `voteId`에서 홈 화면이 표시된다.
- 질문이 1개 이상이면 카드가 표시된다.
- 첫 카드를 누르면 상세 route로 이동한다.
- API 실패 시 재시도할 수 있다.

## U2. 태깅 상세 화면

### 화면 목적

선택한 질문 이미지를 보여주고, 하단 입력바에서 텍스트 태그를 작성해 이미지 위에 남기는 핵심 화면이다.

### 주요 UI

- 상단 뒤로가기
- 질문 제목
- 완료 버튼
- 이미지 영역
- 내 태그 overlay
- pending marker
- 하단 SOI 태그 입력바
- 저장 실패 오류 배너

### 기능 요구사항

- `/e/{voteId}/posts/{questionId}` route param을 읽는다.
- 상세 진입 시 이벤트 표시 정보와 질문 상세 정보를 로드한다.
- 질문 이미지를 브라우저 `<img>`로 표시한다.
- 이미지에는 `object-fit: contain` 정책을 적용한다.
- 이미지의 실제 rendered bounds를 측정한다.
- 태그 overlay는 이미지 rendered bounds 안에서만 배치된다.
- 이미지 탭은 새 태그 생성 트리거가 아니다.
- 이미지 탭은 기존 태그 선택 또는 이미지 탐색 동작으로만 확장 가능하다.

### 이미지 로딩 요구사항

- React 구현은 Flutter CanvasKit 이미지 렌더링 이슈를 피하기 위해 DOM `<img>`를 기본으로 사용한다.
- 이미지 요청 성공/실패를 브라우저 Network와 Playwright에서 확인 가능해야 한다.
- 이미지가 로드되면 natural width/height를 저장해 aspect ratio fallback에 사용할 수 있다.
- 서버가 `imageRatio`를 제공하면 초기 layout에 사용하고, 실제 이미지 load 후 natural ratio와 비교할 수 있다.
- 서버가 향후 `imageProxyUrl`을 제공하면 원본 `imageUrl`보다 우선 사용한다.

### Acceptance Criteria

- question 31과 같은 S3 JPEG가 상세 화면에서 보인다.
- 이미지 network request가 200이어도 화면이 검정으로 남는 케이스가 없어야 한다.
- 이미지 load failure 시 fallback UI가 보인다.
- 화면 크기가 바뀌어도 태그 좌표는 이미지 기준으로 유지된다.

## U3. 하단 SOI 태그 입력바

### 화면 목적

참여자가 텍스트 태그 작성을 시작하는 유일한 진입점이다.

### 주요 UI

- 검은 pill 형태 입력바
- 노란 border/glow
- 텍스트 input
- submit 버튼
- staged 상태의 드래그 tray
- 취소 버튼
- 드래그 안내 chip

### 기능 요구사항

- 텍스트 태그는 필수 MVP 기능이다.
- 빈 텍스트 제출은 불가하다.
- 최대 100자 제한을 적용한다.
- 권장 50자 내외의 짧은 입력 경험을 유지한다.
- submit 후 입력바는 staged tray로 전환된다.
- staged tray에서 스티커를 이미지 위로 드래그할 수 있다.
- 취소 시 draft와 pending marker가 제거되고 입력 상태로 돌아간다.

### Media 정책

- 사진/영상 UI는 현재 Flutter처럼 기본 비활성화 상태로 둔다.
- React TDD에는 확장 지점을 남기되 MVP 첫 이관에서는 텍스트 태그만 구현한다.
- 미디어 기능을 켤 때는 권한 요청, S3 업로드, 개인정보/용량 정책을 별도 승인 후 진행한다.

### Acceptance Criteria

- 사용자는 하단 입력바에서 텍스트를 작성할 수 있다.
- 빈 입력은 제출되지 않는다.
- 제출 가능한 상태에서 버튼이 활성화된다.
- submit 후 스티커가 드래그 가능한 상태가 된다.

## U4. 태그 표시 및 상세 확인

### 화면 목적

사용자가 남긴 태그가 이미지 위에 연결되었음을 즉시 확인한다.

### 기능 요구사항

- 저장된 태그는 이미지 기준 ratio 좌표로 표시한다.
- 방금 작성한 내 태그는 active 상태로 더 선명하게 표시한다.
- 태그를 누르면 텍스트 내용을 말풍선/팝업으로 확인할 수 있다.
- 태그 상태는 `draft`, `pending`, `synced`, `failed`, `deleted`를 구분한다.
- MVP에서는 "이번 세션에서 내가 만든 태그" 표시를 우선한다.
- 전체 공개 태그 display는 서버 정책과 UX 결정 후 확장한다.

### Acceptance Criteria

- 저장 성공 후 태그가 이미지 위에 표시된다.
- 태그 위치는 viewport 변경 후에도 같은 이미지 위치를 가리킨다.
- 태그를 누르면 텍스트 내용을 확인할 수 있다.
- failed 상태는 사용자에게 숨기지 않는다.

## U5. Thanks/Contact Prompt

### 화면 목적

태그 완료 이후 선택적으로 리워드 연락처를 입력하게 한다.

### 주요 UI

- 이전 버튼
- Taglow 로고
- 건너뛰기
- 안내 제목
- 리워드 설명
- 이름 input
- 전화번호 input
- 개인정보 수집 동의 checkbox
- 제출 버튼
- 오류 문구

### 기능 요구사항

- `/e/{voteId}/thanks` route로 접근한다.
- 태그 작성 없이 직접 접근하더라도 화면은 깨지지 않는다.
- 개인정보 입력은 태그 등록의 전제 조건이 아니다.
- 이름/전화번호/동의가 유효할 때만 제출할 수 있다.
- 제출 성공 시 `/e/{voteId}/final`로 이동한다.
- 건너뛰기 시 개인정보 API 호출 없이 final로 이동한다.

### Acceptance Criteria

- 사용자는 리워드 입력 없이 완료할 수 있다.
- 개인정보 동의 전에는 제출되지 않는다.
- 제출 실패 시 입력값이 유지된다.

## U6. Final Completion

### 화면 목적

참여가 완료되었음을 명확히 알려주고, 필요 시 같은 이벤트 홈으로 돌아가게 한다.

### 기능 요구사항

- `/e/{voteId}/final` route로 접근한다.
- 정적 완료 메시지를 표시한다.
- "처음으로 돌아가기" 버튼은 `/e/{voteId}`로 이동한다.
- 추가 개인정보나 태그 입력을 요구하지 않는다.

### Acceptance Criteria

- final 화면은 API 없이도 렌더링된다.
- 홈 복귀 버튼이 작동한다.

---

## 6. 데이터 요구사항

### 6-1. ParticipantEvent

프론트 도메인에서 이벤트/투표 표시 정보를 나타낸다.

필드:

- `id`: string, 백엔드 `voteId`
- `voteTitle`: string
- `voteDescription`: string
- `votePosts`: `VotePost[]`
- `status`: string
- `displayContent`: optional display copy
- `startedAt`: optional ISO date
- `endedAt`: optional ISO date

### 6-2. VotePost

프론트 도메인에서 태깅 대상 질문/이미지를 나타낸다.

필드:

- `id`: string, 백엔드 `questionId`
- `eventId`: string, 백엔드 `voteId`
- `title`: string
- `description`: string
- `imageUrl`: optional string
- `imageRatio`: optional number
- `thumbnailUrl`: optional string
- `altText`: optional string
- `visualKey`: string
- `tagCount`: number
- `sortOrder`: number

### 6-3. ParticipantTag

이미지 위에 표시되는 태그이다.

필드:

- `id`: string
- `votePostId`: string
- `type`: `text | photo | video`
- `text`: optional string
- `media`: optional `TagMedia`
- `coordinate`: `TagCoordinate`
- `syncStatus`: `draft | pending | synced | failed | deleted`
- `createdAt`: string
- `isMine`: boolean
- `canDelete`: boolean
- `stickerSeed`: optional number

### 6-4. TagCoordinate

필드:

- `xRatio`: number, `0.0..1.0`
- `yRatio`: number, `0.0..1.0`

정책:

- 화면 pixel 좌표는 저장하지 않는다.
- 저장 전 모든 좌표는 clamp한다.
- conversion은 실제 `<img>` rendered bounds 기준으로 수행한다.

### 6-5. ParticipantSession

필드:

- `sessionId`: string UUID
- storage key: `taglow.participant.sessionId.v1`

정책:

- 익명 구분과 중복 제출 제어용이다.
- 민감정보가 아니지만 개인정보와 연결해 분석하지 않는다.
- localStorage 사용 실패 시 memory fallback으로 계속 참여 가능해야 한다.

### 6-6. FinalEntry

필드:

- `eventId`: string
- `sessionId`: string
- `name`: string
- `phone`: string
- `privacyConsent`: boolean
- `consentedAt`: string

정책:

- 태그와 별도 흐름에서 제출한다.
- 개인정보 동의가 없으면 제출하지 않는다.

---

## 7. API 요구사항

기준 서버:

```text
https://vote.newdawnsoi.site
```

React 앱은 다음 공개 API를 사용한다.

| 제품 동작 | API |
|---|---|
| 이벤트/투표 표시 정보 조회 | `GET /api/public/votes/{voteId}/display` |
| 질문/항목 목록 조회 | `GET /api/public/votes/{voteId}/questions` |
| 질문 태그 목록 조회 | `GET /api/public/questions/{questionId}/tags` |
| 태그 생성 | `POST /api/public/questions/{questionId}/tags` |
| 태그 위치 변경 | `PATCH /api/public/tags/{tagId}` |
| 태그 삭제 | `DELETE /api/public/tags/{tagId}` |
| 리워드 연락처 제출 | `POST /api/public/event-users` |

React MVP에서의 API 사용 정책:

- 홈은 display 응답의 `questions`를 우선 사용하되, 필요하면 questions endpoint를 보강 호출한다.
- 상세는 current Flutter처럼 `GET /api/public/votes/{voteId}/questions`에서 해당 `questionId`를 선택해 상세 정보를 만든다.
- 태그 display는 MVP에서 "내가 이번 화면에서 생성한 태그"를 우선 표시한다.
- 전체 태그 목록 공개 표시가 필요하면 product decision 후 `fetchTags`를 상세 진입에 연결한다.
- 요청 헤더 `taglow-Session-Id`는 태그 생성/조회/삭제에서 사용한다.
- JSON body가 없는 GET에는 불필요한 `Content-Type`을 넣지 않는다.

### 7-1. API 적응 계층 요구사항

React 구현은 현재 Flutter의 핵심 구조인 `ParticipantApiGateway`와 `ParticipantPayloadMapper`를 제품 아키텍처 요구사항으로 유지한다.

목표는 서버 API와 프론트 domain model을 직접 연결하지 않고, 중간에 명시적인 적응 계층을 두는 것이다.

```text
Server Public API / DTO
-> ParticipantApiGateway
-> raw payload
-> ParticipantPayloadMapper
-> api/model domain model
-> ParticipantService
-> Controller
-> View
```

각 계층의 제품 책임:

| 계층 | 제품 관점 책임 |
|---|---|
| `ParticipantApiGateway` | 서버 endpoint, HTTP method, session header, path id 해석, 질문 선택, 응답 shape 차이를 흡수한다. |
| `ParticipantPayloadMapper` | 서버 DTO field alias, 이미지 URL 우선순위, 좌표 ratio, ownership, 생성/수정 body를 프론트 domain model에 맞게 정규화한다. |
| `OpenApiParticipantService` | gateway와 mapper를 조합해 Controller/View가 안정적인 `ParticipantService` 계약만 보게 한다. |
| `api/model` | View와 Controller가 사용하는 앱 내부 domain type의 기준이다. 서버 DTO 이름을 그대로 노출하지 않는다. |

필수 정책:

- View와 Controller는 서버 DTO field name을 알면 안 된다.
- View와 Controller는 `fetch`, `axios`, generated API client, raw response payload를 직접 다루면 안 된다.
- `eventId` route param은 gateway에서 backend `voteId`로 해석한다.
- `votePostId` route param은 gateway에서 backend `questionId`로 해석한다.
- 서버가 `questions`를 nested object 또는 list 형태로 내려도 gateway/mapper에서 정규화한다.
- 서버가 이미지 URL field를 바꾸더라도 mapper가 `imageProxyUrl` 계열을 우선하고 원본 URL fallback을 유지한다.
- 태그 좌표는 mapper에서 `locationX/locationY`, `xRatio/yRatio`, nested `coordinate`를 모두 앱 내부 `TagCoordinate`로 정규화한다.
- 개인정보 제출 body는 gateway/service debug log에서 redaction되어야 한다.

### 7-2. API 적응 계층 수용 기준

React MVP는 아래를 만족해야 한다.

- Mock Service와 OpenAPI Service가 같은 `ParticipantService` interface를 구현한다.
- OpenAPI Service는 gateway와 mapper를 통해서만 서버 API를 사용한다.
- mapper 단위 테스트가 field alias, 이미지 URL 우선순위, 좌표 정규화, ownership 판단을 검증한다.
- gateway 단위 테스트 또는 MSW 테스트가 endpoint, session header, bodyless GET header 정책을 검증한다.
- 서버 DTO 변경이 발생했을 때 수정 범위는 gateway/mapper/service orchestration 안으로 제한된다.

---

## 8. 개인정보 및 보안 요구사항

- 태그 제출 전 개인정보를 요구하지 않는다.
- 리워드 개인정보는 thanks/contact prompt에서만 입력받는다.
- 개인정보 동의 체크 없이 `POST /api/public/event-users`를 호출하지 않는다.
- localStorage에는 `sessionId`만 저장한다.
- 이름/전화번호는 browser storage에 저장하지 않는다.
- console log, analytics, error report에 개인정보 body를 남기지 않는다.
- S3 업로드나 media 기능이 켜질 경우 AWS access key를 클라이언트 코드나 env에 넣지 않는다.

---

## 9. 성능 요구사항

### 9-1. 초기 로딩

React 앱은 Flutter Web 대비 더 빠른 QR-to-first-screen 체감을 목표로 한다.

요구사항:

- 초기 route에 필요 없는 media upload SDK는 bundle에 포함하지 않는다.
- media/photo/video 기능은 MVP에서 제외하거나 lazy import한다.
- 로고와 favicon은 용도에 맞는 작은 파일로 최적화한다.
- Pretendard OTF 4개를 그대로 싣지 않는다. WOFF2 subset 또는 system font fallback을 검토한다.
- 이미지 상세 route는 질문 이미지를 우선순위 높게 로드한다.

### 9-2. 이미지 로딩

요구사항:

- `<img>`에 `decoding="async"`를 사용한다.
- 상세 이미지는 layout shift를 줄이기 위해 서버 `imageRatio` 또는 natural ratio 기반 aspect-ratio를 적용한다.
- 이미지 load/error event를 상태로 관리한다.
- 이미지 영역 fallback은 명확해야 하며 검정 화면으로 방치하지 않는다.

### 9-3. 30초 첫 태그

측정 기준:

```text
QR route navigation start
-> home visible
-> item card tap
-> detail image visible
-> text input focus
-> text submit
-> tag visible on image
```

성공 기준:

- 일반 모바일 네트워크에서 첫 텍스트 태그 등록 완료가 30초 안에 가능해야 한다.
- Mock Service와 real API 각각에서 측정한다.

---

## 10. QA 시나리오

### 10-1. 기본 참여

1. `/e/11`로 접속한다.
2. 홈 화면 제목과 첫 항목 카드가 보인다.
3. 첫 항목을 누른다.
4. `/e/11/posts/31`로 이동한다.
5. 이미지가 보인다.
6. 하단 입력바에 텍스트를 입력한다.
7. submit을 누른다.
8. 스티커가 staged 상태로 보인다.
9. 이미지를 향해 드래그한다.
10. 태그가 이미지 위에 확정 표시된다.
11. 완료를 누른다.
12. thanks 화면에서 건너뛰기를 누른다.
13. final 화면이 보인다.

### 10-2. 기본 위치 저장

1. 상세 화면에서 텍스트를 입력한다.
2. submit 후 드래그하지 않는다.
3. 완료를 누른다.
4. 태그가 기본 좌표 `(0.5, 0.5)`에 저장된다.

### 10-3. 이미지 실패

1. Service mock으로 깨진 image URL을 반환한다.
2. 상세 화면에 진입한다.
3. 이미지 fallback UI가 보인다.
4. 태그 입력바는 화면을 깨뜨리지 않는다.

### 10-4. 저장 실패

1. Mock Service가 tag create 실패를 반환하도록 설정한다.
2. 태그를 제출한다.
3. pending marker와 오류가 보인다.
4. 재시도하면 성공할 수 있다.

### 10-5. 리워드 개인정보

1. thanks 화면에 진입한다.
2. 이름/전화번호를 입력하지 않고 제출 버튼이 비활성인지 확인한다.
3. 이름/전화번호를 입력해도 동의 전에는 제출 불가인지 확인한다.
4. 동의 후 제출하면 final로 이동한다.
5. 건너뛰기는 API 호출 없이 final로 이동한다.

### 10-6. CORS/동일 origin 비교

1. `https://taglow-acca6.web.app/e/11`에서 React 앱을 연다.
2. `GET /display`, `GET /questions`, S3 image request가 브라우저에서 성공하는지 확인한다.
3. `https://taglow-acca6.web.app/flutter/e/11`에서 Flutter 비교 앱을 연다.
4. 두 앱 모두 같은 origin으로 서버 CORS allowlist를 공유하는지 확인한다.

---

## 11. React 이관 MVP 범위

### 11-1. 반드시 구현

- Firebase Hosting same-origin route
- React app shell
- `/e/:eventId`
- `/e/:eventId/posts/:votePostId`
- `/e/:eventId/thanks`
- `/e/:eventId/final`
- ParticipantEvent/VotePost/ParticipantTag domain models
- ParticipantService interface
- MockParticipantService
- OpenApiParticipantService
- ParticipantApiGateway
- ParticipantPayloadMapper
- anonymous session store
- home item list
- detail image render with `<img>`
- contain image bounds calculation
- text tag draft
- staged sticker drag
- default center save fallback
- create tag API
- gateway/mapper boundary unit tests
- optimistic/pending/synced/failed state
- thanks reward/contact prompt
- final completion
- mobile frame layout
- Playwright core flow test

### 11-2. 나중에 구현

- 사진 태그
- 영상 태그
- S3 direct upload
- 전체 태그 display API 연동
- 태그 수정
- 실시간 외부 display 반영
- AI 분석

---

## 12. 오픈 이슈

| 항목 | 결정 필요 사항 | 기본 제안 |
|---|---|---|
| 운영 path | React가 `/e/**`를 바로 소유할지, `/react/e/**`로 먼저 둘지 | React 후보를 `/e/**`, Flutter 비교를 `/flutter/**` |
| 전체 태그 노출 | 다른 참여자의 태그도 보여줄지 | MVP는 내 태그 중심 |
| 드래그 필수 여부 | 드래그 없이 저장 가능 여부 | 가능해야 함, 기본 중앙 저장 |
| 미디어 태그 | 사진/영상 MVP 포함 여부 | React 첫 이관에서는 제외 |
| 상태관리 | React Query/Zustand/Redux 선택 | TanStack Query + Zustand |
| 폰트 | Pretendard 전체 탑재 여부 | WOFF2 subset 또는 system fallback |
| 이미지 proxy | 서버 `imageProxyUrl` 우선 사용 여부 | 제공되면 우선 사용 |

---

## 13. 최종 제품 기준 요약

React Taglow MVP는 "Flutter를 React로 똑같이 복제"하는 것이 아니라, 현장 QR 참여에 필요한 핵심 경험을 더 빠르고 안정적인 모바일 웹으로 제공하는 것이 목표다.

최종 기준:

1. 같은 Firebase origin을 사용한다.
2. `/e/{voteId}` 흐름을 유지한다.
3. 참여자는 로그인 없이 30초 안에 첫 텍스트 태그를 남길 수 있다.
4. 질문 이미지는 브라우저 기본 이미지로 안정적으로 표시된다.
5. 태그는 하단 입력바에서 시작한다.
6. 태그 좌표는 이미지 기준 ratio로 저장된다.
7. 저장 성공/실패 상태를 숨기지 않는다.
8. 개인정보 입력은 태그 등록 이후 선택 사항이다.
9. React 구현은 Mock/API 교체 가능한 MVC 확장 패턴을 유지한다.
