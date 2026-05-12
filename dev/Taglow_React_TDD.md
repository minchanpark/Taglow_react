# Taglow React 참여자용 서비스 TDD v0.1

## 0. 문서 개요

### 0-1. 문서 목적

본 문서는 현재 Flutter Web으로 구현된 Taglow 참여자용 MVP를 React/TypeScript 기반 앱으로 이관하기 위한 기술 설계 문서이다.

기존 Flutter 프로젝트의 구조적 장점은 유지한다.

- `api/model`
- `api/service`
- `api/controller`
- `view`
- `utils`
- `theme`

다만 React의 웹 친화적 특성을 활용해 이미지 렌더링, 초기 로딩, pointer drag, browser storage, Playwright 검증을 더 직접적으로 설계한다.

### 0-2. 설계 목표

1. Flutter의 MVC 확장 패턴을 React에 맞게 재구성한다.
2. View가 Service/API/browser storage를 직접 호출하지 않게 한다.
3. Service 내부에 gateway/mapper 기반 API 적응 계층을 두고 서버 DTO를 프론트 domain model로 변환한다.
4. Controller hook/store가 View의 상태와 UI 이벤트를 관리한다.
5. 이미지 표시와 태그 좌표 계산은 DOM `<img>` rendered bounds를 기준으로 한다.
6. Firebase Hosting same-origin 배포를 지원한다.
7. Mock Service와 OpenAPI Service를 같은 Controller/View 계약으로 교체 가능하게 한다.
8. 서버 endpoint, header, DTO field alias 변화가 `api/service` 경계 밖으로 새지 않게 한다.

---

## 1. 기술 스택

| 영역 | 선택 | 이유 |
|---|---|---|
| Frontend | React + TypeScript | 모바일 웹 구현, DOM 이미지/입력/드래그 직접 제어 |
| Build | Vite | 빠른 개발 서버, 작은 번들, Firebase Hosting 배포 용이 |
| Routing | React Router | `/e/:eventId`, `/posts/:votePostId` route 구성 |
| Server State | TanStack Query | API loading/error/cache/refetch 관리 |
| Client/UI State | Zustand | draft, overlay, staged tag, reward form 등 lightweight 상태 |
| Forms | Controlled input + small validators | 현재 Flutter controller 구조와 유사, MVP 범위 단순 |
| HTTP | fetch wrapper 또는 axios | `Content-Type` 제어, CORS-simple GET 유지 |
| Tests | Vitest, React Testing Library, Playwright, MSW | unit/component/e2e/API mock 검증 |
| Styling | CSS Modules 또는 plain CSS + design tokens | MVC 구조 유지, 빠른 이관 |
| Hosting | Firebase Hosting | 기존 origin 유지, CORS allowlist 재사용 |

### 1-1. 상태관리 선택

권장 기본안은 **TanStack Query + Zustand**이다.

TanStack Query가 맡는 것:

- `fetchEvent(eventId)`
- `fetchVotePost(eventId, votePostId)`
- `fetchTags(votePostId, sessionId)`가 필요해질 경우
- API loading/error/refetch
- query invalidation

Zustand가 맡는 것:

- tag draft text
- staged 여부
- pending marker
- local overlay tags
- selected/active tag id
- isSubmitting flag
- reward form input state
- anonymous session memory fallback

선택 이유:

- Redux보다 작은 코드로 Flutter `StateNotifier`와 유사한 store/controller 구조를 만들 수 있다.
- 서버 데이터와 UI draft 상태를 분리할 수 있다.
- React Query의 server cache와 Zustand의 interaction state가 Taglow 흐름에 잘 맞는다.
- Controller hook에서 service, query, store를 조합하면 기존 `View -> Controller -> Service` 방향을 유지할 수 있다.

대안:

- React Query only: draft/overlay 상태가 query cache에 섞일 수 있어 비추천.
- Redux Toolkit: 팀이 Redux에 익숙하고 규모가 커질 경우 가능하지만 MVP에는 다소 무겁다.
- Jotai: 세밀한 atom 구조는 좋지만 기존 MVC controller 대응표가 Zustand보다 덜 직관적이다.

---

## 2. React MVC 확장 아키텍처

### 2-1. 의존성 방향

React에서도 Flutter의 의존성 방향을 유지한다.

```text
view
  -> api/controller
  -> api/service
  -> api/service/gateway + api/service/mapper
  -> api/model / utils / browser API wrapper / server API
```

금지:

- View가 `fetch`를 직접 호출하지 않는다.
- View가 localStorage를 직접 호출하지 않는다.
- View가 서버 DTO 구조를 직접 알지 않는다.
- View가 S3/media upload SDK를 직접 import하지 않는다.
- Service가 React component를 import하지 않는다.

허용:

- View는 controller hook을 호출한다.
- Controller는 service interface와 store를 조합한다.
- Service는 gateway와 mapper를 통해 DTO를 domain model로 변환한다.
- Utils는 순수 함수로 좌표/검증/formatting을 제공한다.

### 2-2. API 적응 계층

현재 Flutter 프로젝트의 핵심 경계인 `participant_api_gateway.dart`와 `participant_payload_mapper.dart`는 React에서도 독립된 중간 계층으로 유지한다.

```text
External Server API
  -> FetchParticipantApiGateway
  -> RawParticipantPayload
  -> ParticipantPayloadMapper
  -> api/model domain type
  -> OpenApiParticipantService
  -> ParticipantService interface
  -> Controller hook/store
  -> View
```

핵심 원칙:

- `ParticipantApiGateway`는 서버 API를 프론트용 payload로 가져오는 낮은 단계 adapter이다.
- `ParticipantPayloadMapper`는 raw payload와 `api/model` domain type 사이의 유일한 변환 지점이다.
- `OpenApiParticipantService`는 gateway와 mapper를 조합하는 orchestration layer이다.
- `MockParticipantService`는 같은 `ParticipantService` interface를 구현하되 gateway/mapper를 거치지 않아도 된다.
- Controller와 View는 gateway, mapper, raw DTO, generated client, `fetch`를 직접 import하지 않는다.
- 서버 DTO 변경은 gateway/mapper 테스트를 먼저 깨뜨리고, View 테스트는 깨지지 않는 구조를 목표로 한다.

