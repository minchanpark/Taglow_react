import type {
  CreateTagRequest,
  FinalEntry,
  ParticipantEvent,
  ParticipantTag,
  TagCoordinate,
  Question,
} from '../model';

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
   * display 응답의 질문 lookup에서 꺼내 별도 질문 목록 요청을 피한다.
   */
  fetchVotePost(params: { eventId: string; votePostId: string }): Promise<Question>;

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

  /**
   * 사용자가 만든 태그의 위치를 서버에 반영한다.
   */
  updateTagPosition(params: {
    tagId: string;
    coordinate: TagCoordinate;
    sessionId: string;
  }): Promise<ParticipantTag>;

  /**
   * 사용자가 만든 태그를 삭제한다.
   */
  deleteTag(params: { tagId: string; sessionId: string }): Promise<void>;

  /**
   * 선택 리워드 신청 개인정보를 서버에 제출한다.
   * 개인정보 응답은 저장하지 않는다.
   */
  submitFinalEntry(entry: FinalEntry): Promise<void>;
}
