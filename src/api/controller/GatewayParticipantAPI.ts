import type { CreateTagRequest, ParticipantEvent, ParticipantTag, VotePost } from '../model';
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
   * 상세 화면 query에서 호출한다.
   */
  async fetchVotePost(params: { eventId: string; votePostId: string }): Promise<VotePost> {
    const payload = await this.deps.gateway.fetchVotePost(params);
    return this.deps.mapper.votePostDetailFromPayload(payload, params);
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
    };
  }
}
