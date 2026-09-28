import { getCalendars } from 'expo-localization';
import { supabase } from '@/data/supabase-client';
import type { AuthClient } from '@/features/auth/session';

/** Fuso do aparelho; o servidor usa este valor para saber o "hoje" da pessoa. */
export const FALLBACK_TIMEZONE = 'America/Sao_Paulo';

export function deviceTimezone(): string {
  return getCalendars()[0]?.timeZone ?? FALLBACK_TIMEZONE;
}

export type OnboardingProfileInput = {
  displayName: string;
  timezone: string;
} & (
  | { status: 'general_practitioner' }
  | { status: 'specialist'; specialty: string }
  | {
      status: 'resident';
      specialty: string;
      monthlyAmountCents: bigint;
      paymentDay: number;
      /** Primeiro dia do mês em que a bolsa começa a contar (`YYYY-MM-DD`). */
      startsOn: string;
    }
);

/**
 * Primeiro dia do mês corrente no fuso informado.
 * Se o `Intl` do aparelho não aceitar `timeZone`, usa o fuso local — que é justamente
 * o fuso do aparelho de onde `timezone` veio.
 */
export function currentMonthStart(timezone: string, now: Date = new Date()): string {
  try {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(now);
    return `${parts.slice(0, 7)}-01`;
  } catch {
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}-01`;
  }
}

/**
 * Grava o perfil com a situação escolhida e, só para residentes, cria a bolsa recorrente Free
 * (RPC da 3.9). Generalista não tem especialidade; especialista tem, mas não tem bolsa.
 * Trocar a situação depois de voltar no fluxo é seguro: sair de `resident` encerra a bolsa
 * no servidor (11.10). Não marca `onboarding_completed_at`: isso pertence à 7.5.
 */
export async function saveOnboardingProfile(
  userId: string,
  input: OnboardingProfileInput,
  client: AuthClient = supabase,
): Promise<void> {
  const { error: profileError } = await client.from('profiles').upsert(
    {
      id: userId,
      display_name: input.displayName.trim(),
      professional_status: input.status,
      specialty: input.status === 'general_practitioner' ? null : input.specialty.trim(),
      timezone: input.timezone,
    },
    { onConflict: 'id' },
  );
  if (profileError) throw profileError;

  if (input.status !== 'resident') return;

  const { error: residencyError } = await client.rpc('create_or_update_residency', {
    p_residency_id: null as unknown as string,
    p_specialty: input.specialty.trim(),
    p_institution: null as unknown as string,
    p_level_label: null as unknown as string,
    p_starts_on: input.startsOn,
    p_expected_ends_on: null as unknown as string,
    // Centavos cabem com folga em number; bigint não é serializável em JSON.
    p_monthly_amount_cents: Number(input.monthlyAmountCents),
    p_payment_day: input.paymentDay,
  });
  if (residencyError) throw residencyError;
}
