import { fakeNotifications } from '@/test/fake-notifications';
import { notificationsModule } from './notifications-module';
import type { PlannedReminder } from './reminder-plan';
import {
  cancelAllReminders,
  readPermission,
  replaceScheduled,
  requestPermission,
  resetSchedulerForTests,
} from './scheduler';

const mockedModule = jest.mocked(notificationsModule);

const plan: PlannedReminder[] = [
  {
    id: 'undated-weekly',
    kind: 'undated',
    title: 'Trabalhos sem data de entrada',
    body: '1 trabalho…',
    trigger: { type: 'weekly', weekday: 2, hour: 9, minute: 0 },
    url: '/',
  },
  {
    id: 'work-w1',
    kind: 'work',
    title: 'Plantão em 2 horas',
    body: 'Hospital São Lucas, às 19:00.',
    trigger: { type: 'date', date: new Date('2026-10-05T20:00:00.000Z') },
    url: '/work/w1',
  },
];

beforeEach(() => {
  resetSchedulerForTests();
  mockedModule.mockReturnValue(null);
});

describe('agendador de lembretes', () => {
  it('sem o módulo nativo (build antigo), nada acontece e a permissão é "indisponível"', async () => {
    await expect(readPermission()).resolves.toBe('unavailable');
    await expect(replaceScheduled(plan)).resolves.toBeUndefined();
  });

  it('troca tudo pelo plano novo, com destino e gatilho de data ou semanal', async () => {
    const fake = fakeNotifications();
    mockedModule.mockReturnValue(fake as never);
    await replaceScheduled(plan);
    expect(fake.cancelAllScheduledNotificationsAsync).toHaveBeenCalledTimes(1);
    expect(fake.scheduleNotificationAsync.mock.calls).toEqual([
      [
        {
          identifier: 'undated-weekly',
          content: {
            title: 'Trabalhos sem data de entrada',
            body: '1 trabalho…',
            data: { url: '/', kind: 'undated' },
          },
          trigger: { type: 'weekly', weekday: 2, hour: 9, minute: 0, channelId: 'reminders' },
        },
      ],
      [
        {
          identifier: 'work-w1',
          content: {
            title: 'Plantão em 2 horas',
            body: 'Hospital São Lucas, às 19:00.',
            data: { url: '/work/w1', kind: 'work' },
          },
          trigger: {
            type: 'date',
            date: new Date('2026-10-05T20:00:00.000Z'),
            channelId: 'reminders',
          },
        },
      ],
    ]);
  });

  it('plano igual ao último não reagenda; cancelar zera e o próximo agenda de novo', async () => {
    const fake = fakeNotifications();
    mockedModule.mockReturnValue(fake as never);
    await replaceScheduled(plan);
    await replaceScheduled(plan);
    expect(fake.cancelAllScheduledNotificationsAsync).toHaveBeenCalledTimes(1);
    await cancelAllReminders();
    expect(fake.cancelAllScheduledNotificationsAsync).toHaveBeenCalledTimes(2);
    await replaceScheduled(plan);
    expect(fake.scheduleNotificationAsync).toHaveBeenCalledTimes(4);
  });

  it('permissão: concedida, negada, não pedida e o pedido ao sistema', async () => {
    const granted = fakeNotifications('granted');
    mockedModule.mockReturnValue(granted as never);
    await expect(readPermission()).resolves.toBe('granted');
    mockedModule.mockReturnValue(fakeNotifications('denied') as never);
    await expect(readPermission()).resolves.toBe('denied');
    const undetermined = fakeNotifications('undetermined');
    mockedModule.mockReturnValue(undetermined as never);
    await expect(readPermission()).resolves.toBe('undetermined');
    await expect(requestPermission()).resolves.toBe('granted');
    expect(undetermined.requestPermissionsAsync).toHaveBeenCalledWith({
      ios: { allowAlert: true, allowSound: true, allowBadge: false },
    });
  });
});
