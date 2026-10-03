import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/data/query-keys';
import { supabase } from '@/data/supabase-client';
import { useAuthSession } from '@/features/auth/AuthSessionProvider';
import type { AuthClient } from '@/features/auth/session';

export const WORK_REMINDER_LEADS = [30, 60, 120, 1440] as const;
export type WorkReminderLead = (typeof WORK_REMINDER_LEADS)[number];
/** Horários oferecidos para o aviso da entrada (o banco aceita 05:00–22:00). */
export const RECEIVABLE_TIMES = ['07:00', '08:00', '09:00', '12:00'] as const;

/**
 * Perfil 14. A preferência da pessoa é separada da permissão do sistema (D52): negar a permissão
 * nunca desliga uma preferência em silêncio. "Alterações importantes" fica fora até ter definição.
 */
export type NotificationPreferences = {
  receivableDueDay: boolean;
  undatedWeeklyReminder: boolean;
  upcomingWorkReminder: boolean;
  /** `HH:MM` local do aviso no dia previsto. */
  receivableDueTime: string;
  workReminderMinutes: WorkReminderLead;
};

/** Ligadas por padrão (pedido do usuário, 2026-10-03; Perfil 14). Sem linha gravada, vale isto. */
export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  receivableDueDay: true,
  undatedWeeklyReminder: true,
  upcomingWorkReminder: true,
  receivableDueTime: '08:00',
  workReminderMinutes: 120,
};

export async function readNotificationPreferences(
  client: AuthClient = supabase,
): Promise<NotificationPreferences> {
  const { data, error } = await client
    .from('notification_preferences')
    .select(
      'receivable_due_day, undated_weekly_reminder, upcoming_work_reminder, receivable_due_time, work_reminder_minutes',
    )
    .maybeSingle();
  if (error) throw error;
  if (!data) return DEFAULT_NOTIFICATION_PREFERENCES;
  const lead = data.work_reminder_minutes;
  return {
    receivableDueDay: data.receivable_due_day,
    undatedWeeklyReminder: data.undated_weekly_reminder,
    upcomingWorkReminder: data.upcoming_work_reminder,
    receivableDueTime: data.receivable_due_time.slice(0, 5),
    workReminderMinutes: (WORK_REMINDER_LEADS as readonly number[]).includes(lead)
      ? (lead as WorkReminderLead)
      : DEFAULT_NOTIFICATION_PREFERENCES.workReminderMinutes,
  };
}

export async function saveNotificationPreferences(
  userId: string,
  preferences: NotificationPreferences,
  client: AuthClient = supabase,
): Promise<void> {
  const { error } = await client.from('notification_preferences').upsert(
    {
      user_id: userId,
      receivable_due_day: preferences.receivableDueDay,
      undated_weekly_reminder: preferences.undatedWeeklyReminder,
      upcoming_work_reminder: preferences.upcomingWorkReminder,
      receivable_due_time: preferences.receivableDueTime,
      work_reminder_minutes: preferences.workReminderMinutes,
    },
    { onConflict: 'user_id' },
  );
  if (error) throw error;
}

export function useNotificationPreferences() {
  const { userId } = useAuthSession();
  return useQuery({
    queryKey: queryKeys.notificationPreferences(userId ?? ''),
    queryFn: () => readNotificationPreferences(),
    enabled: userId !== null,
  });
}

export function useSaveNotificationPreferences() {
  const { userId } = useAuthSession();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (preferences: NotificationPreferences) => {
      if (userId === null) throw new Error('missing session');
      return saveNotificationPreferences(userId, preferences);
    },
    // A leitura nova reagenda os avisos (NotificationSync).
    onSuccess: (_result, preferences) => {
      if (userId === null) return;
      queryClient.setQueryData(queryKeys.notificationPreferences(userId), preferences);
    },
  });
}
