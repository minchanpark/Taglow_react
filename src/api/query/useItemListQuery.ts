import { useQuery } from '@tanstack/react-query';

import { participantController } from '../controller/participantAPIProvider';
import { participantQueryKeys } from './queryKeys';

/**
 * 홈 화면이 사용할 이벤트/질문 목록 query 상태를 조립한다.
 * participantController.fetchEvent와 participantQueryKeys.event를 연결해 View에는 derived state만 반환한다.
 */
export function useItemListQuery(eventId: string) {
  const eventQuery = useQuery({
    queryFn: () => participantController.fetchEvent(eventId),
    queryKey: participantQueryKeys.event(eventId),
  });

  const votePosts = [...(eventQuery.data?.votePosts ?? [])].sort((left, right) => left.sortOrder - right.sortOrder);

  return {
    isLoading: eventQuery.isLoading,
    event: eventQuery.data,
    votePosts,
    errorMessage: eventQuery.isError ? '투표 정보를 불러오지 못했습니다.' : undefined,
    emptyItemsMessage: !eventQuery.isLoading && votePosts.length === 0 ? '열린 항목이 없습니다.' : undefined,
    retryActionLabel: '다시 시도',
    retry: eventQuery.refetch,
    hrefForVotePost: (votePostId: string) => `/e/${eventId}/posts/${votePostId}`,
  };
}
