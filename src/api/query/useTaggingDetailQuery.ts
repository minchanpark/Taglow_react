import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { isParticipantEventEnded, type CreateTagRequest, type TagCoordinate } from '../model';
import { participantController, participantSessionStore } from '../controller/participantAPIProvider';
import { participantQueryKeys } from './queryKeys';

const participationClosedMessage = '종료된 투표입니다. 더 이상 태그를 남길 수 없습니다.';

/**
 * 상세 태깅 화면에 필요한 질문, 태그, 저장 기능을 묶는다.
 * 화면은 이 hook이 주는 값과 submitTextTag만 사용하면 된다.
 */
export function useTaggingDetailQuery(params: { eventId: string; votePostId: string }) {
  const queryClient = useQueryClient();
  const sessionId = participantSessionStore.getOrCreateSessionId();
  const eventQuery = useQuery({
    queryFn: () => participantController.fetchEvent(params.eventId),
    queryKey: participantQueryKeys.event(params.eventId),
  });
  const isEventEnded = isParticipantEventEnded(eventQuery.data);
  const votePostQuery = useQuery({
    enabled: eventQuery.isSuccess && !isEventEnded,
    queryFn: () => participantController.fetchVotePost(params),
    queryKey: participantQueryKeys.votePost(params.eventId, params.votePostId),
  });
  const tagsQuery = useQuery({
    enabled: eventQuery.isSuccess && !isEventEnded,
    queryFn: () => participantController.fetchTags({ votePostId: params.votePostId, sessionId }),
    queryKey: participantQueryKeys.tags(params.votePostId, sessionId),
  });
  const createTagMutation = useMutation({
    mutationFn: (request: CreateTagRequest) => {
      if (isEventEnded) return Promise.reject(new Error(participationClosedMessage));

      return participantController.createTag({
        request,
        sessionId,
        votePostId: params.votePostId,
      });
    },
    onSuccess: (tag) => {
      queryClient.setQueryData(participantQueryKeys.tags(params.votePostId, sessionId), (current: unknown) => {
        return Array.isArray(current) ? [...current, tag] : [tag];
      });
    },
  });

  const isParticipationClosed =
    isEventEnded ||
    isAccessClosedApiError(votePostQuery.error) ||
    isAccessClosedApiError(tagsQuery.error) ||
    isAccessClosedApiError(createTagMutation.error);
  const currentSessionTags = (tagsQuery.data ?? []).filter((tag) => tag.isMine);

  return {
    isLoading: eventQuery.isLoading || votePostQuery.isLoading,
    event: eventQuery.data,
    isParticipationClosed,
    participationClosedMessage: isParticipationClosed ? participationClosedMessage : undefined,
    votePost: votePostQuery.data,
    tags: currentSessionTags,
    errorMessage:
      !isParticipationClosed && (eventQuery.isError || votePostQuery.isError)
        ? '질문을 불러오지 못했습니다.'
        : undefined,
    tagErrorMessage:
      !isParticipationClosed && (tagsQuery.isError || createTagMutation.isError)
        ? '태그를 저장하거나 불러오지 못했습니다.'
        : undefined,
    isSavingTag: createTagMutation.isPending,
    retry: () => {
      void eventQuery.refetch();
      if (eventQuery.isSuccess && !isEventEnded) {
        void votePostQuery.refetch();
        void tagsQuery.refetch();
      }
    },
    submitTextTag: (text: string, coordinate: TagCoordinate, stickerSeed?: number) =>
      createTagMutation.mutateAsync({
        coordinate,
        stickerSeed,
        text,
        type: 'text',
      }),
  };
}

function isAccessClosedApiError(error: unknown): boolean {
  if (!error || typeof error !== 'object' || !('status' in error)) return false;

  const { status } = error as { status?: unknown };
  return status === 403 || status === 410;
}
