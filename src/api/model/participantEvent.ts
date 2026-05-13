import type { ParticipantEventDisplayContent } from './participantEventDisplayContent';
import type { VotePost } from './votePost';

/**
 * 홈 화면에서 쓰는 이벤트 정보이다.
 * 제목, 설명, 질문 목록을 함께 담는다.
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
