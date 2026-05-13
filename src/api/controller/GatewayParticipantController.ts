import type { CreateTagRequest, ParticipantEvent, ParticipantTag, VotePost } from '../model';
import type { ParticipantApiGateway } from '../service/gateway/ParticipantApiGateway';
import type { ParticipantPayloadMapper } from '../service/mapper/ParticipantPayloadMapper';
import type { ParticipantController } from './ParticipantController';

export class GatewayParticipantController implements ParticipantController {
  constructor(
    private readonly deps: {
      gateway: ParticipantApiGateway;
      mapper: ParticipantPayloadMapper;
    },
  ) {}

  async fetchEvent(eventId: string): Promise<ParticipantEvent> {
    const payload = await this.deps.gateway.fetchEvent(eventId);
    return this.deps.mapper.eventFromPayload(payload);
  }

  async fetchVotePost(params: { eventId: string; votePostId: string }): Promise<VotePost> {
    const payload = await this.deps.gateway.fetchVotePost(params);
    return this.deps.mapper.votePostDetailFromPayload(payload, params);
  }

  async fetchTags(params: { votePostId: string; sessionId: string }): Promise<ParticipantTag[]> {
    const payload = await this.deps.gateway.fetchTags(params);
    return this.deps.mapper.tagsFromPayload(payload, params);
  }

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
