import { addDays, format, getDaysInMonth, isValid, parse } from 'date-fns';

/** Data local sem horário, `YYYY-MM-DD` (mesmo formato de `work_date`/`expected_on`). */
export type LocalDate = string;
/** Mês local, `YYYY-MM`. */
export type LocalMonth = string;
/** 0 = Domingo, 1 = Segunda (preferência do usuário, D39). */
export type WeekStart = 0 | 1;

const DATE_FORMAT = 'yyyy-MM-dd';
const MONTH_FORMAT = 'yyyy-MM';
// Meio-dia evita que mudanças de horário à meia-noite desloquem o dia em algum fuso.
const REFERENCE = new Date(2000, 0, 1, 12);

function parseStrict(value: string, pattern: string): Date | null {
  const parsed = parse(value, pattern, REFERENCE);
  return isValid(parsed) && format(parsed, pattern) === value ? parsed : null;
}

export function isLocalDate(value: string): value is LocalDate {
  return parseStrict(value, DATE_FORMAT) !== null;
}

export function isLocalMonth(value: string): value is LocalMonth {
  return parseStrict(value, MONTH_FORMAT) !== null;
}

export function monthOf(date: LocalDate): LocalMonth {
  return date.slice(0, 7);
}

export function shiftMonth(month: LocalMonth, delta: number): LocalMonth {
  const start = parseStrict(month, MONTH_FORMAT);
  if (!start) throw new RangeError(`Mês inválido: ${month}`);
  return format(new Date(start.getFullYear(), start.getMonth() + delta, 1, 12), MONTH_FORMAT);
}

export type CalendarCell = { date: LocalDate; day: number; weekday: number } | null;

/**
 * Semanas do mês com células vazias antes do dia 1 e depois do último dia,
 * alinhadas ao início de semana escolhido. Sempre 7 colunas; 4 a 6 linhas.
 */
export function buildMonthGrid(month: LocalMonth, weekStartsOn: WeekStart): CalendarCell[][] {
  const first = parseStrict(month, MONTH_FORMAT);
  if (!first) throw new RangeError(`Mês inválido: ${month}`);

  const leading = (first.getDay() - weekStartsOn + 7) % 7;
  const cells: CalendarCell[] = Array.from({ length: leading }, () => null);
  const total = getDaysInMonth(first);
  for (let offset = 0; offset < total; offset++) {
    const date = addDays(first, offset);
    cells.push({ date: format(date, DATE_FORMAT), day: offset + 1, weekday: date.getDay() });
  }
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks: CalendarCell[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

/** Ordem dos dias da semana (0 = Domingo) para o cabeçalho. */
export function weekdayOrder(weekStartsOn: WeekStart): number[] {
  return Array.from({ length: 7 }, (_, i) => (i + weekStartsOn) % 7);
}

/** Comparação lexicográfica é válida para `YYYY-MM-DD`. */
export function compareLocalDates(a: LocalDate, b: LocalDate): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

const MONTH_ABBREVIATIONS = [
  'JAN',
  'FEV',
  'MAR',
  'ABR',
  'MAI',
  'JUN',
  'JUL',
  'AGO',
  'SET',
  'OUT',
  'NOV',
  'DEZ',
] as const;
const WEEKDAY_ABBREVIATIONS = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'] as const;

/**
 * Rótulo curto dos designs (`14 SET`, `14 SET 2026`), montado à mão: o `Intl` em pt-BR
 * devolve "14 de set." e varia entre motores.
 */
export function formatDayMonth(date: LocalDate, options: { year?: boolean } = {}): string {
  const [year, month, day] = date.split('-').map(Number);
  const label = `${String(day).padStart(2, '0')} ${MONTH_ABBREVIATIONS[month - 1]}`;
  return options.year ? `${label} ${year}` : label;
}

/** Dia da semana abreviado (`SEG`), calculado sem fuso a partir da data local. */
export function weekdayShort(date: LocalDate): string {
  const [year, month, day] = date.split('-').map(Number);
  return WEEKDAY_ABBREVIATIONS[new Date(Date.UTC(year, month - 1, day)).getUTCDay()];
}
