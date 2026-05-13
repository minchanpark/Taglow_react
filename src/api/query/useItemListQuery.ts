import { useQuery } from '@tanstack/react-query';

import { participantController } from '../controller/participantControllerProvider';
import { participantQueryKeys } from './queryKeys';

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
