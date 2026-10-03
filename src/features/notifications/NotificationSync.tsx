import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { useAuthSession } from '@/features/auth/AuthSessionProvider';
import { deviceTimezone } from '@/features/onboarding/profile-data';
import { todayInTimezone } from '@/features/work/work-schedule';
import { useNotificationPermission } from './notification-permission';
import { useNotificationPreferences } from './notification-preferences';
import { planReminders } from './reminder-plan';
import { useReminderSources } from './reminder-sources';
import { reminderTexts } from './reminder-texts';
import { cancelAllReminders, replaceScheduled, setupNotifications } from './scheduler';

/**
 * Mantém os lembretes locais em dia (D80): ao abrir e voltar para o app, depois de qualquer
 * escrita de Trabalho/Recebível (as leituras são invalidadas) e ao mudar as preferências, o plano
 * é refeito e substitui o agendado. Sair da conta cancela tudo. Não desenha nada.
 */
export function NotificationSync() {
  const { status, userId } = useAuthSession();
  const signedIn = status === 'signedIn' && userId !== null;
  const permission = useNotificationPermission((store) => store.state);
  const [today, setToday] = useState(() => todayInTimezone(deviceTimezone()));
  const preferences = useNotificationPreferences();
  const sources = useReminderSources(today, signedIn && permission === 'granted');

  useEffect(() => {
    setupNotifications();
    const refresh = () => {
      void useNotificationPermission.getState().refresh();
      setToday(todayInTimezone(deviceTimezone()));
    };
    refresh();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh();
    });
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (status === 'signedOut') void cancelAllReminders();
  }, [status]);

  useEffect(() => {
    if (!signedIn || permission !== 'granted' || !preferences.data || !sources.data) return;
    void replaceScheduled(
      planReminders({
        now: new Date(),
        timezone: deviceTimezone(),
        preferences: preferences.data,
        sources: sources.data,
        texts: reminderTexts(),
      }),
    );
  }, [signedIn, permission, preferences.data, sources.data]);

  return null;
}
