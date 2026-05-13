/**
 * 만들 수 있는 태그 종류이다.
 * 텍스트, 사진, 영상 중 하나이다.
 */
export type TagType = 'text' | 'photo' | 'video';

/**
 * 서버가 보낸 태그 종류를 앱에서 쓰는 값으로 맞춘다.
 * image는 photo로, 모르는 값은 text로 처리한다.
 */
export function normalizeTagType(value: unknown): TagType {
  if (typeof value !== 'string') return 'text';

  const normalized = value.trim().toLowerCase();
  if (normalized === 'photo' || normalized === 'image') return 'photo';
  if (normalized === 'video') return 'video';
  return 'text';
}