React 디렉터리에서는 `api/model`과 외부 server API 사이에 다음 하위 계층을 둔다.

```text
src/api/service/
├── participantService.ts
├── openApiParticipantService.ts
├── mockParticipantService.ts
├── participantServiceProvider.ts
├── gateway/
│   ├── participantApiGateway.ts
│   └── fetchParticipantApiGateway.ts
└── mapper/
    └── participantPayloadMapper.ts
```

### 2-3. 전체 구조

```text
src/
├── main.tsx
├── app/
│   ├── App.tsx
│   ├── router.tsx
│   ├── queryClient.ts
│   └── providers.tsx
│
├── api/
│   ├── model/
│   │   ├── participantEvent.ts
│   │   ├── participantEventDisplayContent.ts
│   │   ├── votePost.ts
│   │   ├── participantTag.ts
│   │   ├── tagCoordinate.ts
│   │   ├── tagType.ts
│   │   ├── tagMedia.ts
│   │   ├── createTagRequest.ts
│   │   └── finalEntry.ts
│   │
│   ├── service/
│   │   ├── participantService.ts
│   │   ├── participantServiceProvider.ts
│   │   ├── mockParticipantService.ts
│   │   ├── openApiParticipantService.ts
│   │   ├── generatedApiClientFactory.ts
│   │   ├── gateway/
│   │   │   ├── participantApiGateway.ts
│   │   │   └── fetchParticipantApiGateway.ts
│   │   ├── mapper/
│   │   │   └── participantPayloadMapper.ts
│   │   ├── taggingEngineService.ts
│   │   ├── tagMediaService.ts
│   │   └── s3MediaUploadService.ts
│   │
│   └── controller/
│       ├── itemListController.ts
│       ├── taggingDetailController.ts
│       ├── tagDraftController.ts
│       ├── rewardController.ts
│       ├── participantRouteController.ts
│       └── stores/
│           ├── tagDraftStore.ts
│           ├── taggingOverlayStore.ts
│           └── rewardStore.ts
│
├── view/
│   ├── home/
│   │   ├── ParticipantHomePage.tsx
│   │   └── widgets/
│   │       └── ItemCard.tsx
│   ├── detail/
│   │   ├── TaggingDetailPage.tsx
│   │   └── widgets/
│   │       ├── TaggingImageArea.tsx
│   │       ├── ParticipantTagOverlay.tsx
│   │       ├── BottomTagInputBar.tsx
│   │       ├── TagSticker.tsx
│   │       ├── TagDetailSheet.tsx
│   │       ├── PendingTagDragData.ts
│   │       └── tagDropGeometry.ts
│   ├── thanks/
│   │   └── ThanksPage.tsx
│   └── final/
│       └── FinalPage.tsx
│
├── utils/
│   ├── coordinateConverter.ts
│   ├── inputValidator.ts
│   ├── localSessionStore.ts
│   ├── localSessionStorage.ts
│   ├── responsiveLayout.ts
│   └── imageBounds.ts
│
├── theme/
│   ├── colors.ts
│   ├── spacing.ts
│   ├── radius.ts
│   ├── typography.ts
│   └── global.css
│
├── assets/
│   ├── logo/
│   ├── sticker/
│   └── icon/
│
└── test/
    ├── unit/
    ├── component/
    └── e2e/
```

### 2-4. Flutter -> React 파일 대응표

| Flutter | React |
|---|---|
| `lib/main.dart` | `src/main.tsx` |
| `lib/app.dart` | `src/app/App.tsx`, `src/app/router.tsx` |
| `lib/api/model/*.dart` | `src/api/model/*.ts` |
| `lib/api/service/*.dart` | `src/api/service/*.ts` |
| `lib/api/service/participant_api_gateway.dart` | `src/api/service/gateway/participantApiGateway.ts`, `src/api/service/gateway/fetchParticipantApiGateway.ts` |
| `lib/api/service/participant_payload_mapper.dart` | `src/api/service/mapper/participantPayloadMapper.ts` |
| `lib/api/controller/*.dart` | `src/api/controller/*.ts`, `src/api/controller/stores/*.ts` |
| `lib/view/home/participant_home_page.dart` | `src/view/home/ParticipantHomePage.tsx` |
| `lib/view/home/widgets/item_card.dart` | `src/view/home/widgets/ItemCard.tsx` |
| `lib/view/detail/tagging_detail_page.dart` | `src/view/detail/TaggingDetailPage.tsx` |
| `lib/view/detail/widgets/tagging_image_area.dart` | `src/view/detail/widgets/TaggingImageArea.tsx` |
| `lib/view/detail/widgets/participant_tag_overlay.dart` | `src/view/detail/widgets/ParticipantTagOverlay.tsx` |
| `lib/view/detail/widgets/bottom_tag_input_bar.dart` | `src/view/detail/widgets/BottomTagInputBar.tsx` |
| `lib/view/detail/widgets/tag_sticker.dart` | `src/view/detail/widgets/TagSticker.tsx` |
| `lib/view/thanks/thanks_page.dart` | `src/view/thanks/ThanksPage.tsx` |
| `lib/view/final/final_page.dart` | `src/view/final/FinalPage.tsx` |
| `lib/utils/coordinate_converter.dart` | `src/utils/coordinateConverter.ts` |
| `lib/utils/input_validator.dart` | `src/utils/inputValidator.ts` |
| `lib/utils/local_session_store.dart` | `src/utils/localSessionStore.ts` |
| `lib/theme/app_colors.dart` | `src/theme/colors.ts` |

---

## 3. Routing 설계

### 3-1. 운영 route

```text
/
  -> /e/1 redirect 또는 invalid entry 안내

/e/:eventId
  -> ParticipantHomePage

/e/:eventId/posts/:votePostId
  -> TaggingDetailPage

/e/:eventId/thanks
  -> ThanksPage

/e/:eventId/final
  -> FinalPage
```

### 3-2. 비교 route

React가 운영 후보 route를 소유하고 Flutter 비교 버전을 path prefix로 둔다.

```text
/e/**        React
/flutter/**  Flutter build output 또는 별도 hosting target
```

### 3-3. Router 정책

