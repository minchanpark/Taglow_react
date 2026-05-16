import type { ParticipantEventDisplayContent } from './participantEventDisplayContent';
import type { Question } from './votePost';

export type ParticipantEventStatus = 'PROGRESS' | 'END' | 'UNKNOWN';

/**
 * 홈 화면에서 쓰는 이벤트 정보이다.
 * 제목, 설명, 질문 목록을 함께 담는다.
 */
export interface ParticipantEvent {
  id: string;
  voteTitle: string;
  voteDescription: string;
  votePosts: Question[];
  questionsById: Record<string, Question>;
  status: ParticipantEventStatus;
  displayContent: ParticipantEventDisplayContent;
  startedAt?: string;
  endedAt?: string;
}

export function isParticipantEventEnded(event?: Pick<ParticipantEvent, 'status'>): boolean {
  return event?.status === 'END';
}

export function getParticipantQuestion(event: ParticipantEvent | undefined, questionId: string): Question | undefined {
  return event?.questionsById[questionId];
}

export function normalizeParticipantEventStatus(value: unknown): ParticipantEventStatus {
  if (typeof value !== 'string') return 'UNKNOWN';

  const normalized = value.trim().toUpperCase();
  if (normalized === 'PROGRESS' || normalized === 'END') return normalized;
  return 'UNKNOWN';
}
