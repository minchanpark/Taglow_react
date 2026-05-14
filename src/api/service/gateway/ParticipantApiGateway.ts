/**
 * 서버에서 온 원본 데이터 형태이다.
 * 화면에서 바로 쓰지 않고 mapper가 앱용 데이터로 바꾼다.
 */
export type RawPayload = Record<string, unknown> | Record<string, unknown>[];

/**
 * 서버와 통신하는 기능들의 약속이다.
 * 실제 fetch 코드는 FetchParticipantApiGateway에 있다.
 */
export interface ParticipantApiGateway {
  /**
   * 홈 화면용 이벤트 데이터를 서버에서 가져온다.
   * 가져온 데이터는 mapper가 Event 형태로 바꾼다.
   */
  fetchEvent(eventId: string): Promise<RawPayload>;

  /**
   * 상세 화면용 질문 데이터를 서버에서 가져온다.
   * votePostId에 맞는 질문 하나를 찾는 데 쓰인다.
   */
  fetchVotePost(params: { eventId: string; votePostId: string }): Promise<RawPayload>;

  /**
   * 특정 질문에 달린 태그들을 서버에서 가져온다.
   * sessionId는 내 태그를 구분할 때 함께 보낸다.
   */
  fetchTags(params: { votePostId: string; sessionId: string }): Promise<RawPayload>;

  /**
   * 새 태그를 서버에 저장한다.
   * 저장 결과는 mapper가 화면용 태그로 바꾼다.
   */
  createTag(params: {
    votePostId: string;
    sessionId: string;
    payload: Record<string, unknown>;
  }): Promise<RawPayload>;

  /**
   * 저장된 태그의 위치나 내용을 수정한다.
   * 서버 응답은 mapper가 다시 화면용 태그로 바꾼다.
   */
  updateTag(params: {
    tagId: string;
    sessionId: string;
    payload: Record<string, unknown>;
  }): Promise<RawPayload>;

  /**
   * 저장된 태그를 서버에서 삭제한다.
   */
  deleteTag(params: { tagId: string; sessionId: string }): Promise<void>;

  /**
   * 리워드 신청 개인정보를 서버에 제출한다.
   * 응답 body는 개인정보를 포함할 수 있어 화면 domain으로 보관하지 않는다.
   */
  submitFinalEntry(params: { payload: Record<string, unknown> }): Promise<void>;
}
