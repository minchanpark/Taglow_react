import { useQuery } from '@tanstack/react-query';

import { isParticipantEventEnded } from '../model';
import { participantController } from '../controller/participantAPIProvider';
import { participantQueryKeys } from './queryKeys';

/**
 * 홈 화면에 필요한 이벤트와 질문 목록 상태를 만든다.
 * 화면은 이 hook이 주는 loading/data/error만 사용하면 된다.
 */
export function useItemListQuery(eventId: string) {
  const eventQuery = useQuery({
    queryFn: () => participantController.fetchEvent(eventId),
    queryKey: participantQueryKeys.event(eventId),
  });

  const votePosts = [...(eventQuery.data?.votePosts ?? [])].sort((left, right) => left.sortOrder - right.sortOrder);
  const isParticipationClosed = isParticipantEventEnded(eventQuery.data);

  return {
    isLoading: eventQuery.isLoading,
    event: eventQuery.data,
    votePosts: isParticipationClosed ? [] : votePosts,
    isParticipationClosed,
    participationClosedMessage: isParticipationClosed ? '종료된 투표입니다. 더 이상 참여할 수 없습니다.' : undefined,
    errorMessage: eventQuery.isError ? '투표 정보를 불러오지 못했습니다.' : undefined,
    emptyItemsMessage:
      !isParticipationClosed && !eventQuery.isLoading && votePosts.length === 0 ? '열린 항목이 없습니다.' : undefined,
    retryActionLabel: '다시 시도',
    retry: eventQuery.refetch,
    hrefForVotePost: (votePostId: string) => `/e/${eventId}/posts/${votePostId}`,
  };
}
