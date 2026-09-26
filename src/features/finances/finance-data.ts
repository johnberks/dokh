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

export type YearMonth = { month: LocalMonth; expectedTotalCents: bigint };

/** Série do ano: só meses com dado real, média apenas com base suficiente (≥ 2 meses). */
export type FinanceYear = {
  months: YearMonth[];
  totalCents: bigint;
  historicalMonthCount: number;
  historicalAverageCents: bigint | null;
};

export async function readFinanceYear(
  year: number,
  client: AuthClient = supabase,
): Promise<FinanceYear> {
  const { data, error } = await client.rpc('finance_year_projection', { p_year: year });
  if (error) throw error;
  const rows = data ?? [];
  const months = rows.map((row) => ({
    month: row.month_start.slice(0, 7),
    expectedTotalCents: cents(row.expected_total_cents),
  }));
  const first = rows[0];
  return {
    months,
    totalCents: months.reduce((sum, item) => sum + item.expectedTotalCents, 0n),
    historicalMonthCount: first?.historical_month_count ?? 0,
    historicalAverageCents:
      first?.historical_average_cents == null ? null : cents(first.historical_average_cents),
  };
}

/**
 * Origem das entradas no ano (Premium): soma das origens de cada mês com entrada. O servidor
 * devolve quantias `null` no Free, então nada é calculado fora do plano.
 */
export async function readYearOrigins(
  months: readonly LocalMonth[],
  client: AuthClient = supabase,
): Promise<OriginAmount[]> {
  const perMonth = await Promise.all(months.map((month) => readFinanceOrigins(month, client)));
  const totals = new Map<EntryOrigin, bigint | null>();
  for (const origins of perMonth) {
    for (const item of origins) {
      const previous = totals.get(item.origin);
      totals.set(
        item.origin,
        item.amountCents === null ? (previous ?? null) : (previous ?? 0n) + item.amountCents,
      );
    }
  }
  return [...totals].map(([origin, amountCents]) => ({ origin, amountCents }));
}

export function useFinanceYear(year: number, enabled: boolean) {
  const { userId } = useAuthSession();
  return useQuery({
    queryKey: queryKeys.financeYear(userId ?? '', year),
    queryFn: () => readFinanceYear(year),
    enabled: userId !== null && enabled,
  });
}

export function useYearOrigins(year: number, months: readonly LocalMonth[], enabled: boolean) {
  const { userId } = useAuthSession();
  return useQuery({
    queryKey: [...queryKeys.financeYear(userId ?? '', year), 'origins', months.join(',')],
    queryFn: () => readYearOrigins(months),
    enabled: userId !== null && enabled,
  });
}

export type YearWork = {
  /** Valor/hora do ano: horas de cada mês pesam no resultado (não é média de médias). */
  hourlyValueCents: bigint | null;
  /** Variação entre o primeiro e o último mês do ano com valor/hora; `null` sem base. */
  hourlyEvolutionPercent: number | null;
};

/**
 * Valor/hora anual a partir das projeções mensais do próprio ano (até o mês atual). O
 * servidor só devolve valor/hora com Premium ativo; no Free o resultado é `null`.
 */
export async function readYearWork(
  months: readonly LocalMonth[],
  client: AuthClient = supabase,
): Promise<YearWork> {
  const monthly = await Promise.all(months.map((month) => readFinanceMonth(month, client)));
  const withHourly = monthly
    .map((data, index) => ({ month: months[index], data }))
    .filter(
      (item): item is { month: LocalMonth; data: FinanceMonth & { hourlyValueCents: bigint } } =>
        item.data.hourlyValueCents !== null && item.data.workDurationMinutes > 0,
    );
  if (withHourly.length === 0) return { hourlyValueCents: null, hourlyEvolutionPercent: null };

  const minutes = withHourly.reduce((sum, item) => sum + item.data.workDurationMinutes, 0);
  const weighted = withHourly.reduce(
    (sum, item) => sum + Number(item.data.hourlyValueCents) * item.data.workDurationMinutes,
    0,
  );
  const first = withHourly[0].data.hourlyValueCents;
  const last = withHourly[withHourly.length - 1].data.hourlyValueCents;
  return {
    hourlyValueCents: BigInt(Math.round(weighted / minutes)),
    hourlyEvolutionPercent:
      withHourly.length >= 2 && first > 0n
        ? Math.round((Number(last - first) / Number(first)) * 100)
        : null,
  };
}

export function useYearWork(year: number, months: readonly LocalMonth[], enabled: boolean) {
  const { userId } = useAuthSession();
  return useQuery({
    queryKey: [...queryKeys.financeYear(userId ?? '', year), 'work', months.join(',')],
    queryFn: () => readYearWork(months),
    enabled: userId !== null && enabled,
  });
}

