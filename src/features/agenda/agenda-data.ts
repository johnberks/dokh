import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/data/query-keys';
import { supabase } from '@/data/supabase-client';
import { type LocalDate, type LocalMonth, shiftMonth } from '@/domain/calendar';
import type { WorkType } from '@/domain/work-type';
import { useAuthSession } from '@/features/auth/AuthSessionProvider';
import type { AuthClient } from '@/features/auth/session';
import { type WorkLocationColorToken, workLocationColors } from '@/theme/tokens';

export type ReceiptStatus =
  | 'received'
  | 'scheduled'
  | 'due_today'
  | 'undated'
  | 'confirmation_pending'
  | 'invalidated';

/** Um Trabalho como a Agenda o mostra (`agenda_work_projection`); valores em centavos. */
export type AgendaWork = {
  id: string;
  workDate: LocalDate;
  /** `HH:MM`, ou `null` quando não há horário (Procedimento/Atendimento). */
  startTime: string | null;
  durationMinutes: number | null;
  type: WorkType;
  description: string | null;
  locationName: string;
  colorToken: WorkLocationColorToken;
  amountCents: bigint | null;
  expectedOn: LocalDate | null;
  receiptStatus: ReceiptStatus | null;
};

type Row = {
  work_entry_id: string | null;
  work_date: string | null;
  start_time: string | null;
  duration_minutes: number | null;
  type: string | null;
  description: string | null;
  location_name: string | null;
  color_token: string | null;
  amount_cents: number | null;
  expected_on: string | null;
  receipt_status: string | null;
};

const COLUMNS =
  'work_entry_id, work_date, start_time, duration_minutes, type, description, location_name, color_token, amount_cents, expected_on, receipt_status';

function toAgendaWork(row: Row): AgendaWork | null {
  if (!row.work_entry_id || !row.work_date || !row.type || !row.location_name) return null;
  const token = row.color_token ?? 'sage';
  return {
    id: row.work_entry_id,
    workDate: row.work_date,
    startTime: row.start_time ? row.start_time.slice(0, 5) : null,
    durationMinutes: row.duration_minutes,
    type: row.type as WorkType,
    description: row.description,
    locationName: row.location_name,
    // Token fora da paleta do app (dado antigo ou futuro) não quebra a tela.
    colorToken: token in workLocationColors ? (token as WorkLocationColorToken) : 'sage',
    amountCents: row.amount_cents === null ? null : BigInt(row.amount_cents),
    expectedOn: row.expected_on,
    receiptStatus: row.receipt_status as ReceiptStatus | null,
  };
}

/**
 * Trabalhos do mês, em ordem de dia e horário (sem horário por último). Excluídos já saem
 * na própria view; a RLS do dono vale porque a view é `security_invoker`.
 */
export async function listAgendaMonth(
  month: LocalMonth,
  client: AuthClient = supabase,
): Promise<AgendaWork[]> {
  const { data, error } = await client
    .from('agenda_work_projection')
    .select(COLUMNS)
    .gte('work_date', `${month}-01`)
    .lt('work_date', `${shiftMonth(month, 1)}-01`)
    .order('work_date', { ascending: true })
    .order('start_time', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []).map(toAgendaWork).filter((work): work is AgendaWork => work !== null);
}

export async function readAgendaWork(
  workId: string,
  client: AuthClient = supabase,
): Promise<AgendaWork | null> {
  const { data, error } = await client
    .from('agenda_work_projection')
    .select(COLUMNS)
    .eq('work_entry_id', workId)
    .maybeSingle();
  if (error) throw error;
  return data ? toAgendaWork(data) : null;
}

/** Agrupa por dia preservando a ordem da consulta. */
export function worksByDay(works: readonly AgendaWork[]): Map<LocalDate, AgendaWork[]> {
  const days = new Map<LocalDate, AgendaWork[]>();
  for (const work of works) {
    const day = days.get(work.workDate) ?? [];
    day.push(work);
    days.set(work.workDate, day);
  }
  return days;
}

/** Um ponto por Trabalho, na cor do Local, até três por célula. */
export function dotsByDay(
  works: readonly AgendaWork[],
): Partial<Record<LocalDate, WorkLocationColorToken[]>> {
  const dots: Partial<Record<LocalDate, WorkLocationColorToken[]>> = {};
  for (const [date, day] of worksByDay(works)) {
    dots[date] = day.slice(0, 3).map((work) => work.colorToken);
  }
  return dots;
}

export function useAgendaMonth(month: LocalMonth) {
  const { userId } = useAuthSession();
  return useQuery({
    queryKey: queryKeys.agendaMonth(userId ?? '', month),
    queryFn: () => listAgendaMonth(month),
    enabled: userId !== null,
  });
}

export function useAgendaWork(workId: string | null) {
  const { userId } = useAuthSession();
  return useQuery({
    queryKey: queryKeys.workDetail(userId ?? '', workId ?? ''),
    queryFn: () => readAgendaWork(workId ?? ''),
    enabled: userId !== null && workId !== null,
  });
}