- `eventId`는 route에서는 `eventId`라고 부르되 API에서는 `voteId`로 사용한다.
- `votePostId`는 route에서는 `votePostId`라고 부르되 API에서는 `questionId`로 사용한다.
- 잘못된 route param은 전체 앱 crash가 아니라 오류 상태로 표시한다.
- thanks/final 직접 접근은 허용하되 API 없이 정적 fallback 표시가 가능해야 한다.

---

## 4. Domain Model 설계

### 4-1. `tagType.ts`

```ts
export type TagType = 'text' | 'photo' | 'video';
```

MVP에서는 `text`만 활성화한다. `photo`, `video`는 model과 service 확장 지점으로 유지한다.

### 4-2. `tagCoordinate.ts`

```ts
export interface TagCoordinate {
  xRatio: number;
  yRatio: number;
}

export function createTagCoordinate(xRatio: number, yRatio: number): TagCoordinate {
  return {
    xRatio: clampRatio(xRatio),
    yRatio: clampRatio(yRatio),
  };
}

function clampRatio(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}
```

### 4-3. `votePost.ts`

```ts
export interface VotePost {
  id: string;
  eventId: string;
  title: string;
  description: string;
  imageUrl?: string;
  imageRatio?: number;
  visualKey: string;
  tagCount: number;
  sortOrder: number;
  thumbnailUrl?: string;
  altText?: string;
}

export function hasImageDetail(votePost: VotePost): boolean {
  return Boolean(votePost.imageUrl?.trim() && votePost.imageRatio && votePost.imageRatio > 0);
}
```

### 4-4. `participantEvent.ts`

```ts
export interface ParticipantEvent {
  id: string;
  voteTitle: string;
  voteDescription: string;
  votePosts: VotePost[];
  status: string;
  displayContent: ParticipantEventDisplayContent;
  startedAt?: string;
  endedAt?: string;
}
```

### 4-5. `participantTag.ts`

```ts
export type TagSyncStatus = 'draft' | 'pending' | 'synced' | 'failed' | 'deleted';

export interface ParticipantTag {
  id: string;
  votePostId: string;
  type: TagType;
  text?: string;
  media?: TagMedia;
  coordinate: TagCoordinate;
  syncStatus: TagSyncStatus;
  createdAt: string;
  isMine: boolean;
  canDelete: boolean;
  stickerSeed?: number;
}
```

### 4-6. `createTagRequest.ts`

```ts
export interface CreateTagRequest {
  type: TagType;
  text?: string;
  media?: TagMedia;
  coordinate: TagCoordinate;
}
```

### 4-7. `finalEntry.ts`

```ts
export interface FinalEntry {
  name: string;
  phone: string;
  privacyConsent: boolean;
  consentedAt?: string;
}

export function isConsentReady(entry: FinalEntry): boolean {
  return Boolean(entry.privacyConsent && entry.name.trim() && entry.phone.trim());
}
```

---

## 5. Service 설계

Service 계층은 서버 API와 앱 domain model을 직접 붙이지 않는다. React 버전의 핵심 구성은 아래 네 가지이다.

```text
ParticipantService interface
  <- MockParticipantService
  <- OpenApiParticipantService
       -> ParticipantApiGateway
       -> ParticipantPayloadMapper
       -> api/model domain types
```

역할 구분:

| 구성 | 책임 |
|---|---|
| `ParticipantService` | Controller가 사용하는 stable domain API |
| `OpenApiParticipantService` | gateway 호출과 mapper 변환을 조합하는 orchestration |
| `ParticipantApiGateway` | 서버 endpoint/path/header/generated client/HTTP transport 차이를 흡수 |
| `ParticipantPayloadMapper` | raw payload와 `api/model` domain type 사이를 변환 |
| `MockParticipantService` | 같은 `ParticipantService` 계약으로 UX와 테스트를 서버 없이 제공 |

### 5-1. `ParticipantService`

```ts
export interface ParticipantService {
  fetchEvent(eventId: string): Promise<ParticipantEvent>;

  fetchVotePost(params: {
    eventId: string;
    votePostId: string;
  }): Promise<VotePost>;

  fetchTags(params: {
    votePostId: string;
    sessionId: string;
  }): Promise<ParticipantTag[]>;

  createTag(params: {
    votePostId: string;
    request: CreateTagRequest;
    sessionId: string;
  }): Promise<ParticipantTag>;

  updateTagPosition(params: {
    tagId: string;
    coordinate: TagCoordinate;
  }): Promise<ParticipantTag>;

  deleteTag(params: {
    tagId: string;
    sessionId: string;
  }): Promise<void>;

  submitFinalEntry(params: {
    eventId: string;
    sessionId: string;
    entry: FinalEntry;
  }): Promise<void>;
}
```

### 5-2. Service Provider

Flutter의 `participantServiceProvider`는 React에서 단순 factory로 옮긴다.

```ts
export function createParticipantService(): ParticipantService {
  if (import.meta.env.VITE_TAGLOW_USE_MOCK_SERVICE === 'true') {
    return new MockParticipantService();
  }

  return new OpenApiParticipantService({
    gateway: new FetchParticipantApiGateway({
      baseUrl: import.meta.env.VITE_TAGLOW_API_BASE_URL ?? 'https://vote.newdawnsoi.site',
    }),
    mapper: new ParticipantPayloadMapper(),
  });
}
```

주의:

- View에서 이 factory를 직접 호출하지 않는다.
- app provider 또는 controller layer에서 service singleton을 주입한다.

### 5-3. `ParticipantApiGateway`

Flutter의 `ParticipantApiGateway`처럼 React gateway도 server API를 호출하되 domain model을 반환하지 않는다. 반환값은 mapper가 처리할 수 있는 raw payload여야 한다.

```ts
export interface ParticipantApiGateway {
  fetchEvent(eventId: string): Promise<Record<string, unknown>>;
  fetchVotePost(params: { eventId: string; votePostId: string }): Promise<Record<string, unknown>>;
  fetchTags(params: { votePostId: string; sessionId: string }): Promise<Record<string, unknown>[]>;
  createTag(params: {
    votePostId: string;
    sessionId: string;
    payload: Record<string, unknown>;
  }): Promise<Record<string, unknown>>;
  updateTagPosition(params: {
    tagId: string;
    payload: Record<string, unknown>;
  }): Promise<Record<string, unknown>>;
  deleteTag(params: { tagId: string; sessionId: string }): Promise<void>;
  submitFinalEntry(params: {
    eventId: string;
    sessionId: string;
    payload: Record<string, unknown>;
  }): Promise<void>;
}
```

