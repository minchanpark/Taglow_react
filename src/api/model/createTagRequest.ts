import type { TagCoordinate } from './tagCoordinate';
import type { TagMedia } from './tagMedia';
import type { TagType } from './tagType';

export interface CreateTagRequest {
  type: TagType;
  text?: string;
  media?: TagMedia;
  coordinate: TagCoordinate;
  stickerSeed?: number;
}

