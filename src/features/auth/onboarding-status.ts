import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/data/supabase-client';
import type { AuthClient } from './session';

export const onboardingStatusKey = (userId: string) => ['onboarding-status', userId] as const;

/** A missing profile is a first access, not a completed onboarding. */
export async function readOnboardingCompletion(
  userId: string,
  client: AuthClient = supabase,
): Promise<boolean> {
  const { data, error } = await client
    .from('profiles')
    .select('onboarding_completed_at')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  return data?.onboarding_completed_at != null;
}

export function useOnboardingStatus(userId: string | null) {
  return useQuery({
    queryKey: onboardingStatusKey(userId ?? ''),
    queryFn: () => readOnboardingCompletion(userId ?? ''),
    enabled: userId != null,
  });
}
