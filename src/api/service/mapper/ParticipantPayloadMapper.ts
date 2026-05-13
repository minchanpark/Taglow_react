import {
  createTagCoordinate,
  normalizeTagType,
  type CreateTagRequest,
  type ParticipantEvent,
  type ParticipantTag,
  type VotePost,
} from '../../model';

/**
 * raw payload가 기대한 shape가 아닐 때 mapper 경계에서 던지는 error이다.
 * ParticipantPayloadMapper의 requireRecord 검증 실패가 controller/query error state로 이어진다.
 */
export class PayloadMappingError extends Error {
  /**
   * 어떤 payload 변환 단계에서 실패했는지 message로 보존한다.
   * requireRecord가 event/tag/vote post label을 넣어 생성한다.
   */
  constructor(message: string) {
    super(message);
    this.name = 'PayloadMappingError';
  }
}

/**
 * 서버 raw payload와 api/model domain type 사이의 유일한 변환 지점이다.
 * GatewayParticipantController가 모든 gateway 응답과 create request 변환에 사용한다.
 */
export class ParticipantPayloadMapper {
  /**
   * 이벤트 display payload를 ParticipantEvent로 정규화한다.
   * GatewayParticipantController.fetchEvent가 호출하고 내부에서 votePostFromPayload를 사용한다.
   */
  eventFromPayload(payload: unknown): ParticipantEvent {
    const record = requireRecord(payload, 'event payload');
    const eventId = stringFromAliases(record, ['id', 'voteId', 'vote_id'], 'event id');
    const voteTitle = stringFromAliases(record, ['voteTitle', 'vote_title', 'voteName', 'vote_name', 'title', 'name'], 'vote title');
    const voteDescription = stringFromAliases(record, ['voteDescription', 'vote_description', 'description', 'detail'], '');
    const questions = arrayFromAliases(record, ['votePosts', 'vote_posts', 'posts', 'questions']);

    return {
      id: eventId,
      voteTitle,
      voteDescription,
      votePosts: questions.map((item, index) => this.votePostFromPayload(item, eventId, index)),
      status: stringFromAliases(record, ['status'], 'UNKNOWN'),
      displayContent: {
        description: voteDescription,
        headline: voteTitle,
      },
      startedAt: optionalStringFromAliases(record, ['startedAt', 'started_at']),
      endedAt: optionalStringFromAliases(record, ['endedAt', 'ended_at']),
    };
  }

  /**
   * 상세 질문 payload를 VotePost domain model로 정규화한다.
   * GatewayParticipantController.fetchVotePost가 호출하며 route eventId를 domain eventId로 유지한다.
   */
  votePostDetailFromPayload(payload: unknown, params: { eventId: string; votePostId: string }): VotePost {
    return this.votePostFromPayload(payload, params.eventId, 0);
  }

  /**
   * 태그 목록 payload를 ParticipantTag 배열로 정규화한다.
   * GatewayParticipantController.fetchTags가 호출하고 tagFromPayload에 session context를 전달한다.
   */
  tagsFromPayload(payload: unknown, context: { votePostId: string; sessionId: string }): ParticipantTag[] {
    const items = Array.isArray(payload)
      ? payload
      : arrayFromAliases(requireRecord(payload, 'tags payload'), ['tags', 'items', 'data']);

    return items.map((item) => this.tagFromPayload(item, context));
  }

