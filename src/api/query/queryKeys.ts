/**
 * TanStack Query cache key factory이다.
 * query hooks가 ParticipantController 호출 결과를 event/post/tag 단위로 분리 저장할 때 사용한다.
 */
export const participantQueryKeys = {
  /**
   * 이벤트 홈 데이터 cache key를 만든다.
   * useItemListQuery의 participantController.fetchEvent 호출과 연결된다.
   */
  event: (eventId: string) => ['participant-event', eventId] as const,

  /**
   * 상세 질문 데이터 cache key를 만든다.
   * useTaggingDetailQuery의 participantController.fetchVotePost 호출과 연결된다.
   */
  votePost: (eventId: string, votePostId: string) => ['participant-vote-post', eventId, votePostId] as const,

  /**
   * 세션별 태그 목록 cache key를 만든다.
   * useTaggingDetailQuery의 fetchTags/createTag cache update와 연결된다.
   */
  tags: (votePostId: string, sessionId: string) => ['participant-tags', votePostId, sessionId] as const,
};
