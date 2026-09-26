import type { TFunction } from 'i18next';
import { formatDayMonth, type LocalDate, weekdayShort } from '@/domain/calendar';
import { workEndDescription } from '@/features/work/work-schedule';
import type { AgendaWork } from './agenda-data';

type T = TFunction<'agenda'>;

/** `12h`, ou `7h30` quando não fecha em horas. */
export function durationLabel(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours}h` : `${hours}h${String(rest).padStart(2, '0')}`;
}

/** `HOJE · 25 SET` ou `12 SET · SEX`, como na Agenda 01–05. */
export function dayLabel(date: LocalDate, today: LocalDate, t: T): string {
  return date === today
    ? t('day.today', { date: formatDayMonth(date) })
    : `${formatDayMonth(date)} · ${weekdayShort(date)}`;
}

export function dayCountLabel(count: number, t: T): string {
  if (count === 0) return t('day.free');
  return count === 1 ? t('day.one') : t('day.many', { count });
}

/**
 * Horário do card: Plantão mostra o início; Procedimento/Atendimento com duração mostram o
 * intervalo (`08:00–12:00`). Sem horário, nada — nunca um `00:00` inventado.
 */
export function workTimeLabel(work: AgendaWork): string | undefined {
  if (work.startTime === null) return undefined;
  if (work.type === 'shift' || work.durationMinutes === null) return work.startTime;
  const end = workEndDescription(work.workDate, work.startTime, work.durationMinutes);
  return end ? `${work.startTime}–${end.time}` : work.startTime;
}

/** `Plantão · 12h`, `Procedimento · Cirurgia` ou só o tipo. */
export function workKindLabel(work: AgendaWork, t: T): string {
  const type = t(`workType.${work.type}` as 'workType.shift');
  const detail =
    work.description?.trim() ||
    (work.durationMinutes === null ? null : durationLabel(work.durationMinutes));
  return detail ? `${type} · ${detail}` : type;
}

export type CardPaymentState =
  | 'received'
  | 'scheduled'
  | 'due_today'
  | 'undated'
  | 'confirmation_pending';

/**
 * Estado do Recebível no card. Data passada sem confirmação é pendência, nunca "recebido"
 * automático; "sem previsão" é estado válido, não erro.
 */
export function workPayment(work: AgendaWork, t: T): { state: CardPaymentState; label: string } {
  const date = work.expectedOn === null ? '' : formatDayMonth(work.expectedOn);
  switch (work.receiptStatus) {
    case 'received':
      return { state: 'received', label: t('payment.received') };
    case 'due_today':
      return { state: 'due_today', label: t('payment.dueToday') };
    case 'confirmation_pending':
      return { state: 'confirmation_pending', label: t('payment.pending', { date }) };
    case 'scheduled':
      return { state: 'scheduled', label: t('payment.scheduled', { date }) };
    default:
      return { state: 'undated', label: t('payment.undated') };
  }
}
