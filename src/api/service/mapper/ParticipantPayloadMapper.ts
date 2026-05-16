import {
  createTagCoordinate,
  normalizeParticipantEventStatus,
  normalizeTagType,
  type CreateTagRequest,
  type FinalEntry,
  type ParticipantEvent,
  type ParticipantTag,
  type TagCoordinate,
  type VotePost,
} from '../../model';

/**
 * 서버 데이터 모양이 예상과 다를 때 쓰는 에러이다.
 * mapper가 데이터를 바꾸기 어렵다고 판단하면 이 에러를 던진다.
 */
export class PayloadMappingError extends Error {
  /**
   * 어디에서 변환이 실패했는지 메시지로 저장한다.
   * 예: 이벤트 데이터, 태그 데이터.
   */
  constructor(message: string) {
    super(message);
    this.name = 'PayloadMappingError';
  }
}

/**
 * 서버 데이터를 앱에서 쓰기 좋은 형태로 바꾸는 클래스이다.
 * 참여자 API는 서버 응답을 받은 뒤 항상 이 mapper를 거친다.
 */
export class ParticipantPayloadMapper {
  /**
   * 서버의 이벤트 데이터를 앱의 ParticipantEvent로 바꾼다.
   * 홈 화면 질문 목록도 여기에서 함께 만든다.
   */
  eventFromPayload(payload: unknown): ParticipantEvent {
    const record = requireRecord(payload, 'event payload');
    const eventId = stringFromAliases(record, ['id', 'voteId', 'vote_id'], 'event id');
    const voteTitle = stringFromAliases(record, ['voteTitle', 'vote_title', 'voteName', 'vote_name', 'title', 'name'], 'vote title');
    const voteDescription = stringFromAliases(record, ['voteDescription', 'vote_description', 'description', 'detail'], '');
    const questions = arrayFromAliases(record, ['votePosts', 'vote_posts', 'posts', 'questions']);
    const votePosts = questions.map((item, index) => this.votePostFromPayload(item, eventId, index));

    return {
      id: eventId,
      voteTitle,
      voteDescription,
      votePosts,
      questionsById: recordById(votePosts),
      status: normalizeParticipantEventStatus(firstPresent(record, ['status'])),
      displayContent: {
        description: voteDescription,
        headline: voteTitle,
      },
      startedAt: optionalStringFromAliases(record, ['startedAt', 'started_at']),
      endedAt: optionalStringFromAliases(record, ['endedAt', 'ended_at']),
    };
  }

  /**
   * 서버의 태그 목록을 앱의 ParticipantTag 배열로 바꾼다.
   * 각 태그 변환은 tagFromPayload가 맡는다.
   */
  tagsFromPayload(payload: unknown, context: { votePostId: string; sessionId: string }): ParticipantTag[] {
    const items = Array.isArray(payload)
      ? payload
      : arrayFromAliases(requireRecord(payload, 'tags payload'), ['tags', 'items', 'data']);

    return items.map((item) => this.tagFromPayload(item, context));
  }

  /**
   * 서버의 태그 하나를 앱의 ParticipantTag로 바꾼다.
   * 좌표 보정과 내 태그 여부 계산도 여기서 한다.
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
   * 앱의 태그 생성 요청을 서버가 원하는 body로 바꾼다.
   * createTag API를 호출하기 전에 사용한다.
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
   * 태그 좌표 수정 요청을 서버 body로 바꾼다.
   */
  coordinateToPayload(coordinate: TagCoordinate): Record<string, unknown> {
    const clampedCoordinate = createTagCoordinate(coordinate.xRatio, coordinate.yRatio);
    return {
      locationX: clampedCoordinate.xRatio,
      locationY: clampedCoordinate.yRatio,
    };
  }

