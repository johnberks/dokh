import '@/i18n';
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  type NotificationPreferences,
} from './notification-preferences';
import {
  MAX_SCHEDULED,
  planReminders,
  type ReminderReceivable,
  type ReminderSources,
  type ReminderWork,
} from './reminder-plan';
import { reminderTexts } from './reminder-texts';

const TZ = 'America/Sao_Paulo';
// 3 de outubro de 2026, 10:00 em São Paulo.
const NOW = new Date('2026-10-03T13:00:00.000Z');

const receivable = (patch: Partial<ReminderReceivable>): ReminderReceivable => ({
  receivableId: 'r1',
  expectedOn: '2026-10-12',
  ...patch,
});
const work = (patch: Partial<ReminderWork>): ReminderWork => ({
  id: 'w1',
  workDate: '2026-10-05',
  startTime: '19:00',
  type: 'shift',
  locationName: 'Hospital São Lucas',
  timezone: TZ,
  ...patch,
});
const empty: ReminderSources = { receivables: [], works: [], undatedCount: 0 };

function plan(
  sources: Partial<ReminderSources>,
  preferences: Partial<NotificationPreferences> = {},
) {
  return planReminders({
    now: NOW,
    timezone: TZ,
    preferences: { ...DEFAULT_NOTIFICATION_PREFERENCES, ...preferences },
    sources: { ...empty, ...sources },
    texts: reminderTexts(),
  });
}

describe('plano de lembretes', () => {
  it('recebimento: aviso genérico às 8h do dia previsto, que abre Entradas do mês', () => {
    const [reminder] = plan({ receivables: [receivable({})] });
    expect(reminder).toMatchObject({
      id: 'receivable-2026-10-12',
      kind: 'receivable',
      title: 'Recebimento previsto para hoje',
      body: 'Confira em Finanças se já entrou.',
      url: '/finances/entries?month=2026-10',
    });
    expect(reminder.trigger).toEqual({ type: 'date', date: new Date('2026-10-12T11:00:00.000Z') });
  });

  it('vários recebimentos no mesmo dia viram um aviso só, ainda genérico', () => {
    const reminders = plan({
      receivables: [
        receivable({}),
        receivable({ receivableId: 'r2' }),
        receivable({ receivableId: 'r3', expectedOn: '2026-11-05' }),
      ],
    });
    expect(reminders.map((reminder) => [reminder.title, reminder.url])).toEqual([
      ['Recebimentos previstos para hoje', '/finances/entries?month=2026-10'],
      ['Recebimento previsto para hoje', '/finances/entries?month=2026-11'],
    ]);
  });

  it('nenhum aviso traz valor em dinheiro, em hipótese alguma (D81)', () => {
    const reminders = plan({
      receivables: [receivable({}), receivable({ receivableId: 'r2', expectedOn: '2026-10-20' })],
      works: [work({}), work({ id: 'w2', type: 'procedure', startTime: null })],
      undatedCount: 4,
    });
    expect(reminders.length).toBeGreaterThan(0);
    for (const reminder of reminders) {
      const text = `${reminder.title} ${reminder.body}`;
      expect(text).not.toMatch(/R\$|\d+,\d{2}|\d{1,3}(\.\d{3})+/);
    }
  });

  it('o horário escolhido vale; entrada de hoje com horário já passado não é agendada', () => {
    const [later] = plan({ receivables: [receivable({})] }, { receivableDueTime: '12:00' });
    expect(later.trigger).toEqual({ type: 'date', date: new Date('2026-10-12T15:00:00.000Z') });
    expect(plan({ receivables: [receivable({ expectedOn: '2026-10-03' })] })).toEqual([]);
    expect(
      plan(
        { receivables: [receivable({ expectedOn: '2026-10-03' })] },
        { receivableDueTime: '12:00' },
      ),
    ).toHaveLength(1);
  });

  it('trabalho com horário: lembrete pela antecedência escolhida', () => {
    const [twoHours] = plan({ works: [work({})] });
    expect(twoHours).toMatchObject({
      id: 'work-w1',
      title: 'Plantão em 2 horas',
      body: 'Hospital São Lucas, às 19:00.',
      url: '/work/w1',
      trigger: { type: 'date', date: new Date('2026-10-05T20:00:00.000Z') },
    });
    const [dayBefore] = plan({ works: [work({})] }, { workReminderMinutes: 1440 });
    expect(dayBefore.title).toBe('Plantão amanhã');
    expect(dayBefore.trigger).toEqual({ type: 'date', date: new Date('2026-10-04T22:00:00.000Z') });
  });

  it('trabalho sem horário: 8h do dia, ou 20h da véspera com 1 dia', () => {
    const untimed = work({ type: 'procedure', startTime: null });
    const [today] = plan({ works: [untimed] });
    expect(today.title).toBe('Procedimento hoje');
    expect(today.body).toBe('Hospital São Lucas.');
    expect(today.trigger).toEqual({ type: 'date', date: new Date('2026-10-05T11:00:00.000Z') });
    const [eve] = plan({ works: [untimed] }, { workReminderMinutes: 1440 });
    expect(eve.trigger).toEqual({ type: 'date', date: new Date('2026-10-04T23:00:00.000Z') });
  });

  it('o horário do trabalho vale no fuso dele', () => {
    const [reminder] = plan({ works: [work({ timezone: 'America/Manaus' })] });
    // 19:00 em Manaus (UTC−4) − 2 h = 21:00 UTC.
    expect(reminder.trigger).toEqual({ type: 'date', date: new Date('2026-10-05T21:00:00.000Z') });
  });

  it('sem data de entrada: lembrete semanal, só se houver trabalho assim', () => {
    expect(plan({ undatedCount: 0 })).toEqual([]);
    const [weekly] = plan({ undatedCount: 3 });
    expect(weekly).toMatchObject({
      id: 'undated-weekly',
      title: 'Trabalhos sem data de entrada',
      body: '3 trabalhos ainda sem previsão de pagamento. Defina quando o dinheiro entra.',
      trigger: { type: 'weekly', weekday: 2, hour: 9, minute: 0 },
      url: '/',
    });
  });

  it('preferência desligada não agenda aquele tipo', () => {
    const sources = { receivables: [receivable({})], works: [work({})], undatedCount: 2 };
    expect(plan(sources, { receivableDueDay: false }).map((r) => r.kind)).toEqual([
      'undated',
      'work',
    ]);
    expect(plan(sources, { upcomingWorkReminder: false }).map((r) => r.kind)).toEqual([
      'undated',
      'receivable',
    ]);
    expect(
      plan(sources, {
        receivableDueDay: false,
        upcomingWorkReminder: false,
        undatedWeeklyReminder: false,
      }),
    ).toEqual([]);
  });

  it('nada no passado e no máximo 60 avisos, os mais próximos primeiro', () => {
    expect(plan({ works: [work({ workDate: '2026-10-02' })] })).toEqual([]);
    const many = Array.from({ length: 80 }, (_, index) =>
      work({
        id: `w${index}`,
        workDate: '2026-10-10',
        startTime: `${String(index % 24).padStart(2, '0')}:00`,
      }),
    );
    const reminders = plan({ works: many, undatedCount: 1 });
    expect(reminders).toHaveLength(MAX_SCHEDULED);
    expect(reminders[0].kind).toBe('undated');
    const times = reminders
      .slice(1)
      .map((r) => (r.trigger.type === 'date' ? r.trigger.date.getTime() : 0));
    expect(times).toEqual([...times].sort((a, b) => a - b));
  });
});
