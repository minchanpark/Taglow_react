import type { CreateTagRequest, ParticipantEvent, ParticipantTag, VotePost } from '../model';
import type { ParticipantApiGateway } from '../service/gateway/ParticipantApiGateway';
import type { ParticipantPayloadMapper } from '../service/mapper/ParticipantPayloadMapper';
import type { ParticipantController } from './ParticipantAPI';

/**
 * Gateway와 mapper를 조합해 query hook에 domain API를 제공하는 facade이다.
 * endpoint/header는 ParticipantApiGateway에, payload 정규화는 ParticipantPayloadMapper에 위임한다.
 */
export class GatewayParticipantController implements ParticipantController {
  /**
   * transport adapter와 payload mapper를 주입받아 API 경계를 조립한다.
   * participantControllerProvider가 실제 singleton을 생성한다.
   */
  constructor(
    private readonly deps: {
      gateway: ParticipantApiGateway;
      mapper: ParticipantPayloadMapper;
    },
  ) {}

  /**
   * 이벤트 display raw payload를 ParticipantEvent로 변환해 반환한다.
   * useItemListQuery -> gateway.fetchEvent -> mapper.eventFromPayload 흐름으로 연결된다.
   */
  async fetchEvent(eventId: string): Promise<ParticipantEvent> {
    const payload = await this.deps.gateway.fetchEvent(eventId);
    return this.deps.mapper.eventFromPayload(payload);
  }

  /**
   * 질문 raw payload를 상세 VotePost domain model로 변환한다.
   * useTaggingDetailQuery가 호출하며 route eventId/votePostId는 gateway에서 path로 해석된다.
   */
  async fetchVotePost(params: { eventId: string; votePostId: string }): Promise<VotePost> {
    const payload = await this.deps.gateway.fetchVotePost(params);
    return this.deps.mapper.votePostDetailFromPayload(payload, params);
  }

  /**
   * 서버 태그 payload를 현재 세션 문맥으로 ParticipantTag 배열에 매핑한다.
   * mapper.tagsFromPayload가 ownership/isMine 판단에 sessionId를 사용한다.
   */
  async fetchTags(params: { votePostId: string; sessionId: string }): Promise<ParticipantTag[]> {
    const payload = await this.deps.gateway.fetchTags(params);
    return this.deps.mapper.tagsFromPayload(payload, params);
  }

  /**
   * CreateTagRequest를 서버 body로 바꿔 저장하고 생성 태그를 domain model로 반환한다.
   * gateway.createTag, mapper.createTagRequestToPayload, mapper.tagFromPayload를 순서대로 조합한다.
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
