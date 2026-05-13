import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { CreateTagRequest, TagCoordinate } from '../model';
import { participantController, participantSessionStore } from '../controller/participantAPIProvider';
import { participantQueryKeys } from './queryKeys';

/**
 * 상세 태깅 화면의 질문, 태그 목록, 태그 생성 mutation을 조립한다.
 * participantController와 participantSessionStore를 연결해 View에는 저장 callback과 상태만 반환한다.
 */
export function useTaggingDetailQuery(params: { eventId: string; votePostId: string }) {
  const queryClient = useQueryClient();
  const sessionId = participantSessionStore.getOrCreateSessionId();
  const votePostQuery = useQuery({
    queryFn: () => participantController.fetchVotePost(params),
    queryKey: participantQueryKeys.votePost(params.eventId, params.votePostId),
  });
  const tagsQuery = useQuery({
    queryFn: () => participantController.fetchTags({ votePostId: params.votePostId, sessionId }),
    queryKey: participantQueryKeys.tags(params.votePostId, sessionId),
  });
  const createTagMutation = useMutation({
    mutationFn: (request: CreateTagRequest) =>
      participantController.createTag({
        request,
        sessionId,
        votePostId: params.votePostId,
      }),
    onSuccess: (tag) => {
      queryClient.setQueryData(participantQueryKeys.tags(params.votePostId, sessionId), (current: unknown) => {
        return Array.isArray(current) ? [...current, tag] : [tag];
      });
    },
  });

  const currentSessionTags = (tagsQuery.data ?? []).filter((tag) => tag.isMine);

  return {
    isLoading: votePostQuery.isLoading,
    votePost: votePostQuery.data,
    tags: currentSessionTags,
    errorMessage: votePostQuery.isError ? '질문을 불러오지 못했습니다.' : undefined,
    tagErrorMessage:
      tagsQuery.isError || createTagMutation.isError ? '태그를 저장하거나 불러오지 못했습니다.' : undefined,
    isSavingTag: createTagMutation.isPending,
    retry: () => {
      void votePostQuery.refetch();
      void tagsQuery.refetch();
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
