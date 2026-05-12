export interface VotePost {
  id: string;
  eventId: string;
  title: string;
  description: string;
  imageUrl?: string;
  imageRatio?: number;
  thumbnailUrl?: string;
  altText?: string;
  visualKey: string;
  tagCount: number;
  sortOrder: number;
}

export function hasImageDetail(votePost: VotePost): boolean {
  return Boolean(votePost.imageUrl?.trim() && votePost.imageRatio && votePost.imageRatio > 0);
}

