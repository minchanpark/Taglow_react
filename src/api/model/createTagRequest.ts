import type { TagCoordinate } from './tagCoordinate';
import type { TagMedia } from './tagMedia';
import type { TagType } from './tagType';

/**
 * 하단 입력바에서 새 태그를 만들 때 controller로 전달하는 domain 요청이다.
 * ParticipantPayloadMapper.createTagRequestToPayload가 서버 createTag body로 변환한다.
 */
export interface CreateTagRequest {
  type: TagType;
  text?: string;
  media?: TagMedia;
  coordinate: TagCoordinate;
  stickerSeed?: number;
}