gateway가 책임지는 것:

- `eventId` route param을 backend `voteId` path로 사용한다.
- `votePostId` route param을 backend `questionId` path로 사용한다.
- `GET /api/public/votes/{voteId}/questions` 응답에서 target question payload를 선택한다.
- session header `taglow-Session-Id`를 필요한 요청에만 붙인다.
- body 없는 GET에 `Content-Type`을 붙이지 않는다.
- `/api/public/event-users` logging은 body를 redaction한다.
- generated OpenAPI client를 도입하더라도 generated DTO와 transport 차이는 gateway 내부에 둔다.

### 5-4. Fetch Gateway endpoint mapping

| Gateway method | Endpoint |
|---|---|
| `fetchEvent(eventId)` | `GET /api/public/votes/{eventId}/display` |
| `fetchVotePost({ eventId, votePostId })` | `GET /api/public/votes/{eventId}/questions`, then select question |
| `fetchTags({ votePostId, sessionId })` | `GET /api/public/questions/{votePostId}/tags` |
| `createTag` | `POST /api/public/questions/{votePostId}/tags` |
| `updateTagPosition` | `PATCH /api/public/tags/{tagId}` |
| `deleteTag` | `DELETE /api/public/tags/{tagId}` |
| `submitFinalEntry` | `POST /api/public/event-users` |

### 5-5. Fetch policy

```ts
async function requestJson<T>(url: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      Accept: 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new ApiError(response.status, url);
  }

  return response.json() as Promise<T>;
}
```

정책:

- body 없는 GET에는 `Content-Type`을 넣지 않는다.
- JSON body가 있는 POST/PATCH에만 `Content-Type: application/json`을 넣는다.
- session header는 `taglow-Session-Id`를 사용한다.
- `/api/public/event-users` body는 debug log에 출력하지 않는다.

### 5-6. Payload Mapper

Flutter `ParticipantPayloadMapper`를 TypeScript로 옮긴다.

mapper는 server DTO field name과 `api/model` domain type을 잇는 유일한 변환 지점이다. Controller/View/Store는 mapper의 입력인 raw payload를 직접 알면 안 된다.

```ts
export class ParticipantPayloadMapper {
  eventFromPayload(payload: Record<string, unknown>): ParticipantEvent;

  votePostSummaryFromPayload(
    payload: Record<string, unknown>,
    options: { eventId: string; fallbackSortOrder?: number },
  ): VotePost;

  votePostDetailFromPayload(
    payload: Record<string, unknown>,
    options: { eventId: string; votePostId: string; summary?: VotePost },
  ): VotePost;

  tagFromPayload(
    payload: Record<string, unknown>,
    options: { votePostId?: string; sessionId?: string; defaultCanDelete?: boolean },
  ): ParticipantTag;

  createTagRequestToPayload(request: CreateTagRequest): Record<string, unknown>;

  coordinateToPayload(coordinate: TagCoordinate): Record<string, unknown>;

  finalEntryToPayload(entry: FinalEntry): Record<string, unknown>;
}
```

mapper가 책임지는 것:

- 서버 field alias를 domain field로 정규화한다.
- 숫자/string 혼합 id를 domain string id로 통일한다.
- 이미지 URL 우선순위를 적용한다.
- 서버 `imageRatio`를 현재 Flutter 정책처럼 `/ 10000`으로 정규화한다.
- `locationX/locationY`, `xRatio/yRatio`, nested `coordinate`를 `TagCoordinate`로 변환한다.
- 좌표는 `0.0..1.0`으로 clamp한다.
- `isMine`, `canDelete`, session id match로 ownership을 계산한다.
- `CreateTagRequest`와 `FinalEntry`를 서버 body payload로 변환한다.

#### Event mapper

수용 field:

- id: `id`, `eventId`, `event_id`, `voteId`, `vote_id`
- title: `voteTitle`, `vote_title`, `voteName`, `vote_name`, `title`, `name`
- description: `voteDescription`, `vote_description`, `description`
- posts: `votePosts`, `vote_posts`, `posts`, `questions`

#### VotePost mapper

수용 field:

- id: `id`, `questionId`, `question_id`, `votePostId`, `vote_post_id`
- eventId: `eventId`, `event_id`, `voteId`, `vote_id`
- title: `title`, `name`
- description: `description`, `detail`, `subtitle`
- image URL 우선순위:
  1. `imageProxyUrl`
  2. `image_proxy_url`
  3. `proxiedImageUrl`
  4. `proxied_image_url`
  5. `imageUrl`
  6. `image_url`
  7. `postImageUrl`
- image ratio:
  - `imageRatio`, `image_ratio`, `aspectRatio`, `aspect_ratio`는 현재 Flutter처럼 `/ 10000` 정규화
  - `imageWidth / imageHeight`가 있으면 ratio 계산

주의:

- 서버가 `imageRatio: 7353`을 주면 프론트 ratio는 `0.7353`이다.
- 서버가 이미 `0.7353` 형태로 바꾸면 mapper 정책을 조정해야 하므로 테스트를 둔다.

#### Tag mapper

수용 field:

- id: `id`, `tagId`, `tag_id`
- votePostId: `votePostId`, `vote_post_id`, `postId`, `questionId`, `question_id`
- type: `TEXT`, `PHOTO`, `IMAGE`, `VIDEO` 등 대소문자 normalize
- text: `text`, `contentText`, `data`
- coordinate:
  - nested `coordinate`
  - or `xRatio`, `x_ratio`, `locationX`, `location_x`
  - and `yRatio`, `y_ratio`, `locationY`, `location_y`
- ownership:
  - `isMine`, `is_mine`, `canDelete`, `can_delete`
  - or session id match

#### Create tag payload

mapper output:

```ts
{
  type: request.type.toUpperCase(),
  data: request.type === 'text' ? request.text : request.media?.displayUrl,
  duration: mediaDurationSeconds,
  locationX: coordinate.xRatio,
  locationY: coordinate.yRatio
}
```

