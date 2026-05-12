export type TagType = 'text' | 'photo' | 'video';

export function normalizeTagType(value: unknown): TagType {
  if (typeof value !== 'string') return 'text';

  const normalized = value.trim().toLowerCase();
  if (normalized === 'photo' || normalized === 'image') return 'photo';
  if (normalized === 'video') return 'video';
  return 'text';
}

