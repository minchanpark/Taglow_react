/**
 * TanStack Query가 데이터를 구분할 때 쓰는 key 모음이다.
 * 이벤트, 질문, 태그 목록을 서로 다른 cache로 저장한다.
 */
export const participantQueryKeys = {
  /**
   * 홈 이벤트 데이터용 cache key를 만든다.
   * eventId마다 다른 데이터로 저장된다.
   */
  event: (eventId: string) => ['participant-event', eventId] as const,

  /**
   * 상세 질문 데이터용 cache key를 만든다.
   * eventId와 votePostId 조합으로 구분한다.
   */
  votePost: (eventId: string, votePostId: string) => ['participant-vote-post', eventId, votePostId] as const,

  /**
   * 태그 목록용 cache key를 만든다.
   * 같은 질문이라도 sessionId가 다르면 따로 저장한다.
   */
  tags: (votePostId: string, sessionId: string) => ['participant-tags', votePostId, sessionId] as const,
};
