import { useMutation, useQuery } from '@tanstack/react-query';
import { todayInTimezone } from '@/features/work/work-schedule';
import {
  completeOnboarding,
  onboardingSummaryKey,
  readOnboardingSummary,
  readResidencyNextEntries,
} from './onboarding-summary';
import { deviceTimezone } from './profile-data';

/** `workId` nulo: residente que concluiu sem registrar um trabalho (7.7). */
export function useOnboardingSummary(userId: string | null, workId: string | null) {
  return useQuery({
    queryKey: onboardingSummaryKey(userId ?? '', workId),
    queryFn: () => readOnboardingSummary(userId ?? '', workId, todayInTimezone(deviceTimezone())),
    enabled: userId != null,
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

/** Próximas entradas da bolsa recém-gravada (payoff parcial do residente, 7.7). */
export function useResidencyNextEntries(userId: string | null, enabled: boolean) {
  return useQuery({
    queryKey: ['residency-next-entries', userId ?? ''],
    queryFn: () => readResidencyNextEntries(userId ?? '', todayInTimezone(deviceTimezone())),
    enabled: enabled && userId != null,
  });
}
