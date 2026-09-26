import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/data/query-keys';
import { supabase } from '@/data/supabase-client';
import { useAuthSession } from '@/features/auth/AuthSessionProvider';
import type { AuthClient } from '@/features/auth/session';

/**
 * Premium ativo segundo o espelho do servidor (`subscription_entitlements`), a mesma regra que
 * as projeções usam para liberar números. A integração com RevenueCat (5.3/5.4) alimenta esse
 * espelho; a UI só decide o que mostrar — quem já pagou não vê cadeado nem selo Premium.
 */
export async function readPremiumActive(
  now: Date = new Date(),
  client: AuthClient = supabase,
): Promise<boolean> {
  const { data, error } = await client
    .from('subscription_entitlements')
    .select('is_active, expires_at')
    .maybeSingle();
  if (error) throw error;
  if (!data?.is_active) return false;
  return data.expires_at === null || new Date(data.expires_at) > now;
}

export function usePremium() {
  const { userId } = useAuthSession();
  return useQuery({
    queryKey: queryKeys.entitlement(userId ?? ''),
    queryFn: () => readPremiumActive(),
    enabled: userId !== null,
  });
}
