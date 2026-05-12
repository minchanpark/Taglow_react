import type { ParticipantEventDisplayContent } from './participantEventDisplayContent';
import type { VotePost } from './votePost';

export interface ParticipantEvent {
  id: string;
  voteTitle: string;
  voteDescription: string;
  votePosts: VotePost[];
  status: string;
  displayContent: ParticipantEventDisplayContent;
  startedAt?: string;
  endedAt?: string;
}

