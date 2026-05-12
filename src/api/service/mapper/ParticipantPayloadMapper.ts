import {
  createTagCoordinate,
  normalizeTagType,
  type CreateTagRequest,
  type ParticipantEvent,
  type ParticipantTag,
  type VotePost,
} from '../../model';

export class PayloadMappingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PayloadMappingError';
  }
}

export class ParticipantPayloadMapper {
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

  votePostDetailFromPayload(payload: unknown, params: { eventId: string; votePostId: string }): VotePost {
    return this.votePostFromPayload(payload, params.eventId, 0);
  }

  tagsFromPayload(payload: unknown, context: { votePostId: string; sessionId: string }): ParticipantTag[] {
    const items = Array.isArray(payload)
      ? payload
      : arrayFromAliases(requireRecord(payload, 'tags payload'), ['tags', 'items', 'data']);

    return items.map((item) => this.tagFromPayload(item, context));
  }

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

  createTagRequestToPayload(request: CreateTagRequest): Record<string, unknown> {
    return {
      type: request.type.toUpperCase(),
      data: request.type === 'text' ? request.text : request.media?.displayUrl,
      duration: request.media?.durationSeconds ?? 0,
      locationX: request.coordinate.xRatio,
      locationY: request.coordinate.yRatio,
    };
  }

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

function requireRecord(value: unknown, label: string): Record<string, unknown> {
  const record = toRecord(value);
  if (!record) throw new PayloadMappingError(`${label} must be an object`);
  return record;
}

function toRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}

function firstPresent(record: Record<string, unknown>, aliases: string[]): unknown {
  for (const alias of aliases) {
    if (record[alias] !== undefined && record[alias] !== null) return record[alias];
  }
  return undefined;
}

function stringFromAliases(record: Record<string, unknown>, aliases: string[], fallback: string): string {
  const value = firstPresent(record, aliases);
  if (typeof value === 'string' && value.trim()) return value;
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return fallback;
}

function optionalStringFromAliases(record: Record<string, unknown>, aliases: string[]): string | undefined {
  const value = firstPresent(record, aliases);
  if (typeof value === 'string' && value.trim()) return value;
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return undefined;
}

function numberFromAliases(record: Record<string, unknown>, aliases: string[], fallback: number): number {
  const value = firstPresent(record, aliases);
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function booleanFromAliases(record: Record<string, unknown>, aliases: string[]): boolean | undefined {
  const value = firstPresent(record, aliases);
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    if (value.toLowerCase() === 'true') return true;
    if (value.toLowerCase() === 'false') return false;
  }
  return undefined;
}

function arrayFromAliases(record: Record<string, unknown>, aliases: string[]): unknown[] {
  const value = firstPresent(record, aliases);
  return Array.isArray(value) ? value : [];
}

function nestedCoordinateValue(record: Record<string, unknown>, axis: 'x' | 'y'): number {
  const coordinate = toRecord(record.coordinate);
  if (!coordinate) return 0.5;

  const aliases = axis === 'x' ? ['xRatio', 'x_ratio', 'x', 'locationX'] : ['yRatio', 'y_ratio', 'y', 'locationY'];
  return numberFromAliases(coordinate, aliases, 0.5);
}

function normalizeImageRatio(value: unknown): number | undefined {
  if (typeof value !== 'number' && typeof value !== 'string') return undefined;
  const numberValue = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(numberValue) || numberValue <= 0) return undefined;
  return numberValue > 10 ? numberValue / 10000 : numberValue;
}
