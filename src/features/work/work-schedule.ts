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

/** Soma dias a uma data local sem depender de fuso. */
export function addDaysToLocalDate(date: LocalDate, days: number): LocalDate {
  const [year, month, day] = date.split('-').map(Number);
  const shifted = new Date(year, month - 1, day + days, 12);
  const shiftedMonth = String(shifted.getMonth() + 1).padStart(2, '0');
  const shiftedDay = String(shifted.getDate()).padStart(2, '0');
  return `${shifted.getFullYear()}-${shiftedMonth}-${shiftedDay}`;
}

const EXPECTED_LABEL = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

export function formatExpectedDate(date: LocalDate): string {
  const [year, month, day] = date.split('-').map(Number);
  return EXPECTED_LABEL.format(new Date(year, month - 1, day, 12)).toUpperCase();
}
