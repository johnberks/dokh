import { useMutation, useQuery } from '@tanstack/react-query';
import {
  completeOnboarding,
  onboardingSummaryKey,
  readOnboardingSummary,
} from './onboarding-summary';

export function useOnboardingSummary(userId: string | null, workId: string | null) {
  return useQuery({
    queryKey: onboardingSummaryKey(userId ?? '', workId ?? ''),
    queryFn: () => readOnboardingSummary(userId ?? '', workId ?? ''),
    enabled: userId != null && workId != null,
  });
}

export function useCompleteOnboarding(userId: string | null) {
  return useMutation({
    mutationFn: async () => {
      if (userId === null) throw new Error('missing session');
      await completeOnboarding(userId);
    },
  });
}
