import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/data/query-keys';
import { supabase } from '@/data/supabase-client';
import type { LocalDate } from '@/domain/calendar';
import type { WorkType } from '@/domain/work-type';
import { useAuthSession } from '@/features/auth/AuthSessionProvider';
import type { AuthClient } from '@/features/auth/session';
import { addDaysToLocalDate } from '@/features/work/work-schedule';
import {
  RECEIVABLE_HORIZON_DAYS,
  type ReminderReceivable,
  type ReminderSources,
  type ReminderWork,
  WORK_HORIZON_DAYS,
} from './reminder-plan';

/**
 * O que os lembretes precisam, numa leitura só: entradas que ainda vão entrar (inclusive a
 * bolsa da residência), Trabalhos da janela e quantos Trabalhos estão sem data de entrada.
 * Recebido, pendência passada e invalidado ficam de fora pelo próprio status.
 */
export async function readReminderSources(
  today: LocalDate,
  client: AuthClient = supabase,
): Promise<ReminderSources> {
  const [receivables, works, undated] = await Promise.all([
    // Só os dias: o aviso de recebimento é genérico, sem valor nem origem (D81).
    client
      .from('receivable_projection')
      .select('receivable_id, expected_on')
      .gte('expected_on', today)
      .lte('expected_on', addDaysToLocalDate(today, RECEIVABLE_HORIZON_DAYS))
      .in('receipt_status', ['scheduled', 'due_today'])
      .is('invalidated_at', null)
      .is('work_deleted_at', null),
    client
      .from('agenda_work_projection')
      .select('work_entry_id, work_date, start_time, type, location_name, timezone')
      .gte('work_date', addDaysToLocalDate(today, -1))
      .lte('work_date', addDaysToLocalDate(today, WORK_HORIZON_DAYS)),
    client
      .from('agenda_work_projection')
      .select('work_entry_id', { count: 'exact', head: true })
      .eq('receipt_status', 'undated'),
  ]);
  for (const result of [receivables, works, undated]) {
    if (result.error) throw result.error;
  }

  return {
    receivables: (receivables.data ?? [])
      .filter((row) => row.receivable_id && row.expected_on)
      .map(
        (row): ReminderReceivable => ({
          receivableId: row.receivable_id as string,
          expectedOn: row.expected_on as LocalDate,
        }),
      ),
    works: (works.data ?? [])
      .filter((row) => row.work_entry_id && row.work_date && row.type && row.location_name)
      .map(
        (row): ReminderWork => ({
          id: row.work_entry_id as string,
          workDate: row.work_date as LocalDate,
          startTime: row.start_time ? row.start_time.slice(0, 5) : null,
          type: row.type as WorkType,
          locationName: row.location_name as string,
          timezone: row.timezone ?? 'America/Sao_Paulo',
        }),
      ),
    undatedCount: undated.count ?? 0,
  };
}

export function useReminderSources(today: LocalDate, enabled: boolean) {
  const { userId } = useAuthSession();
  return useQuery({
    queryKey: queryKeys.reminderSources(userId ?? '', today),
    queryFn: () => readReminderSources(today),
    enabled: enabled && userId !== null,
  });
}