gateway request body:

```ts
{
  ...mapperPayload,
  questionId: numericOrStringPathId
}
```

### 5-7. `OpenApiParticipantService` orchestration

`OpenApiParticipantService`는 Flutter의 `OpenApiParticipantService`처럼 stable `ParticipantService` 계약을 구현하고, 내부에서만 gateway/mapper를 조합한다.

```ts
export class OpenApiParticipantService implements ParticipantService {
  constructor(
    private readonly deps: {
      gateway: ParticipantApiGateway;
      mapper: ParticipantPayloadMapper;
    },
  ) {}

  async fetchEvent(eventId: string): Promise<ParticipantEvent> {
    const payload = await this.deps.gateway.fetchEvent(eventId);
    return this.deps.mapper.eventFromPayload(payload);
  }

  async fetchVotePost(params: {
    eventId: string;
    votePostId: string;
  }): Promise<VotePost> {
    const payload = await this.deps.gateway.fetchVotePost(params);
    return this.deps.mapper.votePostDetailFromPayload(payload, params);
  }

  async createTag(params: {
    votePostId: string;
    request: CreateTagRequest;
    sessionId: string;
  }): Promise<ParticipantTag> {
    const payload = await this.deps.gateway.createTag({
      votePostId: params.votePostId,
      sessionId: params.sessionId,
      payload: this.deps.mapper.createTagRequestToPayload(params.request),
    });

    return this.deps.mapper.tagFromPayload(payload, {
      votePostId: params.votePostId,
      sessionId: params.sessionId,
    });
  }
}
```

orchestration 규칙:

- Service public method는 항상 domain type을 받거나 반환한다.
- raw payload는 service method 밖으로 반환하지 않는다.
- gateway가 실패하면 service는 controller가 처리할 수 있는 typed error 또는 domain-level error로 감싼다.
- mapper가 `FormatError`/`PayloadMappingError`를 던지면 service는 해당 API operation 이름을 붙여 진단 가능하게 한다.
- `submitFinalEntry`는 `finalEntryToPayload`를 거친 뒤 gateway로 전달하며, 개인정보 body를 log에 남기지 않는다.

---

## 6. Controller 설계

React에서 Controller는 "custom hook + store action" 조합으로 구현한다.

### 6-1. `useItemListController(eventId)`

책임:

- eventId validate
- event query 실행
- votePosts sort
- loading/error/empty state 제공
- retry 제공
- item click route helper 제공

반환 예시:

```ts
interface ItemListControllerState {
  isLoading: boolean;
  event?: ParticipantEvent;
  votePosts: VotePost[];
  errorMessage?: string;
  emptyItemsMessage?: string;
  retryActionLabel: string;
  retry(): void;
  hrefForVotePost(votePostId: string): string;
}
```

### 6-2. `useTagDraftController()`

Zustand store:

```ts
interface TagDraftState {
  text: string;
  isStaged: boolean;
  type: TagType;
  stickerSeed: number;
}
```

Derived:

- `canSubmit`: text tag, not staged, valid text
- `canDrag`: staged and text not empty

Actions:

- `updateText(value)`
- `markTextStaged(): number`
- `markMediaStaged(type): number`
- `restoreTextEditing()`
- `clearDraft()`

### 6-3. `useTaggingDetailController(args)`

책임:

- event/detail query orchestration
- local overlay snapshot load
- active tag id 관리
- stage text draft
- stage media draft extension
- save pending tag
- delete tag
- clear pending draft
- complete flow guard

반환 예시:

```ts
interface TaggingDetailControllerState {
  isLoading: boolean;
  event?: ParticipantEvent;
  votePost?: VotePost;
  tags: ParticipantTag[];
  activeTagId?: string;
  pendingMarker?: TagPendingMarker;
  hasPendingDraft: boolean;
  isSubmitting: boolean;
  errorMessage?: string;
  lastSubmittedTagId?: string;

  retry(): void;
  stageTextTag(value: string, stickerSeed: number): boolean;
  savePendingTag(coordinate?: TagCoordinate): Promise<boolean>;
  clearPendingDraft(): void;
  deleteTag(tagId: string): Promise<boolean>;
  toggleActiveTag(tagId: string): void;
}
```

### 6-4. `TaggingEngineService`

Flutter의 in-memory service를 TypeScript class로 옮긴다.

책임:

- votePost별 local overlay tags cache
- votePost별 pending draft cache
- pending marker 관리
- fallback center coordinate
- savePendingDraft에서 `ParticipantService.createTag` 호출
- save failure 시 pending marker 복구
- deleteTag 후 local overlay 제거

주의:

- React state와 별도로 service 내부 mutable map을 둘 경우, Zustand store가 snapshot을 구독하도록 action에서 명시적으로 반영한다.
- 페이지 새로고침 후 local overlay는 사라져도 MVP에서 허용된다. 지속 표시가 필요하면 session storage 정책을 별도 결정한다.

### 6-5. `useRewardController(eventId)`

상태:

- `name`
- `phoneNumber`
- `privacyConsent`
- `isSubmitting`
- `isSubmitted`
- `errorMessage`
- `canSubmit`

Actions:

- `updateName`
- `updatePhoneNumber`
- `updateConsent`
- `submit`
- `reset`

정책:

- submit 전 `InputValidator`를 사용한다.
- success 시 final route 이동은 View나 page controller가 담당한다.
- Service는 `submitFinalEntry`만 수행한다.

---

## 7. 이미지 및 좌표 설계

### 7-1. 핵심 원칙

React 구현은 `<img>` rendered bounds를 단일 기준으로 사용한다.

```text
image container
  └─ rendered image rect
      ├─ <img>
      ├─ overlay
      └─ drop target
```

이미지, overlay, drop target은 반드시 같은 rect를 사용한다.

### 7-2. Contain rect 계산

