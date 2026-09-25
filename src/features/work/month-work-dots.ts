import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/data/query-keys';
import { supabase } from '@/data/supabase-client';
import { type LocalDate, type LocalMonth, shiftMonth } from '@/domain/calendar';
import { useAuthSession } from '@/features/auth/AuthSessionProvider';
import type { AuthClient } from '@/features/auth/session';
import { type WorkLocationColorToken, workLocationColors } from '@/theme/tokens';

export type MonthWorkDots = Partial<Record<LocalDate, WorkLocationColorToken[]>>;

/** A célula comporta três pontos; o card do dia continua sendo a informação completa. */
const MAX_DOTS_PER_DAY = 3;

function isKnownColor(token: string): token is WorkLocationColorToken {
  return token in workLocationColors;
}

/**
 * Pontos por dia do mês, na cor do Local e em ordem de horário (Agenda 08: "os pontos
 * mostram dias em que você já trabalha"). Excluídos já saem na própria view.
 */
export async function listMonthWorkDots(
  month: LocalMonth,
  client: AuthClient = supabase,
): Promise<MonthWorkDots> {
  const { data, error } = await client
    .from('agenda_work_projection')
    .select('work_date, color_token, start_time')
    .gte('work_date', `${month}-01`)
    .lt('work_date', `${shiftMonth(month, 1)}-01`)
    .order('work_date', { ascending: true })
    .order('start_time', { ascending: true, nullsFirst: false });
  if (error) throw error;

  const dots: MonthWorkDots = {};
  for (const row of data ?? []) {
    if (!row.work_date) continue;
    const day = dots[row.work_date] ?? [];
    dots[row.work_date] = day;
    if (day.length >= MAX_DOTS_PER_DAY) continue;
    // Token fora da paleta do app (dado antigo ou futuro) não quebra o calendário.
    day.push(row.color_token && isKnownColor(row.color_token) ? row.color_token : 'sage');
  }
  return dots;
}

export function useMonthWorkDots(month: LocalMonth) {
  const { userId } = useAuthSession();
  return useQuery({
    queryKey: queryKeys.agendaMonthDots(userId ?? '', month),
    queryFn: () => listMonthWorkDots(month),
    enabled: userId !== null,
  });
}
