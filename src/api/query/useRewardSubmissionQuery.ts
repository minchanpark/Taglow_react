import { useMutation } from '@tanstack/react-query';

import { isConsentReady, type FinalEntry } from '../model';
import { participantController } from '../controller/participantAPIProvider';

/**
 * 리워드 신청 개인정보 제출 mutation을 제공한다.
 * 개인정보는 query cache나 browser storage에 보관하지 않는다.
 */
export function useRewardSubmissionQuery() {
  const submitMutation = useMutation({
    mutationFn: (entry: FinalEntry) => {
      if (!isConsentReady(entry)) {
        throw new Error('Reward consent is required before submit.');
      }

      return participantController.submitFinalEntry(entry);
    },
  });

  return {
    errorMessage: submitMutation.isError ? '리워드 신청을 저장하지 못했습니다.' : undefined,
    isSubmitting: submitMutation.isPending,
    submitFinalEntry: submitMutation.mutateAsync,
  };
}
