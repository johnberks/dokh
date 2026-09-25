import { supabase } from '@/data/supabase-client';
import { formatDayMonth } from '@/domain/calendar';
import type { WorkType } from '@/domain/work-type';
import type { AuthClient } from '@/features/auth/session';

export type SummaryResidency = {
  specialty: string;
  monthlyAmountCents: bigint;
  paymentDay: number;
};

export type SummaryWork = {
  type: WorkType;
  locationName: string;
  workDate: string;
  /** `HH:MM`, ou `null` quando o tipo dispensa horário e ele não foi informado. */
  startTime: string | null;
  durationMinutes: number | null;
  amountCents: bigint;
  /** `null` é "sem previsão de entrada", nunca uma data fictícia. */
  expectedOn: string | null;
};

export type OnboardingSummary = {
  residency: SummaryResidency | null;
  work: SummaryWork | null;
};

export const onboardingSummaryKey = (userId: string, workId: string) =>
  ['onboarding-summary', userId, workId] as const;

/**
 * O que foi de fato gravado no onboarding: a bolsa ativa (só para residentes) e o primeiro
 * Trabalho recém-criado. A conclusão mostra isto, não o rascunho local.
 */
export async function readOnboardingSummary(
  userId: string,
  workId: string,
  client: AuthClient = supabase,
): Promise<OnboardingSummary> {
  const [residencyResult, workResult] = await Promise.all([
    client
      .from('residencies')
      .select('specialty, monthly_amount_cents, payment_day')
      .eq('user_id', userId)
      .eq('active', true)
      .maybeSingle(),
    client
      .from('agenda_work_projection')
      .select(
        'type, location_name, work_date, start_time, duration_minutes, amount_cents, expected_on',
      )
      .eq('work_entry_id', workId)
      .maybeSingle(),
  ]);
  if (residencyResult.error) throw residencyResult.error;
  if (workResult.error) throw workResult.error;

  const residency = residencyResult.data;
  const work = workResult.data;
  return {
    residency: residency
      ? {
          specialty: residency.specialty,
          monthlyAmountCents: BigInt(residency.monthly_amount_cents),
          paymentDay: residency.payment_day,
        }
      : null,
    work:
      work?.type && work.location_name && work.work_date && work.amount_cents != null
        ? {
            type: work.type as WorkType,
            locationName: work.location_name,
            workDate: work.work_date,
            startTime: work.start_time ? work.start_time.slice(0, 5) : null,
            durationMinutes: work.duration_minutes,
            amountCents: BigInt(work.amount_cents),
            expectedOn: work.expected_on,
          }
        : null,
  };
}

/** Total e contagem consideram só os itens efetivamente cadastrados. */
export function summaryTotals(summary: OnboardingSummary): { totalCents: bigint; count: number } {
  const amounts = [summary.residency?.monthlyAmountCents, summary.work?.amountCents].filter(
    (value): value is bigint => value !== undefined,
  );
  return { totalCents: amounts.reduce((sum, value) => sum + value, 0n), count: amounts.length };
}

/** `12 SET` como no design; o ano só aparece quando difere do ano de referência. */
export function formatShortDate(date: string, referenceYear: number): string {
  return formatDayMonth(date, { year: Number(date.slice(0, 4)) !== referenceYear });
}

/** `12h`, ou `7h30` quando a duração não fecha em horas. */
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours}h` : `${hours}h${String(rest).padStart(2, '0')}`;
}

/** Linha de data do card: horário e duração só entram quando existem. */
export function workMetaLine(work: SummaryWork, referenceYear: number): string {
  return [
    formatShortDate(work.workDate, referenceYear),
    work.startTime,
    work.durationMinutes === null ? null : formatDuration(work.durationMinutes),
  ]
    .filter((part): part is string => part !== null)
    .join(' · ');
}

/**
 * Marca o onboarding como concluído. Só preenche quando ainda está vazio, para que repetir
 * a chamada (retry, tela reaberta) não reescreva a data original.
 */
export async function completeOnboarding(
  userId: string,
  client: AuthClient = supabase,
): Promise<void> {
  const { error } = await client
    .from('profiles')
    .update({ onboarding_completed_at: new Date().toISOString() })
    .eq('id', userId)
    .is('onboarding_completed_at', null);
  if (error) throw error;
}