  /**
   * 리워드 신청 정보를 서버가 원하는 body로 바꾼다.
   * 이 값은 저장하거나 logging하지 않는다.
   */
  finalEntryToPayload(entry: FinalEntry): Record<string, unknown> {
    return {
      name: entry.name.trim(),
      phone: entry.phone.trim(),
      privacyConsent: entry.privacyConsent,
    };
  }

  /**
   * 질문 데이터를 VotePost로 바꾸는 공통 함수이다.
   * 홈 목록과 상세 화면 변환에서 같이 사용한다.
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
 * 값이 object인지 확인하고 아니면 에러를 던진다.
 * mapper가 안전하게 항목을 읽기 전에 사용한다.
 */
function requireRecord(value: unknown, label: string): Record<string, unknown> {
  const record = toRecord(value);
  if (!record) throw new PayloadMappingError(`${label} must be an object`);
  return record;
}

/**
 * 알 수 없는 값을 object처럼 읽어도 되는지 확인한다.
 * object가 아니면 undefined를 돌려준다.
 */
function toRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}

function recordById<T extends { id: string }>(items: T[]): Record<string, T> {
  return Object.fromEntries(items.map((item) => [item.id, item]));
}

/**
 * 여러 이름 중 실제로 값이 있는 첫 번째 것을 찾는다.
 * 서버가 이름을 다르게 줄 때를 대비한 helper이다.
 */
function firstPresent(record: Record<string, unknown>, aliases: string[]): unknown {
  for (const alias of aliases) {
    if (record[alias] !== undefined && record[alias] !== null) return record[alias];
  }
  return undefined;
}

/**
 * 여러 후보 이름에서 문자열 값을 꺼낸다.
 * 값이 없으면 fallback을 사용한다.
 */
function stringFromAliases(record: Record<string, unknown>, aliases: string[], fallback: string): string {
  const value = firstPresent(record, aliases);
  if (typeof value === 'string' && value.trim()) return value;
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return fallback;
}

/**
 * 여러 후보 이름에서 선택 문자열 값을 꺼낸다.
 * 값이 없으면 undefined를 돌려준다.
 */
function optionalStringFromAliases(record: Record<string, unknown>, aliases: string[]): string | undefined {
  const value = firstPresent(record, aliases);
  if (typeof value === 'string' && value.trim()) return value;
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return undefined;
}

/**
 * 여러 후보 이름에서 숫자 값을 꺼낸다.
 * 숫자로 바꿀 수 없으면 fallback을 사용한다.
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
 * 여러 후보 이름에서 true/false 값을 꺼낸다.
 * 문자열 'true', 'false'도 처리한다.
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
 * 여러 후보 이름에서 배열 값을 꺼낸다.
 * 배열이 없으면 빈 배열을 돌려준다.
 */
function arrayFromAliases(record: Record<string, unknown>, aliases: string[]): unknown[] {
  const value = firstPresent(record, aliases);
  return Array.isArray(value) ? value : [];
}

/**
 * coordinate 안에 들어있는 x 또는 y 값을 읽는다.
 * 바깥쪽에 좌표가 없을 때 대신 사용한다.
 */
function nestedCoordinateValue(record: Record<string, unknown>, axis: 'x' | 'y'): number {
  const coordinate = toRecord(record.coordinate);
  if (!coordinate) return 0.5;

  const aliases = axis === 'x' ? ['xRatio', 'x_ratio', 'x', 'locationX'] : ['yRatio', 'y_ratio', 'y', 'locationY'];
  return numberFromAliases(coordinate, aliases, 0.5);
}

/**
 * 서버의 이미지 비율 값을 앱에서 쓰는 비율로 바꾼다.
 * 예를 들어 7353은 0.7353으로 바꾼다.
 */
function normalizeImageRatio(value: unknown): number | undefined {
  if (typeof value !== 'number' && typeof value !== 'string') return undefined;
  const numberValue = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(numberValue) || numberValue <= 0) return undefined;
  return numberValue > 10 ? numberValue / 10000 : numberValue;
}
