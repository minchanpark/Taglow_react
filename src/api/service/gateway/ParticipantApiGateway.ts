export type RawPayload = Record<string, unknown> | Record<string, unknown>[];

export interface ParticipantApiGateway {
  fetchEvent(eventId: string): Promise<RawPayload>;
  fetchVotePost(params: { eventId: string; votePostId: string }): Promise<RawPayload>;
  fetchTags(params: { votePostId: string; sessionId: string }): Promise<RawPayload>;
  createTag(params: {
    votePostId: string;
    sessionId: string;
    payload: Record<string, unknown>;
  }): Promise<RawPayload>;
}
