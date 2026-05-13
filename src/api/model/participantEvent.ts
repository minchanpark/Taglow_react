import type { ParticipantEventDisplayContent } from './participantEventDisplayContent';
import type { VotePost } from './votePost';

/**
 * `/e/:eventId` 홈 화면이 사용하는 이벤트 domain model이다.
 * ParticipantPayloadMapper.eventFromPayload가 만들고 useItemListQuery가 View에 전달한다.
 */
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