  /**
   * 단일 tag payload를 ownership과 좌표가 정규화된 ParticipantTag로 변환한다.
   * tagsFromPayload와 GatewayParticipantController.createTag 후처리에서 함께 사용된다.
   */
  tagFromPayload(payload: unknown, context: { votePostId: string; sessionId: string }): ParticipantTag {
    const record = requireRecord(payload, 'tag payload');
    const id = stringFromAliases(record, ['id', 'tagId', 'tag_id'], `local-${Date.now()}`);
    const votePostId = stringFromAliases(record, ['votePostId', 'vote_post_id', 'postId', 'questionId', 'question_id'], context.votePostId);
    const type = normalizeTagType(firstPresent(record, ['type', 'tagType', 'tag_type']));
    const textValue = firstPresent(record, ['text', 'data', 'content', 'label']);
    const ownerSessionId = optionalStringFromAliases(record, ['sessionId', 'session_id', 'participantSessionId']);
    const explicitMine = booleanFromAliases(record, ['isMine', 'is_mine', 'mine']);

    return {
      id,
      votePostId,
      type,
      text: typeof textValue === 'string' ? textValue : undefined,
      coordinate: createTagCoordinate(
        numberFromAliases(record, ['xRatio', 'x_ratio', 'locationX', 'location_x'], nestedCoordinateValue(record, 'x')),
        numberFromAliases(record, ['yRatio', 'y_ratio', 'locationY', 'location_y'], nestedCoordinateValue(record, 'y')),
      ),
      syncStatus: 'synced',
      createdAt: stringFromAliases(record, ['createdAt', 'created_at'], new Date().toISOString()),
      isMine: explicitMine ?? Boolean(ownerSessionId && ownerSessionId === context.sessionId),
      canDelete: booleanFromAliases(record, ['canDelete', 'can_delete']) ?? explicitMine ?? false,
      stickerSeed: numberFromAliases(record, ['stickerSeed', 'sticker_seed'], Number(id) || 0),
    };
  }

  /**
   * CreateTagRequest domain model을 서버 createTag body payload로 변환한다.
   * GatewayParticipantController.createTag가 FetchParticipantApiGateway.createTag에 넘긴다.
   */
  createTagRequestToPayload(request: CreateTagRequest): Record<string, unknown> {
    return {
      type: request.type.toUpperCase(),
      data: request.type === 'text' ? request.text : request.media?.displayUrl,
      duration: request.media?.durationSeconds ?? 0,
      locationX: request.coordinate.xRatio,
      locationY: request.coordinate.yRatio,
    };
  }

  /**
   * event/detail 양쪽 질문 payload를 VotePost로 변환하는 공통 내부 mapper이다.
   * eventFromPayload와 votePostDetailFromPayload가 field alias 정규화를 위해 공유한다.
   */
  private votePostFromPayload(payload: unknown, eventId: string, index: number): VotePost {
    const outerRecord = requireRecord(payload, 'vote post payload');
    const questionRecord = toRecord(outerRecord.question) ?? outerRecord;
    const tags = arrayFromAliases(outerRecord, ['tags']);
    const id = stringFromAliases(questionRecord, ['id', 'questionId', 'question_id', 'votePostId', 'vote_post_id'], '0');
    const description = stringFromAliases(questionRecord, ['description', 'detail', 'questionDescription', 'question_description'], '');

    return {
      id,
      eventId,
      title: stringFromAliases(questionRecord, ['title', 'name', 'questionTitle', 'question_title'], `질문 ${index + 1}`),
      description,
      imageUrl: optionalStringFromAliases(questionRecord, [
        'imageProxyUrl',
        'image_proxy_url',
        'proxiedImageUrl',
        'proxied_image_url',
        'imageUrl',
        'image_url',
      ]),
      imageRatio: normalizeImageRatio(firstPresent(questionRecord, ['imageRatio', 'image_ratio', 'ratio'])),
      thumbnailUrl: optionalStringFromAliases(questionRecord, ['thumbnailUrl', 'thumbnail_url']),
      altText: description || optionalStringFromAliases(questionRecord, ['altText', 'alt_text']),
      visualKey: stringFromAliases(questionRecord, ['visualKey', 'visual_key'], id),
      tagCount: numberFromAliases(questionRecord, ['tagCount', 'tag_count'], tags.length),
      sortOrder: numberFromAliases(questionRecord, ['sortOrder', 'sort_order', 'order'], index),
    };
  }
}

