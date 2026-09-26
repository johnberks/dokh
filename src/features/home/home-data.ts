import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/data/query-keys';
import { supabase } from '@/data/supabase-client';
import { type LocalDate, type LocalMonth, shiftMonth } from '@/domain/calendar';
import type { WorkType } from '@/domain/work-type';
import { type AgendaWork, toAgendaWork } from '@/features/agenda/agenda-data';
import { useAuthSession } from '@/features/auth/AuthSessionProvider';
import type { AuthClient } from '@/features/auth/session';
import {
  type EntryOrigin,
  type FinanceMonth,
  readFinanceMonth,
} from '@/features/finances/finance-data';
import type { WorkLocationColorToken } from '@/theme/tokens';

/** Mês do topo: o selecionado, o anterior (comparação) e o histórico curto do carrossel. */
export type HomeHero = {
  month: FinanceMonth;
  /** Mês anterior, para a comparação — só vale quando ele teve entrada prevista. */
  previous: FinanceMonth;
  /** Três meses antes do selecionado e o próprio, do mais antigo ao atual. */
  history: { month: LocalMonth; expectedTotalCents: bigint }[];
  /** Entradas do mês ainda não confirmadas (`4 previstos para entrar`). */
  openCount: number;
};

export type HomeEntry = {
  receivableId: string;
  workId: string | null;
  origin: EntryOrigin;
  locationName: string | null;
  colorToken: WorkLocationColorToken | null;
  workType: WorkType | null;
  workDate: LocalDate | null;
  amountCents: bigint;
  expectedOn: LocalDate;
};

/** O corpo da Home: sempre "de hoje em diante", independente do mês escolhido no topo. */
export type HomeBody = {
  firstName: string | null;
  isResident: boolean;
  hasResidency: boolean;
  /** Trabalhos de hoje em diante: o primeiro é o "Próximo trabalho", os demais a lista. */
  upcomingWorks: AgendaWork[];
  /** Entradas a partir de amanhã (as de hoje viram Review Card, sem duplicar). */
  upcomingEntries: HomeEntry[];
  /** Com data de hoje e ainda não confirmadas: Review Card de atenção. */
  dueToday: HomeEntry[];
  /** Data passada sem confirmação: pendência neutra, nunca recebida automaticamente. */
  overdue: HomeEntry[];
  undatedCount: number;
  undatedTotalCents: bigint;
  /** Primeiro Trabalho sem data de entrada (destino de "Adicionar datas"). */
  firstUndatedWorkId: string | null;
  totalWorks: number;
};

const cents = (value: number | null | undefined) => BigInt(Math.round(Number(value ?? 0)));

export async function readHomeHero(
  month: LocalMonth,
  client: AuthClient = supabase,
): Promise<HomeHero> {
  const months = [-3, -2, -1, 0].map((delta) => shiftMonth(month, delta));
  // Tudo em paralelo: nada de cascata de consultas.
  const [history, open] = await Promise.all([
    Promise.all(months.map((item) => readFinanceMonth(item, client))),
    client
      .from('receivable_projection')
      .select('receivable_id', { count: 'exact', head: true })
      .gte('expected_on', `${month}-01`)
      .lt('expected_on', `${shiftMonth(month, 1)}-01`)
      .is('received_at', null)
      .is('invalidated_at', null)
      .is('work_deleted_at', null),
  ]);
  if (open.error) throw open.error;
  return {
    month: history[3],
    previous: history[2],
    history: history.map((item, index) => ({
      month: months[index],
      expectedTotalCents: item.hasExpectedEntries ? item.expectedTotalCents : 0n,
    })),
    openCount: open.count ?? 0,
  };
}

type ReceivableRow = {
  receivable_id: string | null;
  work_entry_id: string | null;
  origin: string | null;
  amount_cents: number | null;
  expected_on: string | null;
};

const RECEIVABLE_COLUMNS = 'receivable_id, work_entry_id, origin, amount_cents, expected_on';

