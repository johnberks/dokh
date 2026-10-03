import type { LocalDate } from '@/domain/calendar';

const formatters = new Map<string, Intl.DateTimeFormat>();

function formatterFor(timeZone: string): Intl.DateTimeFormat {
  let formatter = formatters.get(timeZone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    formatters.set(timeZone, formatter);
  }
  return formatter;
}

/** Diferença (ms) entre o relógio do fuso e o UTC naquele instante. */
function offsetAt(instant: number, timeZone: string): number {
  const parts: Record<string, number> = {};
  for (const part of formatterFor(timeZone).formatToParts(new Date(instant))) {
    if (part.type !== 'literal') parts[part.type] = Number(part.value);
  }
  const asUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour === 24 ? 0 : parts.hour,
    parts.minute,
    parts.second,
  );
  return asUtc - (instant - (instant % 1000));
}

/**
 * Instante em que o relógio de `timeZone` marca `date` às `time` (`HH:MM`). Lembretes são
 * agendados por instante absoluto: o plantão às 19:00 de São Paulo dispara às 17:00 de lá,
 * mesmo que o aparelho esteja em outro fuso. Fuso inválido cai no fuso do aparelho.
 */
export function zonedDateTime(date: LocalDate, time: string, timeZone: string): Date {
  const [year, month, day] = date.split('-').map(Number);
  const [hour, minute] = time.split(':').map(Number);
  const wall = Date.UTC(year, month - 1, day, hour, minute);
  try {
    // Duas passadas acertam a virada do horário de verão.
    let instant = wall - offsetAt(wall, timeZone);
    instant = wall - offsetAt(instant, timeZone);
    return new Date(instant);
  } catch {
    return new Date(year, month - 1, day, hour, minute);
  }
}
