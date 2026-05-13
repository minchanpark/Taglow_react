/**
 * 참여자가 만들 수 있는 태그 종류 domain enum이다.
 * CreateTagRequest, ParticipantTag, normalizeTagType, mapper 변환에서 공유한다.
 */
export type TagType = 'text' | 'photo' | 'video';

/**
 * 서버 raw tag type alias를 domain TagType으로 정규화한다.
 * ParticipantPayloadMapper.tagFromPayload가 type/tagType field 변환에 사용한다.
 */
export function normalizeTagType(value: unknown): TagType {
  if (typeof value !== 'string') return 'text';

  const normalized = value.trim().toLowerCase();
  if (normalized === 'photo' || normalized === 'image') return 'photo';
  if (normalized === 'video') return 'video';
  return 'text';
}
