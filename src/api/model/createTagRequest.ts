import type { TagCoordinate } from './tagCoordinate';
import type { TagMedia } from './tagMedia';
import type { TagType } from './tagType';

/**
 * 새 태그를 만들 때 앱 안에서 쓰는 요청 형태이다.
 * mapper가 이 값을 서버가 원하는 body로 바꾼다.
 */
export interface CreateTagRequest {
  type: TagType;
  text?: string;
  media?: TagMedia;
  coordinate: TagCoordinate;
  stickerSeed?: number;
}
