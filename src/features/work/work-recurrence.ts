import { useMutation, useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/data/query-keys';
import { supabase } from '@/data/supabase-client';
import { differenceInLocalDays, type LocalDate } from '@/domain/calendar';
import { useAuthSession } from '@/features/auth/AuthSessionProvider';
import type { AuthClient } from '@/features/auth/session';
import { useWorkInvalidation, type WorkAggregateInput } from './work-data';
import type { ExpectedEntry, RepeatFrequency } from './work-draft';
import { addDaysToLocalDate } from './work-schedule';

export type SeriesFrequency = Exclude<RepeatFrequency, 'none'>;

export const REPEAT_OPTIONS: readonly RepeatFrequency[] = ['none', 'weekly', 'biweekly', 'monthly'];

function addMonthsClamped(date: LocalDate, months: number): LocalDate {
  const [year, month, day] = date.split('-').map(Number);
  const target = new Date(Date.UTC(year, month - 1 + months, 1));
  const lastDay = new Date(
    Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0),
  ).getUTCDate();
  target.setUTCDate(Math.min(day, lastDay));
  return target.toISOString().slice(0, 10);
}

/**
 * Datas de uma série, como o servidor as gera (3.10): sempre a partir da primeira, para o
 * mensal no dia 31 cair no último dia dos meses curtos sem "escorregar".
 */
export function recurrenceDates(
  frequency: SeriesFrequency,
  start: LocalDate,
  count: number,
): LocalDate[] {
  return Array.from({ length: count }, (_, step) => {
    if (frequency === 'weekly') return addDaysToLocalDate(start, 7 * step);
    if (frequency === 'biweekly') return addDaysToLocalDate(start, 14 * step);
    return addMonthsClamped(start, step);
  });
}

/** Distância até o pagamento, repetida em cada ocorrência; `null` = "Ainda não sei". */
export function expectedOffsetDays(
  workDate: LocalDate,
  expected: ExpectedEntry | null,
): number | null {
  if (expected?.kind !== 'date') return null;
  return Math.min(366, Math.max(0, differenceInLocalDays(expected.date, workDate)));
}

export type WorkSeriesResult = { seriesId: string; workId: string; occurrences: number };

/** Cria a série e materializa 12 meses (RPC Premium; Free é negado no servidor). */
export async function createWorkSeries(
  input: WorkAggregateInput,
  frequency: SeriesFrequency,
  idempotencyKey: string,
  client: AuthClient = supabase,
): Promise<WorkSeriesResult> {
  const { data, error } = await client.rpc('create_work_series', {
    p_idempotency_key: idempotencyKey,
    p_frequency: frequency,
    p_type: input.type,
    p_location_id: input.locationId,
    p_description: (input.description?.trim() || null) as unknown as string,
    p_starts_on: input.workDate,
    p_start_time: (input.startTime ?? null) as unknown as string,
    p_duration_minutes: (input.durationMinutes ?? null) as unknown as number,
    p_timezone: input.timezone,
    p_amount_cents: Number(input.amountCents),
    p_expected_offset_days: (input.expectedOn
      ? expectedOffsetDays(input.workDate, { kind: 'date', date: input.expectedOn })
      : null) as unknown as number,
  });
  if (error) throw error;
  const row = data?.[0];
  if (!row) throw new Error('create_work_series returned no row');
  return { seriesId: row.series_id, workId: row.work_id, occurrences: row.occurrences };
}

/** "Parar de repetir": passado e hoje ficam; os próximos não recebidos saem. */
export async function stopWorkSeries(
  seriesId: string,
  client: AuthClient = supabase,
): Promise<{ removed: number }> {
  const { data, error } = await client.rpc('stop_work_series', { p_series_id: seriesId });
  if (error) throw error;
  return { removed: data?.[0]?.removed ?? 0 };
}

/** Próxima ocorrência da série depois de `after`, para "próximo em 21 SET". */
export async function readNextOccurrence(
  seriesId: string,
  after: LocalDate,
  client: AuthClient = supabase,
): Promise<LocalDate | null> {
  const { data, error } = await client
    .from('agenda_work_projection')
    .select('work_date')
    .eq('series_id', seriesId)
    .gt('work_date', after)
    .order('work_date', { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data?.work_date ?? null;
}

export function useNextOccurrence(seriesId: string | null, after: LocalDate) {
  const { userId } = useAuthSession();
  return useQuery({
    queryKey: queryKeys.workSeriesNext(userId ?? '', seriesId ?? '', after),
    queryFn: () => readNextOccurrence(seriesId ?? '', after),
    enabled: userId !== null && seriesId !== null,
  });
}

export function useStopWorkSeries() {
  const invalidate = useWorkInvalidation();
  return useMutation({
    mutationFn: (seriesId: string) => stopWorkSeries(seriesId),
    onSuccess: invalidate,
  });
}
