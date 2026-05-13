import type { CreateTagRequest, ParticipantEvent, ParticipantTag, VotePost } from '../model';

/**
 * 화면 hook이 사용하는 참여자 API 약속이다.
 * 실제 구현은 GatewayParticipantController가 맡는다.
 */
export interface ParticipantAPI {
  /**
   * 홈 화면에 필요한 이벤트와 질문 목록을 가져온다.
   * useItemListQuery에서 호출한다.
   */
  fetchEvent(eventId: string): Promise<ParticipantEvent>;

  /**
   * 상세 화면에 보여줄 질문 하나를 가져온다.
   * useTaggingDetailQuery에서 호출한다.
   */
  fetchVotePost(params: { eventId: string; votePostId: string }): Promise<VotePost>;

  /**
   * 현재 참여자가 볼 태그 목록을 가져온다.
   * sessionId로 내 태그인지 판단할 수 있게 한다.
   */
  fetchTags(params: { votePostId: string; sessionId: string }): Promise<ParticipantTag[]>;

  /**
   * 사용자가 만든 태그를 서버에 저장한다.
   * 저장된 태그를 화면에서 바로 쓸 수 있는 형태로 돌려준다.
   */
  createTag(params: {
    votePostId: string;
    request: CreateTagRequest;
    sessionId: string;
  }): Promise<ParticipantTag>;
}
