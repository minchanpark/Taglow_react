/**
 * gateway가 서버에서 받은 원본 응답 형태이다.
 * ParticipantPayloadMapper로만 전달되며 query hook이나 View로 노출하지 않는다.
 */
export type RawPayload = Record<string, unknown> | Record<string, unknown>[];

/**
 * 서버 endpoint/header/path 정책을 숨기는 transport adapter 계약이다.
 * GatewayParticipantController가 호출하고 구현체는 FetchParticipantApiGateway이다.
 */
export interface ParticipantApiGateway {
  /**
   * 이벤트 display endpoint의 raw payload를 가져온다.
   * GatewayParticipantController.fetchEvent가 mapper.eventFromPayload로 넘긴다.
   */
  fetchEvent(eventId: string): Promise<RawPayload>;

  /**
   * 질문 목록 endpoint에서 route votePostId에 맞는 raw 질문 payload를 가져온다.
   * GatewayParticipantController.fetchVotePost가 mapper.votePostDetailFromPayload로 넘긴다.
   */
  fetchVotePost(params: { eventId: string; votePostId: string }): Promise<RawPayload>;

  /**
   * 특정 질문의 태그 raw payload를 세션 header와 함께 가져온다.
   * GatewayParticipantController.fetchTags가 mapper.tagsFromPayload로 넘긴다.
   */
  fetchTags(params: { votePostId: string; sessionId: string }): Promise<RawPayload>;

  /**
   * mapper가 만든 태그 생성 body를 서버에 전송하고 raw 생성 결과를 반환한다.
   * GatewayParticipantController.createTag가 mapper.tagFromPayload로 후처리한다.
   */
  createTag(params: {
    votePostId: string;
    sessionId: string;
    payload: Record<string, unknown>;
  }): Promise<RawPayload>;
}
