import type {
  CreateTagRequest,
  FinalEntry,
  ParticipantTag,
  TagCoordinate,
  Question,
} from '../model';
import { getParticipantQuestion, type ParticipantEvent } from '../model';
import type { ParticipantApiGateway } from '../service/gateway/ParticipantApiGateway';
import type { ParticipantPayloadMapper } from '../service/mapper/ParticipantPayloadMapper';
import type { ParticipantAPI } from './ParticipantAPI';

/**
 * 서버 호출 담당 gateway와 데이터 변환 담당 mapper를 이어준다.
 * 화면 hook은 이 클래스를 통해 참여자 API를 사용한다.
 */
export class GatewayParticipantAPI implements ParticipantAPI {
  /**
   * gateway와 mapper를 받아서 API 객체를 만든다.
   * participantAPIProvider에서 한 번 생성해 앱 전체가 같이 쓴다.
   */
  constructor(
    private readonly deps: {
      gateway: ParticipantApiGateway;
      mapper: ParticipantPayloadMapper;
    },
  ) {}

  /**
   * 서버에서 이벤트 정보를 받아 앱에서 쓰는 Event 형태로 바꾼다.
   * 홈 화면 query에서 호출한다.
   */
  async fetchEvent(eventId: string): Promise<ParticipantEvent> {
    const payload = await this.deps.gateway.fetchEvent(eventId);
    return this.deps.mapper.eventFromPayload(payload);
  }

  /**
   * 서버에서 질문 하나를 받아 앱에서 쓰는 VotePost 형태로 바꾼다.
   * display 응답에 포함된 질문 lookup을 사용해 별도 questions 요청을 피한다.
   */
  async fetchVotePost(params: { eventId: string; votePostId: string }): Promise<Question> {
    const event = await this.fetchEvent(params.eventId);
    const question = getParticipantQuestion(event, params.votePostId);
    if (!question) throw new Error('질문을 찾을 수 없습니다.');
    return question;
  }

  /**
   * 서버에서 태그 목록을 받아 앱에서 쓰는 태그 배열로 바꾼다.
   * sessionId는 어떤 태그가 내 것인지 구분할 때 쓴다.
   */
  async fetchTags(params: { votePostId: string; sessionId: string }): Promise<ParticipantTag[]> {
    const payload = await this.deps.gateway.fetchTags(params);
    return this.deps.mapper.tagsFromPayload(payload, params);
  }

  /**
   * 새 태그를 서버에 저장하고, 저장된 결과를 화면용 태그로 바꾼다.
   * 요청 변환과 응답 변환은 mapper가 담당한다.
   */
  async createTag(params: {
    votePostId: string;
    request: CreateTagRequest;
    sessionId: string;
  }): Promise<ParticipantTag> {
    const payload = await this.deps.gateway.createTag({
      votePostId: params.votePostId,
      sessionId: params.sessionId,
      payload: this.deps.mapper.createTagRequestToPayload(params.request),
    });

    const createdTag = this.deps.mapper.tagFromPayload(payload, {
      votePostId: params.votePostId,
      sessionId: params.sessionId,
    });

    return {
      ...createdTag,
      canDelete: true,
      isMine: true,
      stickerSeed: params.request.stickerSeed ?? createdTag.stickerSeed,
    };
  }

  /**
   * 태그 좌표 수정을 서버에 저장하고 domain 태그로 돌려준다.
   */
  async updateTagPosition(params: {
    tagId: string;
    coordinate: TagCoordinate;
    sessionId: string;
  }): Promise<ParticipantTag> {
    const payload = await this.deps.gateway.updateTag({
      tagId: params.tagId,
      sessionId: params.sessionId,
      payload: this.deps.mapper.coordinateToPayload(params.coordinate),
    });

    return this.deps.mapper.tagFromPayload(payload, {
      votePostId: '',
      sessionId: params.sessionId,
    });
  }

  /**
   * 태그 삭제를 서버에 요청한다.
   */
  deleteTag(params: { tagId: string; sessionId: string }): Promise<void> {
    return this.deps.gateway.deleteTag(params);
  }

  /**
   * 리워드 신청 개인정보를 서버에 제출한다.
   * 서버 응답은 개인정보를 포함할 수 있어 보관하지 않는다.
   */
  submitFinalEntry(entry: FinalEntry): Promise<void> {
    return this.deps.gateway.submitFinalEntry({
      payload: this.deps.mapper.finalEntryToPayload(entry),
    });
  }
}

export { GatewayParticipantAPI as GatewayParticipantController };
