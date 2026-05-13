import type { CreateTagRequest, ParticipantEvent, ParticipantTag, VotePost } from '../model';

export interface ParticipantController {
  fetchEvent(eventId: string): Promise<ParticipantEvent>;
  fetchVotePost(params: { eventId: string; votePostId: string }): Promise<VotePost>;
  fetchTags(params: { votePostId: string; sessionId: string }): Promise<ParticipantTag[]>;
  createTag(params: {
    votePostId: string;
    request: CreateTagRequest;
    sessionId: string;
  }): Promise<ParticipantTag>;
}
