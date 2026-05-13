import type { TagType } from './tagType';

/**
 * 사진/영상 태그가 표시할 media metadata이다.
 * CreateTagRequest.media와 ParticipantTag.media에서 사용되며 MVP에서는 text tag 이후 확장 지점이다.
 */
export interface TagMedia {
  type: Exclude<TagType, 'text'>;
  displayUrl: string;
  thumbnailUrl?: string;
  durationSeconds?: number;
}
