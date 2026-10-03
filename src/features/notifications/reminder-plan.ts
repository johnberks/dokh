import type { LocalDate } from '@/domain/calendar';
import { formatCentsToBRL } from '@/domain/money';
import type { WorkType } from '@/domain/work-type';
import { addDaysToLocalDate, todayInTimezone } from '@/features/work/work-schedule';
import type { NotificationPreferences } from './notification-preferences';
import { zonedDateTime } from './zoned-time';

/** O iOS guarda até 64 avisos agendados por app; a DOKH usa no máximo 60. */
export const MAX_SCHEDULED = 60;
/** Janela agendada a cada sincronização; reabrir o app empurra a janela adiante. */
export const RECEIVABLE_HORIZON_DAYS = 60;
export const WORK_HORIZON_DAYS = 30;
/** Lembrete semanal de trabalhos sem data: segunda-feira, 9h. */
export const UNDATED_WEEKLY = { weekday: 2, hour: 9, minute: 0 } as const;
/** Trabalho sem horário é lembrado na manhã do dia (ou na véspera, com antecedência de 1 dia). */
const UNTIMED_WORK_TIME = '08:00';
const EVE_TIME = '20:00';

export type ReminderReceivable = {
  receivableId: string;
  workId: string | null;
  /** Nome do Local, ou `null` para a bolsa da residência. */
  originName: string | null;
  amountCents: bigint;
  expectedOn: LocalDate;
};

export type ReminderWork = {
  id: string;
  workDate: LocalDate;
  startTime: string | null;
  type: WorkType;
  locationName: string;
  /** Fuso em que o Trabalho foi registrado (o horário vale nele). */
  timezone: string;
};

export type ReminderSources = {
  receivables: ReminderReceivable[];
  works: ReminderWork[];
  undatedCount: number;
};

export type ReminderTrigger =
  | { type: 'date'; date: Date }
  | { type: 'weekly'; weekday: number; hour: number; minute: number };

export type PlannedReminder = {
  /** Estável por conteúdo: o mesmo plano gera os mesmos ids. */
  id: string;
  kind: 'receivable' | 'work' | 'undated';
  title: string;
  body: string;
  trigger: ReminderTrigger;
  /** Destino ao tocar no aviso. */
  url: string;
};

export type ReminderTexts = {
  residency: string;
  receivableTitle: (amount: string, count: number) => string;
  receivableBody: (origins: string) => string;
  joinOrigins: (names: string[]) => string;
  workTitle: (
    type: WorkType,
    lead: NotificationPreferences['workReminderMinutes'] | 'today',
    time: string | null,
  ) => string;
  workBody: (place: string, time: string | null) => string;
  undatedTitle: string;
  undatedBody: (count: number) => string;
};

const money = (cents: bigint) => formatCentsToBRL(cents, { omitZeroCents: true });

/**
 * Plano de avisos locais (D53, D80): entrada no dia previsto (manhã, um aviso por dia somando as
 * entradas), lembrete antes de cada Trabalho e, se houver Trabalhos sem data de entrada, um
 * lembrete semanal. Recebido, pendência passada e residência seguem as regras do Recebível: só
 * entra o que ainda vai entrar. Nada no passado é agendado.
 */
export function planReminders({
  now,
  timezone,
  preferences,
  sources,
  texts,
}: {
  now: Date;
  /** Fuso da pessoa (manhã da entrada). */
  timezone: string;
  preferences: NotificationPreferences;
  sources: ReminderSources;
  texts: ReminderTexts;
}): PlannedReminder[] {
  const dated: (PlannedReminder & { trigger: { type: 'date'; date: Date } })[] = [];
  const today = todayInTimezone(timezone, now);

  if (preferences.receivableDueDay) {
    const lastDay = addDaysToLocalDate(today, RECEIVABLE_HORIZON_DAYS);
    const byDay = new Map<LocalDate, ReminderReceivable[]>();
    for (const receivable of sources.receivables) {
      if (receivable.expectedOn < today || receivable.expectedOn > lastDay) continue;
      const day = byDay.get(receivable.expectedOn) ?? [];
      day.push(receivable);
      byDay.set(receivable.expectedOn, day);
    }
    for (const [day, entries] of byDay) {
      const date = zonedDateTime(day, preferences.receivableDueTime, timezone);
      if (date <= now) continue;
      const total = entries.reduce((sum, entry) => sum + entry.amountCents, 0n);
      const names = [...new Set(entries.map((entry) => entry.originName ?? texts.residency))];
      const single = entries.length === 1 ? entries[0] : null;
      dated.push({
        id: `receivable-${day}`,
        kind: 'receivable',
        title: texts.receivableTitle(money(total), entries.length),
        body: texts.receivableBody(texts.joinOrigins(names)),
        trigger: { type: 'date', date },
        // Uma entrada de Trabalho abre o detalhe, onde está "Marcar como recebido".
        url: single?.workId
          ? `/work/${single.workId}`
          : `/finances/entries?month=${day.slice(0, 7)}`,
      });
    }
  }

  if (preferences.upcomingWorkReminder) {
    const lastDay = addDaysToLocalDate(today, WORK_HORIZON_DAYS);
    const lead = preferences.workReminderMinutes;
    for (const work of sources.works) {
      if (work.workDate < addDaysToLocalDate(today, -1) || work.workDate > lastDay) continue;
      let date: Date;
      let when: NotificationPreferences['workReminderMinutes'] | 'today';
      if (work.startTime) {
        const start = zonedDateTime(work.workDate, work.startTime, work.timezone);
        date = new Date(start.getTime() - lead * 60_000);
        when = lead;
      } else if (lead === 1440) {
        date = zonedDateTime(addDaysToLocalDate(work.workDate, -1), EVE_TIME, work.timezone);
        when = 1440;
      } else {
        date = zonedDateTime(work.workDate, UNTIMED_WORK_TIME, work.timezone);
        when = 'today';
      }
      if (date <= now) continue;
      dated.push({
        id: `work-${work.id}`,
        kind: 'work',
        title: texts.workTitle(work.type, when, work.startTime),
        body: texts.workBody(work.locationName, work.startTime),
        trigger: { type: 'date', date },
        url: `/work/${work.id}`,
      });
    }
  }

  dated.sort((a, b) => a.trigger.date.getTime() - b.trigger.date.getTime());
  const plan: PlannedReminder[] = [];
  if (preferences.undatedWeeklyReminder && sources.undatedCount > 0) {
    plan.push({
      id: 'undated-weekly',
      kind: 'undated',
      title: texts.undatedTitle,
      body: texts.undatedBody(sources.undatedCount),
      trigger: { type: 'weekly', ...UNDATED_WEEKLY },
      url: '/',
    });
  }
  return [...plan, ...dated.slice(0, MAX_SCHEDULED - plan.length)];
}