```ts
export function computeContainedImageRect(params: {
  viewportWidth: number;
  viewportHeight: number;
  imageAspectRatio: number;
}): DOMRectLike {
  const { viewportWidth, viewportHeight, imageAspectRatio } = params;
  if (viewportWidth <= 0 || viewportHeight <= 0 || imageAspectRatio <= 0) {
    return { left: 0, top: 0, width: viewportWidth, height: viewportHeight };
  }

  const viewportAspectRatio = viewportWidth / viewportHeight;
  let width: number;
  let height: number;

  if (imageAspectRatio > viewportAspectRatio) {
    width = viewportWidth;
    height = viewportWidth / imageAspectRatio;
  } else {
    height = viewportHeight;
    width = viewportHeight * imageAspectRatio;
  }

  return {
    left: (viewportWidth - width) / 2,
    top: (viewportHeight - height) / 2,
    width,
    height,
  };
}
```

### 7-3. DOM 측정

`TaggingImageArea`는 다음 값을 관리한다.

- `containerRef`
- `imgRef`
- `containerSize`
- `imageLoadState`: `idle | loading | loaded | failed`
- `naturalAspectRatio`
- `effectiveAspectRatio = naturalAspectRatio ?? votePost.imageRatio ?? 4 / 5`
- `imageRect`

`ResizeObserver`로 container size 변경을 추적한다.

### 7-4. Ratio conversion

```ts
export function pixelToRatio(params: {
  localX: number;
  localY: number;
  width: number;
  height: number;
}): TagCoordinate {
  return createTagCoordinate(params.localX / params.width, params.localY / params.height);
}

export function ratioToPixel(params: {
  coordinate: TagCoordinate;
  width: number;
  height: number;
}): { x: number; y: number } {
  return {
    x: params.coordinate.xRatio * params.width,
    y: params.coordinate.yRatio * params.height,
  };
}
```

### 7-5. Drag/drop 설계

권장 구현:

- Pointer Events 사용
- staged sticker만 draggable
- 이미지 전체는 tag creation trigger가 아님
- drag 중에는 `touch-action: none`을 sticker에 적용
- drop 시 pointer client position을 imageRect 기준 local 좌표로 변환

Pseudo flow:

```ts
function onStickerPointerDown(event: PointerEvent) {
  event.currentTarget.setPointerCapture(event.pointerId);
  beginDrag({ pointerId: event.pointerId, origin: clientPoint(event) });
}

function onStickerPointerMove(event: PointerEvent) {
  if (!isDragging(event.pointerId)) return;
  updateDragPreview(clientPoint(event));
}

async function onStickerPointerUp(event: PointerEvent) {
  if (!isDragging(event.pointerId)) return;
  const point = clientPoint(event);
  const coordinate = pointToImageRatio(point, imageRect);
  await controller.savePendingTag(coordinate);
  endDrag();
}
```

### 7-6. 기본 좌표 fallback

아래 경우 기본 좌표 `(0.5, 0.5)`를 사용한다.

- 사용자가 드래그하지 않고 완료를 누름
- imageRect 계산 전 저장 요청이 발생
- pointer drop이 이미지 영역 밖에서 끝남

단, 이미지 영역 밖 drop은 clamp하여 저장할 수 있다.

---

## 8. View 설계

### 8-1. `ParticipantHomePage`

Imports:

- `useParams`, `useNavigate`
- `useItemListController`
- `ResponsiveMobileFrame`
- `ItemCard`

Responsibilities:

- controller state render
- loading/error/empty branches
- route navigation callback

금지:

- fetch 직접 호출
- API DTO access
- localStorage 직접 호출

### 8-2. `ItemCard`

Props:

```ts
interface ItemCardProps {
  votePost: VotePost;
  onClick(): void;
}
```

Requirements:

- 전체 카드 클릭 가능
- touch target 최소 44px 이상
- title 2줄 ellipsis
- subtitle 2줄 ellipsis
- press state

### 8-3. `TaggingDetailPage`

Responsibilities:

- route params를 controller args로 전달
- `TaggingImageArea`, top bar, error banner, bottom input bar compose
- 완료 버튼 눌렀을 때 pending draft 저장 후 thanks route 이동

Flow:

```ts
if (state.hasPendingDraft) {
  const didSave = await controller.savePendingTag();
  if (!didSave) return;
  draftController.clearDraft();
}
navigate(`/e/${eventId}/thanks`);
```

### 8-4. `TaggingImageArea`

Props:

```ts
interface TaggingImageAreaProps {
  imageUrl?: string;
  imageAspectRatio?: number;
  tags: ParticipantTag[];
  activeTagId?: string;
  pendingMarker?: TagPendingMarker;
  hasPendingDraft: boolean;
  isSubmitting: boolean;
  pendingTagType: TagType;
  pendingStickerSeed: number;
  onTagClick(tag: ParticipantTag): void;
  onPendingTagDrop(coordinate: TagCoordinate): Promise<void>;
}
```

Responsibilities:

- `<img>` load/error 관리
- imageRect 계산
- overlay와 drop target을 같은 rect에 배치
- fallback image UI 표시
- pointer drag/drop coordinate 변환

### 8-5. `ParticipantTagOverlay`

Props:

- tags
- activeTagId
- pendingMarker
- imageSize
- onTagClick

Responsibilities:

- ratio -> pixel 변환
- sticker position clamp
- active/my tag opacity
- selected bubble placement
- pending marker 표시

### 8-6. `BottomTagInputBar`

Props:

- text
- draftType
- stickerSeed
- canSubmit
- isDraftStaged
- isSubmitting
- content
- onChange
- onSubmit
- onCancelDraft

Responsibilities:

- input mode/staged mode 전환
- maxLength 100
- submit disabled state
- keyboard submit
- staged sticker drag start UI

### 8-7. `ThanksPage`

Responsibilities:

- reward controller 연결
- controlled input
- consent checkbox
- submit success -> final navigate
- skip -> final navigate without API

### 8-8. `FinalPage`

Responsibilities:

- static completion content 표시
- home button -> `/e/:eventId`

---

## 9. Theme 설계

Flutter theme token을 TypeScript/CSS token으로 옮긴다.

### 9-1. `colors.ts`

```ts
export const colors = {
  background: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceMuted: '#F7F7F4',
  foreground: '#101010',
  mutedForeground: '#6F6F68',
  primary: '#FCEF3F',
  primaryStrong: '#E8D727',
  primaryForeground: '#101010',
  border: '#DEDED7',
  borderStrong: '#BDBDB4',
  tagInk: '#242424',
  tagSurface: '#EDEDE8',
  danger: '#B3261E',
  success: '#247452',
} as const;
```