/**
 * mapper 입력이 object payload인지 검증하고 record로 좁힌다.
 * 모든 public mapper method가 raw payload 진입점에서 사용한다.
 */
function requireRecord(value: unknown, label: string): Record<string, unknown> {
  const record = toRecord(value);
  if (!record) throw new PayloadMappingError(`${label} must be an object`);
  return record;
}

/**
 * unknown 값을 mapper가 탐색 가능한 record로 좁히는 helper이다.
 * requireRecord, votePostFromPayload, nestedCoordinateValue가 공유한다.
 */
function toRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}

/**
 * 여러 서버 field alias 중 첫 번째 유효 값을 찾는다.
 * string/number/boolean/array alias helper들이 공통으로 사용한다.
 */
function firstPresent(record: Record<string, unknown>, aliases: string[]): unknown {
  for (const alias of aliases) {
    if (record[alias] !== undefined && record[alias] !== null) return record[alias];
  }
  return undefined;
}

/**
 * alias 값에서 필수 문자열 domain field를 만든다.
 * eventFromPayload, tagFromPayload, votePostFromPayload가 id/title fallback에 사용한다.
 */
function stringFromAliases(record: Record<string, unknown>, aliases: string[], fallback: string): string {
  const value = firstPresent(record, aliases);
  if (typeof value === 'string' && value.trim()) return value;
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return fallback;
}

/**
 * alias 값에서 optional 문자열 domain field를 만든다.
 * image URL, thumbnail, 날짜처럼 없을 수 있는 field 변환에 사용한다.
 */
function optionalStringFromAliases(record: Record<string, unknown>, aliases: string[]): string | undefined {
  const value = firstPresent(record, aliases);
  if (typeof value === 'string' && value.trim()) return value;
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return undefined;
}

/**
 * alias 값에서 숫자 domain field를 만든다.
 * tag coordinate, sortOrder, tagCount, stickerSeed 변환에서 사용한다.
 */
function numberFromAliases(record: Record<string, unknown>, aliases: string[], fallback: number): number {
  const value = firstPresent(record, aliases);
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

/**
 * alias 값에서 boolean domain field를 만든다.
 * tagFromPayload가 isMine/canDelete 판단에 사용한다.
 */
function booleanFromAliases(record: Record<string, unknown>, aliases: string[]): boolean | undefined {
  const value = firstPresent(record, aliases);
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    if (value.toLowerCase() === 'true') return true;
    if (value.toLowerCase() === 'false') return false;
  }
  return undefined;
}

/**
 * alias 값에서 배열 payload를 가져온다.
 * eventFromPayload, tagsFromPayload, votePostFromPayload가 list fallback에 사용한다.
 */
function arrayFromAliases(record: Record<string, unknown>, aliases: string[]): unknown[] {
  const value = firstPresent(record, aliases);
  return Array.isArray(value) ? value : [];
}

/**
 * nested coordinate payload에서 x/y ratio fallback을 읽는다.
 * tagFromPayload가 top-level coordinate alias를 찾지 못했을 때 사용한다.
 */
function nestedCoordinateValue(record: Record<string, unknown>, axis: 'x' | 'y'): number {
  const coordinate = toRecord(record.coordinate);
  if (!coordinate) return 0.5;

  const aliases = axis === 'x' ? ['xRatio', 'x_ratio', 'x', 'locationX'] : ['yRatio', 'y_ratio', 'y', 'locationY'];
  return numberFromAliases(coordinate, aliases, 0.5);
}

/**
 * 서버 imageRatio를 domain ratio 값으로 정규화한다.
 * votePostFromPayload가 7353 같은 정수형 ratio를 0.7353으로 변환할 때 사용한다.
 */
function normalizeImageRatio(value: unknown): number | undefined {
  if (typeof value !== 'number' && typeof value !== 'string') return undefined;
  const numberValue = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(numberValue) || numberValue <= 0) return undefined;
  return numberValue > 10 ? numberValue / 10000 : numberValue;
}