export type HourlyMonth = {
  month: LocalMonth;
  /** Servidor: só com Premium. */
  hourlyValueCents: bigint | null;
  workCount: number;
  workGeneratedCents: bigint;
  workDurationMinutes: number;
};

/** O mês e os dois anteriores, para o insight de valor/hora (Finanças 01). */
export async function readHourlyWindow(
  month: LocalMonth,
  client: AuthClient = supabase,
): Promise<HourlyMonth[]> {
  return readHourlyHistory(month, 3, client);
}

/** O mês e os `count - 1` anteriores, do mais antigo ao atual (análise completa usa seis). */
export async function readHourlyHistory(
  month: LocalMonth,
  count: number,
  client: AuthClient = supabase,
): Promise<HourlyMonth[]> {
  const months = Array.from({ length: count }, (_, index) => shiftMonth(month, index - count + 1));
  const data = await Promise.all(months.map((item) => readFinanceMonth(item, client)));
  return data.map((item, index) => ({
    month: months[index],
    hourlyValueCents: item.hourlyValueCents,
    workCount: item.workCount,
    workGeneratedCents: item.workGeneratedCents,
    workDurationMinutes: item.workDurationMinutes,
  }));
}

export function useHourlyWindow(month: LocalMonth, enabled: boolean) {
  const { userId } = useAuthSession();
  return useQuery({
    queryKey: [...queryKeys.financeMonth(userId ?? '', month), 'hourly-window'],
    queryFn: () => readHourlyWindow(month),
    enabled: userId !== null && enabled,
  });
}

/** Análise completa de valor/hora (Finanças 02): seis meses até o escolhido. */
export function useHourlyHistory(month: LocalMonth, enabled: boolean) {
  const { userId } = useAuthSession();
  return useQuery({
    queryKey: [...queryKeys.financeMonth(userId ?? '', month), 'hourly-history'],
    queryFn: () => readHourlyHistory(month, 6),
    enabled: userId !== null && enabled,
  });
}

export type EntryStatus = 'received' | 'scheduled' | 'due_today' | 'confirmation_pending';

/** Uma linha de Entradas (05–10): Recebível datado no mês, pela data prevista de pagamento. */
export type MonthEntry = {
  receivableId: string;
  workId: string | null;
  origin: EntryOrigin;
  /** Nome do Local, ou `null` para a Residência. */
  locationName: string | null;
  amountCents: bigint;
  expectedOn: LocalDate;
  /** Derivado no servidor pelo fuso do perfil; nunca confirmado pela passagem do tempo. */
  status: EntryStatus;
};

const ENTRY_STATUSES: readonly EntryStatus[] = [
  'received',
  'scheduled',
  'due_today',
  'confirmation_pending',
];

/**
 * Entradas do mês: o mesmo recorte do total de Finanças (data prevista dentro do mês, sem
 * invalidados nem Trabalhos excluídos), em ordem cronológica. Sem data fica de fora (Review Card).
 */
export async function readMonthEntries(
  month: LocalMonth,
  client: AuthClient = supabase,
): Promise<MonthEntry[]> {
  const { data, error } = await client
    .from('receivable_projection')
    .select('receivable_id, work_entry_id, origin, amount_cents, expected_on, receipt_status')
    .gte('expected_on', `${month}-01`)
    .lt('expected_on', `${shiftMonth(month, 1)}-01`)
    .is('invalidated_at', null)
    .is('work_deleted_at', null)
    .order('expected_on', { ascending: true })
    .order('receivable_id', { ascending: true });
  if (error) throw error;
  const rows = (data ?? []).filter(
    (row) =>
      row.receivable_id &&
      row.expected_on &&
      row.origin &&
      ENTRY_STATUSES.includes(row.receipt_status as EntryStatus),
  );

  const workIds = [
    ...new Set(rows.map((row) => row.work_entry_id).filter((id): id is string => !!id)),
  ];
  const names = new Map<string, string>();
  if (workIds.length > 0) {
    const works = await client
      .from('agenda_work_projection')
      .select('work_entry_id, location_name')
      .in('work_entry_id', workIds);
    if (works.error) throw works.error;
    for (const work of works.data ?? []) {
      if (work.work_entry_id && work.location_name) {
        names.set(work.work_entry_id, work.location_name);
      }
    }
  }

  return rows.map((row) => ({
    receivableId: row.receivable_id as string,
    workId: row.work_entry_id,
    origin: row.origin as EntryOrigin,
    locationName: row.work_entry_id ? (names.get(row.work_entry_id) ?? null) : null,
    amountCents: cents(row.amount_cents),
    expectedOn: row.expected_on as LocalDate,
    status: row.receipt_status as EntryStatus,
  }));
}

export function useMonthEntries(month: LocalMonth) {
  const { userId } = useAuthSession();
  return useQuery({
    queryKey: [...queryKeys.financeMonth(userId ?? '', month), 'entries'],
    queryFn: () => readMonthEntries(month),
    enabled: userId !== null,
  });
}
