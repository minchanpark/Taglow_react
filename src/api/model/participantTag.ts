import type { TagCoordinate } from './tagCoordinate';
import type { TagMedia } from './tagMedia';
import type { TagType } from './tagType';

export type TagSyncStatus = 'draft' | 'pending' | 'synced' | 'failed' | 'deleted';

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

