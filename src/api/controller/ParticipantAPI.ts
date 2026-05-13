import type { CreateTagRequest, ParticipantEvent, ParticipantTag, VotePost } from '../model';

/**
 * Query hooks가 사용하는 참여자 domain API 계약이다.
 * GatewayParticipantController가 구현하고 View에는 query hook을 통해 간접 노출된다.
 */
export interface ParticipantController {
  /**
   * 이벤트 홈 화면에 필요한 투표와 질문 목록을 domain model로 가져온다.
   * useItemListQuery가 호출하고 gateway.fetchEvent/mapper.eventFromPayload와 연결된다.
   */
  fetchEvent(eventId: string): Promise<ParticipantEvent>;

  /**
   * 상세 화면의 단일 질문 정보를 domain model로 가져온다.
   * useTaggingDetailQuery가 호출하고 gateway.fetchVotePost/mapper.votePostDetailFromPayload와 연결된다.
   */
  fetchVotePost(params: { eventId: string; votePostId: string }): Promise<VotePost>;

  /**
   * 현재 세션 기준 태그 목록을 domain model 배열로 가져온다.
   * useTaggingDetailQuery가 호출하고 gateway.fetchTags/mapper.tagsFromPayload와 연결된다.
   */
  fetchTags(params: { votePostId: string; sessionId: string }): Promise<ParticipantTag[]>;

  /**
   * 하단 입력바에서 만든 태그 요청을 서버에 저장하고 생성된 태그를 반환한다.
   * useTaggingDetailQuery의 mutation이 호출하고 mapper.createTagRequestToPayload와 연결된다.
   */
  createTag(params: {
    votePostId: string;
    request: CreateTagRequest;
    sessionId: string;
  }): Promise<ParticipantTag>;
}
