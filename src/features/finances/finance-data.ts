import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/data/query-keys';
import { supabase } from '@/data/supabase-client';
import { type LocalDate, type LocalMonth, shiftMonth } from '@/domain/calendar';
import type { WorkType } from '@/domain/work-type';
import { useAuthSession } from '@/features/auth/AuthSessionProvider';
import type { AuthClient } from '@/features/auth/session';

export type EntryOrigin = WorkType | 'residency';

/** Caixa (previsto/recebido) e competência (trabalho gerado) do mês — nunca misturados. */
export type FinanceMonth = {
  /** Distingue mês sem nenhuma entrada prevista de um `R$ 0` real. */
  hasExpectedEntries: boolean;
  expectedTotalCents: bigint;
  receivedCents: bigint;
  awaitingCents: bigint;
  /** Pendências sem data: ficam fora do total do mês. */
  undatedCount: number;
  undatedTotalCents: bigint;
  workGeneratedCents: bigint;
  workCount: number;
  workDurationMinutes: number;
  /** `null` no Free ou sem duração registrada — nunca um zero inventado. */
  hourlyValueCents: bigint | null;
};

export type OriginAmount = { origin: EntryOrigin; amountCents: bigint | null };

export type NextEntry = {
  receivableId: string;
  origin: EntryOrigin;
  /** Nome do Local, ou `null` para a Residência. */
  locationName: string | null;
  amountCents: bigint;
  expectedOn: LocalDate;
};

export type UndatedPreview = {
  workId: string;
  type: WorkType;
  locationName: string;
  description: string | null;
  colorToken: string;
  amountCents: bigint;
};

const cents = (value: number | null | undefined) => BigInt(Math.round(Number(value ?? 0)));

export async function readFinanceMonth(
  month: LocalMonth,
  client: AuthClient = supabase,
): Promise<FinanceMonth> {
  const { data, error } = await client.rpc('finance_month_projection', {
    p_month: `${month}-01`,
  });
  if (error) throw error;
  const row = data?.[0];
  if (!row) throw new Error('finance_month_projection returned no row');
  return {
    hasExpectedEntries: row.has_expected_entries,
    expectedTotalCents: cents(row.expected_total_cents),
    receivedCents: cents(row.received_of_expected_cents),
    awaitingCents: cents(row.awaiting_of_expected_cents),
    undatedCount: row.undated_count,
    undatedTotalCents: cents(row.undated_total_cents),
    workGeneratedCents: cents(row.work_generated_cents),
    workCount: row.work_count,
    workDurationMinutes: Number(row.work_duration_minutes),
    hourlyValueCents: row.hourly_value_cents === null ? null : cents(row.hourly_value_cents),
  };
}

/** Quatro origens em ordem estável; quantias `null` quando o servidor não libera (Free). */
export async function readFinanceOrigins(
  month: LocalMonth,
  client: AuthClient = supabase,
): Promise<OriginAmount[]> {
  const { data, error } = await client.rpc('finance_month_origins', { p_month: `${month}-01` });
  if (error) throw error;
  return (data ?? []).map((row) => ({
    origin: row.origin as EntryOrigin,
    amountCents: row.amount_cents === null ? null : cents(row.amount_cents),
  }));
}

/** Próxima entrada ainda não recebida do mês, a partir de hoje. */
export async function readNextEntry(
  month: LocalMonth,
  today: LocalDate,
  client: AuthClient = supabase,
): Promise<NextEntry | null> {
  const monthStart = `${month}-01`;
  const from = today > monthStart ? today : monthStart;
  const { data, error } = await client
    .from('receivable_projection')
    .select('receivable_id, work_entry_id, origin, amount_cents, expected_on')
    .gte('expected_on', from)
    .lt('expected_on', `${shiftMonth(month, 1)}-01`)
    .is('received_at', null)
    .is('invalidated_at', null)
    .is('work_deleted_at', null)
    .order('expected_on', { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!data?.receivable_id || !data.expected_on || !data.origin) return null;

  let locationName: string | null = null;
  if (data.work_entry_id) {
    const work = await client
      .from('agenda_work_projection')
      .select('location_name')
      .eq('work_entry_id', data.work_entry_id)
      .maybeSingle();
    if (work.error) throw work.error;
    locationName = work.data?.location_name ?? null;
  }
  return {
    receivableId: data.receivable_id,
    origin: data.origin as EntryOrigin,
    locationName,
    amountCents: cents(data.amount_cents),
    expectedOn: data.expected_on,
  };
}

/** Até dois Trabalhos sem data de entrada, para a prévia do Review Card. */
export async function readUndatedPreviews(
  client: AuthClient = supabase,
): Promise<UndatedPreview[]> {
  const { data, error } = await client
    .from('agenda_work_projection')
    .select('work_entry_id, type, location_name, description, color_token, amount_cents')
    .eq('receipt_status', 'undated')
    .order('work_date', { ascending: true })
    .limit(2);
  if (error) throw error;
  return (data ?? []).flatMap((row) =>
    row.work_entry_id && row.type && row.location_name && row.amount_cents !== null
      ? [
          {
            workId: row.work_entry_id,
            type: row.type as WorkType,
            locationName: row.location_name,
            description: row.description,
            colorToken: row.color_token ?? 'sage',
            amountCents: cents(row.amount_cents),
          },
        ]
      : [],
  );
}

export function useFinanceMonth(month: LocalMonth) {
  const { userId } = useAuthSession();
  return useQuery({
    queryKey: queryKeys.financeMonth(userId ?? '', month),
    queryFn: () => readFinanceMonth(month),
    enabled: userId !== null,
  });
}

export function useFinanceOrigins(month: LocalMonth, enabled: boolean) {
  const { userId } = useAuthSession();
  return useQuery({
    queryKey: [...queryKeys.financeMonth(userId ?? '', month), 'origins'],
    queryFn: () => readFinanceOrigins(month),
    enabled: userId !== null && enabled,
  });
}

export function useNextEntry(month: LocalMonth, today: LocalDate, enabled: boolean) {
  const { userId } = useAuthSession();
  return useQuery({
    queryKey: [...queryKeys.financeNextEntry(userId ?? '', month), today],
    queryFn: () => readNextEntry(month, today),
    enabled: userId !== null && enabled,
  });
}

export function useUndatedPreviews(enabled: boolean) {
  const { userId } = useAuthSession();
  return useQuery({
    queryKey: queryKeys.financeUndated(userId ?? ''),
    queryFn: () => readUndatedPreviews(),
    enabled: userId !== null && enabled,
  });
}
