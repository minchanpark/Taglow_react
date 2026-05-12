import type { TagType } from './tagType';

export interface TagMedia {
  type: Exclude<TagType, 'text'>;
  displayUrl: string;
  thumbnailUrl?: string;
  durationSeconds?: number;
}