### 9-2. CSS variables

```css
:root {
  --color-background: #ffffff;
  --color-surface: #ffffff;
  --color-surface-muted: #f7f7f4;
  --color-foreground: #101010;
  --color-muted-foreground: #6f6f68;
  --color-primary: #fcef3f;
  --color-primary-strong: #e8d727;
  --color-border: #deded7;
  --font-family: Pretendard, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}
```

### 9-3. Responsive mobile frame

```css
.mobileFrame {
  width: 100%;
  min-height: 100dvh;
  margin: 0 auto;
  background: var(--color-surface);
}

@media (min-width: 640px) {
  .mobileFrame {
    max-width: 520px;
    border-left: 1px solid var(--color-border);
    border-right: 1px solid var(--color-border);
    box-shadow: 0 0 18px rgb(0 0 0 / 6%);
  }
}
```

---

## 10. Utils 설계

### 10-1. `inputValidator.ts`

```ts
export const maxTagTextLength = 100;

export function validateTagText(value: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) return 'Write a short tag first.';
  if (trimmed.length > maxTagTextLength) {
    return `Tags can be up to ${maxTagTextLength} characters.`;
  }
  return undefined;
}

export function validateRewardName(value: string): string | undefined {
  return value.trim() ? undefined : 'Enter your name.';
}

export function validatePhoneNumber(value: string): string | undefined {
  const digits = value.replace(/[^0-9]/g, '');
  return digits.length >= 8 ? undefined : 'Enter a valid contact number.';
}
```

### 10-2. `localSessionStore.ts`

```ts
const participantSessionStorageKey = 'taglow.participant.sessionId.v1';

export class ParticipantSessionStore {
  private sessionId?: string;

  getOrCreateSessionId(): string {
    if (this.sessionId?.trim()) return this.sessionId;

    const stored = safeReadLocalStorage(participantSessionStorageKey);
    if (stored?.trim()) {
      this.sessionId = stored;
      return stored;
    }

    const generated = crypto.randomUUID();
    this.sessionId = generated;
    safeWriteLocalStorage(participantSessionStorageKey, generated);
    return generated;
  }

  resetSessionId(): void {
    this.sessionId = undefined;
    safeRemoveLocalStorage(participantSessionStorageKey);
  }
}
```

Policy:

- localStorage failure must not block tagging.
- no personal data in localStorage.

---

## 11. Firebase Hosting 설계

### 11-1. React 단독 운영

React가 `/e/**`를 소유하는 경우:

```json
{
  "hosting": {
    "public": "dist",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "headers": [
      {
        "source": "/",
        "headers": [
          { "key": "Cache-Control", "value": "no-cache, no-store, must-revalidate" }
        ]
      },
      {
        "source": "/e/**",
        "headers": [
          { "key": "Cache-Control", "value": "no-cache, no-store, must-revalidate" }
        ]
      },
      {
        "source": "/index.html",
        "headers": [
          { "key": "Cache-Control", "value": "no-cache, no-store, must-revalidate" }
        ]
      },
      {
        "source": "/assets/**",
        "headers": [
          { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
        ]
      }
    ],
    "rewrites": [
      { "source": "**", "destination": "/index.html" }
    ]
  }
}
```

### 11-2. React/Flutter 같은 origin 비교

권장 디렉터리:

```text
build/hosting/
├── index.html              React app
├── assets/                 React assets
└── flutter/
    ├── index.html          Flutter app built with --base-href /flutter/
    ├── main.dart.js
    └── assets/
```

Firebase rewrite:

```json
{
  "hosting": {
    "public": "build/hosting",
    "rewrites": [
      { "source": "/flutter/**", "destination": "/flutter/index.html" },
      { "source": "**", "destination": "/index.html" }
    ]
  }
}
```

Build commands:

```sh
npm run build
flutter build web --release --base-href /flutter/
```

주의:

- `/e/**`는 React가 소유한다.
- `/flutter/e/**`는 Flutter가 소유한다.
- 둘 다 같은 origin이므로 CORS allowlist는 기존 Firebase origin을 유지한다.

---

## 12. 성능 설계

### 12-1. Initial load

- Route-level code splitting을 적용한다.
- `thanks`, `final`, future media modules는 lazy import한다.
- media upload SDK는 MVP bundle에 포함하지 않는다.
- Pretendard는 WOFF2 subset으로 변환하거나 system font fallback을 우선한다.
- logo png는 크기를 줄이거나 SVG를 사용한다.
- app shell CSS는 작게 유지한다.

### 12-2. Image loading

`TaggingImageArea` image:

```tsx
<img
  ref={imgRef}
  src={imageUrl}
  alt={altText ?? ''}
  decoding="async"
  draggable={false}
  className={styles.materialImage}
  onLoad={handleImageLoad}
  onError={handleImageError}
/>
```

CSS:

```css
.materialImage {
  width: 100%;
  height: 100%;
  object-fit: contain;
  user-select: none;
  -webkit-user-drag: none;
}
```

### 12-3. Font policy

Flutter 현재 asset:

- Pretendard Regular OTF
- Medium OTF
- Bold OTF
- ExtraBold OTF

React 권장:

- WOFF2 only
- 400/700 우선
- 800/900은 실제 사용량 확인 후 추가
- `font-display: swap`

---

## 13. 테스트 전략

### 13-1. Unit tests

도구:

- Vitest

대상:

- `coordinateConverter`
- `computeContainedImageRect`
- `inputValidator`
- `participantApiGateway`
- `participantPayloadMapper`
- `openApiParticipantService`
- `localSessionStore`
- `taggingEngineService`
- `mockParticipantService`

필수 케이스:

- `imageRatio: 7353` -> `0.7353`
- `imageProxyUrl`이 `imageUrl`보다 우선
- `locationX/locationY` -> `TagCoordinate`
- nested `coordinate` -> `TagCoordinate`
- `fetchVotePost`가 questions list 또는 `{ questions: [...] }` 응답에서 target question을 선택
- `createTag` request body에 path 기반 `questionId` 보강
- `taglow-Session-Id` header가 tag 조회/생성/삭제에 포함
- body 없는 GET에 `Content-Type` 미포함
- `/api/public/event-users` debug log body redaction
- `OpenApiParticipantService`가 raw payload를 반환하지 않고 domain model만 반환
- empty text validation
- phone validation
- failed save marker recovery
- default center coordinate fallback

