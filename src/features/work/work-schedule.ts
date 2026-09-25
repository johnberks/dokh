import type { LocalDate } from '@/domain/calendar';

/** Data local de hoje no fuso do usuário, tolerante a `Intl` sem suporte a `timeZone`. */
export function todayInTimezone(timezone: string, now: Date = new Date()): LocalDate {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(now);
  } catch {
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}

export type WorkEnd = { time: string; nextDay: boolean };

/**
 * Término derivado de data, início e duração (o domínio não guarda campo de término).
 * Devolve `null` enquanto faltar algum dado.
 */
export function workEndDescription(
  workDate: LocalDate | null,
  startTime: string | null,
  durationMinutes: number | null,
): WorkEnd | null {
  if (workDate === null || startTime === null || durationMinutes === null) return null;
  const [hours, minutes] = startTime.split(':').map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
  const total = hours * 60 + minutes + durationMinutes;
  const endHours = Math.floor(total / 60) % 24;
  const endMinutes = total % 60;
  return {
    time: `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`,
    nextDay: total >= 24 * 60,
  };
}

/** Prazos de pagamento oferecidos no MVP (D30/D60/D90). */
export const PAYMENT_TERMS = [30, 60, 90] as const;

/** Data local como `Date` ao meio-dia, longe das bordas de horário de verão. */
export function localDateToDate(date: LocalDate): Date {
  const [year, month, day] = date.split('-').map(Number);
  return new Date(year, month - 1, day, 12);
}

/** Dia do calendário local de um `Date` (ex.: o escolhido no seletor nativo). */
export function dateToLocalDate(date: Date): LocalDate {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

/** Soma dias a uma data local sem depender de fuso. */
export function addDaysToLocalDate(date: LocalDate, days: number): LocalDate {
  const [year, month, day] = date.split('-').map(Number);
  return dateToLocalDate(new Date(year, month - 1, day + days, 12));
}

const EXPECTED_LABEL = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

export function formatExpectedDate(date: LocalDate): string {
  return EXPECTED_LABEL.format(localDateToDate(date)).toUpperCase();
}
