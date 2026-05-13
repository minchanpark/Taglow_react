import type { TagCoordinate } from './tagCoordinate';
import type { TagMedia } from './tagMedia';
import type { TagType } from './tagType';

/**
 * 태그가 draft부터 synced/deleted까지 어떤 동기화 상태인지 나타낸다.
 * ParticipantTag.syncStatus와 detail View의 pending/failed 표시 정책에 연결된다.
 */
export type TagSyncStatus = 'draft' | 'pending' | 'synced' | 'failed' | 'deleted';

/**
 * 이미지 위에 표시되는 참여자 태그 domain model이다.
 * ParticipantPayloadMapper.tagFromPayload가 만들고 useTaggingDetailQuery가 View에 전달한다.
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
