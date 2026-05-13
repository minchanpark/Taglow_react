import type { TagType } from './tagType';

/**
 * 사진이나 영상 태그에 필요한 정보이다.
 * 현재 텍스트 태그 이후 확장할 때 사용한다.
 */
export interface TagMedia {
  type: Exclude<TagType, 'text'>;
  displayUrl: string;
  thumbnailUrl?: string;
  durationSeconds?: number;
}
