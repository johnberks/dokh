import { Platform } from 'react-native';
import { notificationsModule } from './notifications-module';
import type { PlannedReminder } from './reminder-plan';

/** Permissão do sistema, separada da preferência da pessoa (D52). */
export type PermissionState = 'granted' | 'denied' | 'undetermined' | 'unavailable';

const CHANNEL = 'reminders';
let configured = false;

/** Aviso com o app aberto também aparece (sem som); no Android, um canal "Lembretes". */
export function setupNotifications(): void {
  const Notifications = notificationsModule();
  if (!Notifications || configured) return;
  configured = true;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
  if (Platform.OS === 'android') {
    void Notifications.setNotificationChannelAsync(CHANNEL, {
      name: 'Lembretes',
      importance: Notifications.AndroidImportance.DEFAULT,
    }).catch(() => undefined);
  }
}

function toState(permission: {
  status: string;
  ios?: { status?: number } | null;
}): PermissionState {
  const Notifications = notificationsModule();
  if (permission.status === 'granted') return 'granted';
  // "Provisória" do iOS entrega em silêncio: conta como permitida.
  if (Notifications && permission.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL)
    return 'granted';
  return permission.status === 'undetermined' ? 'undetermined' : 'denied';
}

export async function readPermission(): Promise<PermissionState> {
  const Notifications = notificationsModule();
  if (!Notifications) return 'unavailable';
  try {
    return toState(await Notifications.getPermissionsAsync());
  } catch {
    return 'unavailable';
  }
}

export async function requestPermission(): Promise<PermissionState> {
  const Notifications = notificationsModule();
  if (!Notifications) return 'unavailable';
  try {
    return toState(
      await Notifications.requestPermissionsAsync({
        ios: { allowAlert: true, allowSound: true, allowBadge: false },
      }),
    );
  } catch {
    return 'unavailable';
  }
}

let queue: Promise<void> = Promise.resolve();
let lastSignature: string | null = null;

function signature(plan: PlannedReminder[]): string {
  return JSON.stringify(
    plan.map((reminder) => [
      reminder.id,
      reminder.title,
      reminder.body,
      reminder.trigger.type === 'date' ? reminder.trigger.date.getTime() : reminder.trigger,
    ]),
  );
}

/**
 * Troca tudo o que está agendado pelo plano novo. Recriar do zero garante que editar ou excluir
 * um Trabalho nunca deixa lembrete órfão. As trocas são enfileiradas e um plano igual ao último
 * não reagenda nada.
 */
export function replaceScheduled(plan: PlannedReminder[]): Promise<void> {
  const Notifications = notificationsModule();
  if (!Notifications) return Promise.resolve();
  const next = signature(plan);
  queue = queue
    .then(async () => {
      if (next === lastSignature) return;
      await Notifications.cancelAllScheduledNotificationsAsync();
      lastSignature = null;
      for (const reminder of plan) {
        await Notifications.scheduleNotificationAsync({
          identifier: reminder.id,
          content: {
            title: reminder.title,
            body: reminder.body,
            data: { url: reminder.url, kind: reminder.kind },
          },
          trigger:
            reminder.trigger.type === 'date'
              ? {
                  type: Notifications.SchedulableTriggerInputTypes.DATE,
                  date: reminder.trigger.date,
                  channelId: CHANNEL,
                }
              : {
                  type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
                  weekday: reminder.trigger.weekday,
                  hour: reminder.trigger.hour,
                  minute: reminder.trigger.minute,
                  channelId: CHANNEL,
                },
        });
      }
      lastSignature = next;
    })
    .catch(() => {
      lastSignature = null;
    });
  return queue;
}

/** Sair da conta (ou desligar tudo) não deixa nenhum aviso para trás. */
export function cancelAllReminders(): Promise<void> {
  const Notifications = notificationsModule();
  if (!Notifications) return Promise.resolve();
  queue = queue
    .then(async () => {
      await Notifications.cancelAllScheduledNotificationsAsync();
      lastSignature = null;
    })
    .catch(() => undefined);
  return queue;
}

/** Só para testes: zera o estado do módulo. */
export function resetSchedulerForTests(): void {
  queue = Promise.resolve();
  lastSignature = null;
  configured = false;
}
