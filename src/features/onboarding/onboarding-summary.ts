import { supabase } from '@/data/supabase-client';
import { formatDayMonth } from '@/domain/calendar';
import type { WorkType } from '@/domain/work-type';
import type { AuthClient } from '@/features/auth/session';

export type SummaryResidency = {
  specialty: string;
  monthlyAmountCents: bigint;
  paymentDay: number;
  /** Próxima entrada real gerada pela bolsa (hoje ou depois); `null` se ainda não houver. */
  nextExpectedOn: string | null;
};

/** Estado da entrada do Trabalho, derivado no servidor (domain-model › Recebível). */
export type SummaryReceipt = 'received' | 'pending' | 'scheduled' | 'undated';

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
  receipt: SummaryReceipt;
};

export type OnboardingSummary = {
  residency: SummaryResidency | null;
  work: SummaryWork | null;
};

export const onboardingSummaryKey = (userId: string, workId: string | null) =>
  ['onboarding-summary', userId, workId ?? 'none'] as const;

function receiptOf(status: string | null, expectedOn: string | null): SummaryReceipt {
  if (status === 'received') return 'received';
  if (expectedOn === null) return 'undated';
  return status === 'confirmation_pending' ? 'pending' : 'scheduled';
}

/**
 * O que foi de fato gravado no onboarding: a bolsa ativa (só para residentes), sua próxima
 * entrada real e o primeiro Trabalho, quando houver — o residente pode concluir sem ele (7.7).
 * A conclusão mostra isto, não o rascunho local.
 */
export async function readOnboardingSummary(
  userId: string,
  workId: string | null,
  today: string,
  client: AuthClient = supabase,
): Promise<OnboardingSummary> {
  const [residencyResult, nextResult, workResult] = await Promise.all([
    client
      .from('residencies')
      .select('specialty, monthly_amount_cents, payment_day')
      .eq('user_id', userId)
      .eq('active', true)
      .maybeSingle(),
    client
      .from('receivable_projection')
      .select('expected_on')
      .eq('user_id', userId)
      .not('residency_id', 'is', null)
      .is('invalidated_at', null)
      .gte('expected_on', today)
      .order('expected_on', { ascending: true })
      .limit(1)
      .maybeSingle(),
    workId === null
      ? Promise.resolve({ data: null, error: null })
      : client
          .from('agenda_work_projection')
          .select(
            'type, location_name, work_date, start_time, duration_minutes, amount_cents, expected_on, receipt_status',
          )
          .eq('work_entry_id', workId)
          .maybeSingle(),
  ]);
  if (residencyResult.error) throw residencyResult.error;
  if (nextResult.error) throw nextResult.error;
  if (workResult.error) throw workResult.error;

  const residency = residencyResult.data;
  const work = workResult.data;
  return {
    residency: residency
      ? {
          specialty: residency.specialty,
          monthlyAmountCents: BigInt(residency.monthly_amount_cents),
          paymentDay: residency.payment_day,
          nextExpectedOn: nextResult.data?.expected_on ?? null,
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
            receipt: receiptOf(work.receipt_status, work.expected_on),
          }
        : null,
  };
}

export type SummaryTotals = {
  /** Previsto por mês de entrada (caixa), do mais próximo ao mais distante. `YYYY-MM`. */
  months: { month: string; totalCents: bigint }[];
  /** Data prevista já passou e ninguém confirmou: pendência, não erro. */
  pendingCents: bigint;
  receivedCents: bigint;
  /** Itens cadastrados (residência, trabalho), inclusive os sem previsão. */
  count: number;
};

/**
 * Totais por **caixa** (7.7): cada valor conta no mês em que deve entrar. Recebido e pendente
 * ficam separados, e o que não tem previsão fica fora de qualquer total — nunca se soma a bolsa
 * mensal com um plantão que entra em outro mês.
 */
export function summaryTotals(summary: OnboardingSummary): SummaryTotals {
  const byMonth = new Map<string, bigint>();
  const addToMonth = (date: string, cents: bigint) => {
    const month = date.slice(0, 7);
    byMonth.set(month, (byMonth.get(month) ?? 0n) + cents);
  };
  let pendingCents = 0n;
  let receivedCents = 0n;

  const { residency, work } = summary;
  if (residency?.nextExpectedOn) addToMonth(residency.nextExpectedOn, residency.monthlyAmountCents);
  if (work?.receipt === 'received') receivedCents += work.amountCents;
  else if (work?.receipt === 'pending') pendingCents += work.amountCents;
  else if (work?.receipt === 'scheduled' && work.expectedOn)
    addToMonth(work.expectedOn, work.amountCents);

  return {
    months: [...byMonth.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, totalCents]) => ({ month, totalCents })),
    pendingCents,
    receivedCents,
    count: (residency ? 1 : 0) + (work ? 1 : 0),
  };
}

const MONTH_NAMES = [
  'JANEIRO',
  'FEVEREIRO',
  'MARÇO',
  'ABRIL',
  'MAIO',
  'JUNHO',
  'JULHO',
  'AGOSTO',
  'SETEMBRO',
  'OUTUBRO',
  'NOVEMBRO',
  'DEZEMBRO',
] as const;

/** `2026-10` → `OUTUBRO`; o ano só aparece quando difere do ano de referência. */
export function monthLabel(month: string, referenceYear: number): string {
  const [year, index] = month.split('-').map(Number);
  const name = MONTH_NAMES[index - 1];
  return year === referenceYear ? name : `${name} ${year}`;
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