export async function readHomeBody(
  userId: string,
  today: LocalDate,
  client: AuthClient = supabase,
): Promise<HomeBody> {
  const pending = () =>
    client
      .from('receivable_projection')
      .select(RECEIVABLE_COLUMNS)
      .is('received_at', null)
      .is('invalidated_at', null)
      .is('work_deleted_at', null);
  const [profile, residency, works, totalWorks, upcoming, due, late, undated, month] =
    await Promise.all([
      client
        .from('profiles')
        .select('display_name, professional_status')
        .eq('id', userId)
        .maybeSingle(),
      client.from('residencies').select('id').eq('user_id', userId).eq('active', true).limit(1),
      client
        .from('agenda_work_projection')
        .select(
          'work_entry_id, work_date, start_time, duration_minutes, type, description, location_name, color_token, amount_cents, expected_on, receipt_status',
        )
        .gte('work_date', today)
        .order('work_date', { ascending: true })
        .order('start_time', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: true })
        .limit(3),
      client.from('agenda_work_projection').select('work_entry_id', { count: 'exact', head: true }),
      pending()
        .gt('expected_on', today)
        .order('expected_on', { ascending: true })
        .order('receivable_id', { ascending: true })
        .limit(3),
      pending().eq('expected_on', today).order('receivable_id', { ascending: true }),
      pending()
        .lt('expected_on', today)
        .order('expected_on', { ascending: false })
        .order('receivable_id', { ascending: true }),
      client
        .from('agenda_work_projection')
        .select('work_entry_id')
        .eq('receipt_status', 'undated')
        .order('work_date', { ascending: true })
        .limit(1),
      readFinanceMonth(today.slice(0, 7), client),
    ]);
  for (const result of [profile, residency, works, totalWorks, upcoming, due, late, undated]) {
    if (result.error) throw result.error;
  }

  const receivables = [...(upcoming.data ?? []), ...(due.data ?? []), ...(late.data ?? [])];
  const workIds = [
    ...new Set(receivables.map((row) => row.work_entry_id).filter((id): id is string => !!id)),
  ];
  const details = new Map<
    string,
    { name: string; color: WorkLocationColorToken; type: WorkType; date: LocalDate }
  >();
  if (workIds.length > 0) {
    const names = await client
      .from('agenda_work_projection')
      .select('work_entry_id, location_name, color_token, type, work_date')
      .in('work_entry_id', workIds);
    if (names.error) throw names.error;
    for (const row of names.data ?? []) {
      const work = toAgendaWork({
        work_entry_id: row.work_entry_id,
        work_date: row.work_date,
        type: row.type,
        location_name: row.location_name,
        color_token: row.color_token,
        start_time: null,
        duration_minutes: null,
        description: null,
        amount_cents: null,
        expected_on: null,
        receipt_status: null,
      });
      if (work) {
        details.set(work.id, {
          name: work.locationName,
          color: work.colorToken,
          type: work.type,
          date: work.workDate,
        });
      }
    }
  }
  const toEntry = (row: ReceivableRow): HomeEntry | null => {
    if (!row.receivable_id || !row.expected_on || !row.origin) return null;
    const work = row.work_entry_id ? details.get(row.work_entry_id) : undefined;
    return {
      receivableId: row.receivable_id,
      workId: row.work_entry_id,
      origin: row.origin as EntryOrigin,
      locationName: work?.name ?? null,
      colorToken: work?.color ?? null,
      workType: work?.type ?? null,
      workDate: work?.date ?? null,
      amountCents: cents(row.amount_cents),
      expectedOn: row.expected_on,
    };
  };
  const entries = (rows: ReceivableRow[] | null) =>
    (rows ?? []).map(toEntry).filter((entry): entry is HomeEntry => entry !== null);

  const name = profile.data?.display_name?.trim() ?? '';
  return {
    firstName: name ? name.split(/\s+/)[0] : null,
    isResident: profile.data?.professional_status === 'resident',
    hasResidency: (residency.data ?? []).length > 0,
    upcomingWorks: (works.data ?? [])
      .map(toAgendaWork)
      .filter((work): work is AgendaWork => work !== null),
    upcomingEntries: entries(upcoming.data),
    dueToday: entries(due.data),
    overdue: entries(late.data),
    undatedCount: month.undatedCount,
    undatedTotalCents: month.undatedTotalCents,
    firstUndatedWorkId: undated.data?.[0]?.work_entry_id ?? null,
    totalWorks: totalWorks.count ?? 0,
  };
}

export function useHomeHero(month: LocalMonth) {
  const { userId } = useAuthSession();
  return useQuery({
    queryKey: [...queryKeys.homeOverview(userId ?? ''), 'hero', month],
    queryFn: () => readHomeHero(month),
    enabled: userId !== null,
  });
}

export function useHomeBody(today: LocalDate) {
  const { userId } = useAuthSession();
  return useQuery({
    queryKey: [...queryKeys.homeOverview(userId ?? ''), 'body', today],
    queryFn: () => readHomeBody(userId ?? '', today),
    enabled: userId !== null,
  });
}
