import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthSession } from '@/features/auth/AuthSessionProvider';
import { onboardingStatusKey } from '@/features/auth/onboarding-status';
import {
  currentMonthStart,
  deviceTimezone,
  type OnboardingProfileInput,
  saveOnboardingProfile,
} from './profile-data';

type SaveInput =
  | { displayName: string; isResident: false }
  | {
      displayName: string;
      isResident: true;
      residencyProgram: string;
      monthlyAmountCents: bigint;
      paymentDay: number;
    };

/**
 * Grava o perfil do onboarding. Sem retry automático (D21) e sem atualização otimista:
 * a tela só avança depois da confirmação do servidor.
 */
export function useSaveProfile() {
  const session = useAuthSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: SaveInput) => {
      if (session.userId === null) throw new Error('missing session');
      const timezone = deviceTimezone();
      const payload: OnboardingProfileInput = input.isResident
        ? { ...input, timezone, startsOn: currentMonthStart(timezone) }
        : { ...input, timezone };
      await saveOnboardingProfile(session.userId, payload);
    },
    onSuccess: () => {
      if (session.userId === null) return;
      void queryClient.invalidateQueries({ queryKey: onboardingStatusKey(session.userId) });
    },
  });
}
