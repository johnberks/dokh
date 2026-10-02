import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthSession } from '@/features/auth/AuthSessionProvider';
import { onboardingStatusKey } from '@/features/auth/onboarding-status';
import {
  currentMonthStart,
  deviceTimezone,
  type OnboardingFocus,
  type OnboardingProfileInput,
  saveOnboardingProfile,
} from './profile-data';

type SaveInput = { displayName: string; focus: OnboardingFocus | null } & (
  | { status: 'general_practitioner' }
  | { status: 'specialist'; specialty: string }
  | {
      status: 'resident';
      specialty: string;
      monthlyAmountCents: bigint;
      paymentDay: number;
    }
);

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
      const payload: OnboardingProfileInput =
        input.status === 'resident'
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
