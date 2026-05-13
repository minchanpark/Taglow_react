import type { TagCoordinate } from './tagCoordinate';
import type { TagMedia } from './tagMedia';
import type { TagType } from './tagType';

/**
 * 태그가 저장 중인지, 저장됐는지, 실패했는지 나타낸다.
 * 화면은 이 값으로 태그 상태를 표시할 수 있다.
 */
export type TagSyncStatus = 'draft' | 'pending' | 'synced' | 'failed' | 'deleted';

/**
 * 이미지 위에 붙는 태그 정보이다.
 * 좌표, 내용, 내 태그 여부를 함께 담는다.
 */
export interface ParticipantTag {
  id: string;
  votePostId: string;
  type: TagType;
  text?: string;
  media?: TagMedia;
  coordinate: TagCoordinate;
  syncStatus: TagSyncStatus;
  createdAt: string;
  isMine: boolean;
  canDelete: boolean;
  stickerSeed?: number;
}