### 13-2. Component tests

도구:

- React Testing Library
- MSW

대상:

- `ItemCard` click
- `ParticipantHomePage` loading/error/empty/list
- `TaggingImageArea` load/error
- `ParticipantTagOverlay` ratio placement
- `BottomTagInputBar` input/staged transitions
- `ThanksPage` consent submit
- `FinalPage` home navigation

### 13-3. E2E tests

도구:

- Playwright

필수 flows:

1. `/e/11` -> first card click -> `/e/11/posts/31`
2. detail image visible pixel check
3. text tag input -> staged sticker
4. drag sticker -> tag displayed
5. complete -> thanks
6. skip -> final
7. reward submit success
8. API failure -> retry
9. image failure -> fallback

Pixel/image visibility assertion:

- image request status 200
- `<img>.complete === true`
- naturalWidth/naturalHeight > 0
- screenshot target region has non-background pixels

### 13-4. Browser matrix

Minimum manual/automated matrix:

- iOS Safari latest available test device
- Android Chrome
- Desktop Chrome
- Desktop Safari if available

Focus:

- initial loading
- image visible
- input focus/keyboard
- pointer/touch drag
- safe area bottom

---

## 14. Migration 단계

### Phase 0. React scaffold

- Vite + React + TypeScript 생성
- directory structure 생성
- router 구성
- theme tokens 이관
- Firebase local hosting path 결정

### Phase 1. Domain/API boundary

- model types 작성
- ParticipantService interface 작성
- MockParticipantService 작성
- `api/service/gateway/ParticipantApiGateway` 작성
- `api/service/gateway/FetchParticipantApiGateway` 작성
- `api/service/mapper/ParticipantPayloadMapper` 작성
- OpenApiParticipantService 작성
- gateway/mapper/service orchestration unit tests 작성
- session store 작성
- unit tests 작성

### Phase 2. Home flow

- `/e/:eventId`
- event query
- item list
- item card
- loading/error/empty
- route navigation
- component/e2e test

### Phase 3. Detail image flow

- `/e/:eventId/posts/:votePostId`
- detail query
- DOM `<img>` render
- image bounds calculation
- overlay coordinate conversion
- image fallback
- Playwright image visibility test

### Phase 4. Text tagging flow

- tag draft store
- bottom input bar
- staged sticker
- pointer drag/drop
- save pending tag
- optimistic/pending/synced/failed
- retry/save failure
- default center fallback

### Phase 5. Thanks/final

- reward controller
- thanks form
- privacy consent validation
- final route
- skip flow
- submit flow

### Phase 6. Same-origin comparison deploy

- React `/e/**`
- Flutter `/flutter/**`
- Firebase Hosting rewrite
- CORS validation
- mobile browser QA
- first tag within 30 seconds measurement

### Phase 7. Decision

React 전환 판단 기준:

- Flutter 대비 초기 로딩 체감 개선
- 문제 브라우저 이미지 안정성 개선
- 태그 좌표/드래그 안정성 확보
- Firebase same-origin 배포 확인
- MVP QA 통과

---

## 15. 리스크 및 대응

| 리스크 | 설명 | 대응 |
|---|---|---|
| Flutter UI 재현 비용 | tag sticker/input/detail layout 재구현 필요 | Flutter widget별 React 대응표로 단계 이관 |
| 드래그 구현 복잡도 | touch/pointer edge case | Pointer Events, Playwright mobile viewport, manual iOS QA |
| 좌표 오차 | CSS object-fit/viewport 변화 | imageRect 단일 기준, unit tests |
| API DTO 변경 | 서버 field 이름 변화 | mapper에 field alias 유지 |
| API 경계 누수 | View/Controller가 raw DTO나 fetch를 직접 사용 | gateway/mapper lint/search check와 code review |
| CORS 오해 | path만 바꿔도 origin은 동일 | Firebase origin 기준으로 문서화 |
| 이미지 proxy 미완성 | `imageProxyUrl` 아직 없을 수 있음 | mapper는 proxy 우선, 원본 fallback |
| 초기 bundle 증가 | 상태관리/미디어 SDK 과탑재 | media lazy import, TanStack Query/Zustand만 기본 포함 |
| 개인정보 누출 | reward body logging/storage | Service log redaction, no localStorage for PII |
| 비교 배포 혼선 | `/e/**`와 `/flutter/**` rewrite 충돌 | Firebase config e2e 확인 |

---

## 16. 구현 완료 기준

React MVP는 아래 조건을 모두 만족해야 "Flutter 대체 후보"로 본다.

- `npm run build` 성공
- `npm run test` 성공
- Playwright core flow 성공
- gateway/mapper/service boundary unit tests 성공
- `/e/11` 실제 API home 표시
- `/e/11/posts/31` 실제 S3 image 표시
- 텍스트 태그 작성/저장 성공
- 태그 좌표 ratio 유지
- thanks/final flow 성공
- Firebase Hosting same-origin 배포 성공
- 모바일 Safari/Android Chrome 수동 QA에서 이미지와 입력바 문제 없음
- 개인정보 없이 참여 완료 가능

---

## 17. 최종 기술 기준 요약

1. React 앱도 기존 Flutter의 MVC 확장 패턴을 유지한다.
2. 상태관리는 TanStack Query(server state) + Zustand(client interaction state)를 기본으로 한다.
3. View는 Controller hook만 사용한다.
4. Controller는 Service와 Store를 조합한다.
5. Service는 API DTO와 browser API를 숨긴다.
6. `ParticipantApiGateway`는 서버 endpoint/header/path id/generated client 차이를 숨긴다.
7. `ParticipantPayloadMapper`는 raw payload와 TypeScript domain model 사이의 유일한 변환 지점이다.
8. Model은 TypeScript domain type으로 고정한다.
9. 질문 이미지는 DOM `<img>`로 표시한다.
10. 태그 좌표는 `<img>` rendered bounds 기준 ratio로 저장한다.
11. Firebase Hosting은 기존 origin을 유지한다.
12. React `/e/**`, Flutter `/flutter/**` 비교 배포를 기본 전략으로 한다.
