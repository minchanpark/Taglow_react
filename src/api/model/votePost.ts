/**
 * `/e/:eventId/posts/:votePostId` 상세 화면이 사용하는 질문 domain model이다.
 * ParticipantPayloadMapper.votePostFromPayload가 만들고 home/detail query hook이 View에 전달한다.
 */
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

/**
 * 상세 이미지 렌더링에 필요한 URL과 ratio가 있는지 판단한다.
 * detail View나 query-derived state가 image fallback 여부를 결정할 때 사용할 수 있다.
 */
export function hasImageDetail(votePost: VotePost): boolean {
  return Boolean(votePost.imageUrl?.trim() && votePost.imageRatio && votePost.imageRatio > 0);
}
