import type { TFunction } from 'i18next';
import type { ChartBar } from '@/components/BarChartCard';
import { differenceInLocalDays, type LocalDate, type LocalMonth } from '@/domain/calendar';
import { formatCentsToBRL } from '@/domain/money';
import type {
  EntryOrigin,
  FinanceMonth,
  FinanceYear,
  HourlyMonth,
  OriginAmount,
} from './finance-data';

type T = TFunction<'finances'>;

export type MonthTense = 'past' | 'current' | 'future';

export function monthTense(month: LocalMonth, today: LocalDate): MonthTense {
  const current = today.slice(0, 7);
  return month < current ? 'past' : month > current ? 'future' : 'current';
}

/** Sem nenhum dado no mês: nem entrada prevista, nem pendência sem data, nem trabalho. */
export function isEmptyMonth(data: FinanceMonth): boolean {
  return !data.hasExpectedEntries && data.workCount === 0 && data.undatedCount === 0;
}

/**
 * Valor e legenda do topo. Mês passado mostra o que entrou (e "mês fechado" sem pendência);
 * sem nada previsto, `R$ —` — nunca `R$ 0` inventado.
 */
export function heroCaption(
  data: FinanceMonth,
  tense: MonthTense,
  monthName: string,
  t: T,
): { amount: bigint | null; caption: string } {
  if (!data.hasExpectedEntries) {
    return {
      amount: null,
      caption: isEmptyMonth(data) ? t('hero.nothingYet') : t('hero.nothingExpected'),
    };
  }
  if (tense === 'past') {
    return {
      amount: data.receivedCents,
      caption:
        data.awaitingCents === 0n
          ? t('hero.pastMonthClosed', { month: monthName.toLowerCase() })
          : t('hero.pastMonth', { month: monthName.toLowerCase() }),
    };
  }
  return {
    amount: data.expectedTotalCents,
    caption:
      tense === 'current'
        ? t('hero.currentMonth')
        : t('hero.futureMonth', { month: monthName.toLowerCase() }),
  };
}

/** Percentual recebido do previsto no mês, arredondado para baixo (nunca 100% antes da hora). */
export function receivedPercent(data: FinanceMonth): number {
  if (data.expectedTotalCents === 0n) return 0;
  return Number((data.receivedCents * 100n) / data.expectedTotalCents);
}

export function splitCaption(data: FinanceMonth, tense: MonthTense, t: T): string {
  if (data.awaitingCents === 0n)
    return tense === 'past' ? t('split.closed') : t('split.allReceived');
  return t('split.percent', { percent: receivedPercent(data) });
}

/** `hoje`, `amanhã` ou `em N dias` até a próxima entrada. */
export function relativeDay(date: LocalDate, today: LocalDate, t: T): string {
  const days = differenceInLocalDays(date, today);
  if (days <= 0) return t('next.today');
  return days === 1 ? t('next.tomorrow') : t('next.inDays', { count: days });
}

/** Por que não há próxima entrada — a mensagem acompanha o que existe no mês. */
export function noNextEntryReason(
  data: FinanceMonth,
  tense: MonthTense,
  monthName: string,
  t: T,
): string {
  if (!data.hasExpectedEntries) return t('next.onlyUndated');
  if (data.awaitingCents > 0n)
    return t('next.pendingConfirmation', { month: monthName.toLowerCase() });
  return tense === 'past'
    ? t('next.closed', { month: monthName })
    : t('next.allReceived', { month: monthName.toLowerCase() });
}

export type OriginShare = { origin: EntryOrigin; amountCents: bigint; percent: number };

/** Só origens com valor, da maior para a menor, com a fatia do total (Premium). */
export function originShares(origins: readonly OriginAmount[]): OriginShare[] {
  const present = origins.filter(
    (item): item is { origin: EntryOrigin; amountCents: bigint } =>
      item.amountCents !== null && item.amountCents > 0n,
  );
  const total = present.reduce((sum, item) => sum + item.amountCents, 0n);
  if (total === 0n) return [];
  return present
    .map((item) => ({
      origin: item.origin,
      amountCents: item.amountCents,
      percent: Math.round(Number((item.amountCents * 1000n) / total) / 10),
    }))
    .sort((a, b) => (a.amountCents > b.amountCents ? -1 : a.amountCents < b.amountCents ? 1 : 0));
}

export function hoursLabel(minutes: number): string {
  const hours = minutes / 60;
  return Number.isInteger(hours) ? `${hours}h` : `${hours.toFixed(1).replace('.', ',')}h`;
}

const MONTH_LABELS = [
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
];

/** `5,3k` acima de mil reais; abaixo, o valor inteiro (`850`). */
export function compactReais(cents: bigint): string {
  const reais = Number(cents) / 100;
  if (reais < 1000) return String(Math.round(reais));
  return `${(reais / 1000).toFixed(1).replace('.', ',')}k`;
}

/** Janeiro a dezembro; mês sem dado fica `null` (traço), nunca zero. */
export function yearBars(data: FinanceYear, year: number, today: LocalDate): ChartBar[] {
  const byMonth = new Map(data.months.map((item) => [item.month, item.expectedTotalCents]));
  const currentMonth = today.slice(0, 7);
  return MONTH_LABELS.map((label, index) => {
    const month = `${year}-${String(index + 1).padStart(2, '0')}`;
    const cents = byMonth.get(month);
    const has = cents !== undefined && cents > 0n;
    return {
      key: month,
      label,
      value: has ? Number(cents) : null,
      valueLabel: has ? compactReais(cents) : undefined,
      current: month === currentMonth,
    };
  });
}

export type Projection = {
  /** Previsto de janeiro até o mês atual (inclusive). */
  realizedCents: bigint;
  /** Meses depois do atual, estimados pela média. */
  remainingMonths: number;
  remainingCents: bigint;
  totalCents: bigint;
  averageCents: bigint;
  /** Valor de cada mês até o atual (`null` sem dado) para a linha realizada. */
  points: (number | null)[];
  currentIndex: number;
};

/**
 * Projeção até dezembro (Premium): o que está previsto até o mês atual mais a média mensal
 * nos meses restantes. Só existe no ano corrente e com média (≥ 2 meses de histórico).
 */
export function projectYear(data: FinanceYear, year: number, today: LocalDate): Projection | null {
  if (Number(today.slice(0, 4)) !== year || data.historicalAverageCents === null) return null;
  const currentIndex = Number(today.slice(5, 7)) - 1;
  const byMonth = new Map(data.months.map((item) => [item.month, item.expectedTotalCents]));
  const points: (number | null)[] = [];
  let realized = 0n;
  for (let index = 0; index <= currentIndex; index++) {
    const cents = byMonth.get(`${year}-${String(index + 1).padStart(2, '0')}`);
    points.push(cents === undefined ? null : Number(cents));
    realized += cents ?? 0n;
  }
  const remainingMonths = 11 - currentIndex;
  const remaining = data.historicalAverageCents * BigInt(remainingMonths);
  return {
    realizedCents: realized,
    remainingMonths,
    remainingCents: remaining,
    totalCents: realized + remaining,
    averageCents: data.historicalAverageCents,
    points,
    currentIndex,
  };
}

/** Meses do ano que já têm valor/hora possível: até o atual no ano corrente, todos no passado. */
export function monthsForYearWork(year: number, today: LocalDate): LocalMonth[] {
  const currentYear = Number(today.slice(0, 4));
  if (year > currentYear) return [];
  const last = year < currentYear ? 12 : Number(today.slice(5, 7));
  return Array.from(
    { length: last },
    (_, index) => `${year}-${String(index + 1).padStart(2, '0')}`,
  );
}

/** Valor/hora em reais inteiros (`R$ 109`), como no HTML: os centavos quebravam a linha. */
export function hourlyReais(cents: bigint): string {
  return formatCentsToBRL(((cents + 50n) / 100n) * 100n, { omitZeroCents: true });
}

export type InsightBar = { month: LocalMonth; hourlyCents: number; current: boolean };

export type HourlyInsight = {
  direction: 'up' | 'down' | 'stable';
  /** Variação do mês contra a média dos anteriores, em %. */
  percent: number;
  /** Diferença em centavos (positiva ou negativa). */
  deltaCents: bigint;
  currentCents: bigint;
  bars: InsightBar[];
  previousMonths: LocalMonth[];
  /** Menos trabalhos que a média anterior, com valor/hora maior. */
  fewerWorks: boolean;
};

/**
 * Insight de valor/hora: o mês contra a média dos até dois meses anteriores com valor/hora.
 * Sem o mês atual ou sem nenhum anterior, não há insight — nunca uma tendência inventada.
 * No Free o servidor não entrega valor/hora; a direção vem de gerado ÷ horas (os números
 * continuam ocultos na tela).
 */
export function hourlyInsight(window: readonly HourlyMonth[]): HourlyInsight | null {
  const hourlyOf = (item: HourlyMonth): bigint | null => {
    if (item.hourlyValueCents !== null) return item.hourlyValueCents;
    if (item.workDurationMinutes <= 0 || item.workGeneratedCents <= 0n) return null;
    return (item.workGeneratedCents * 60n) / BigInt(item.workDurationMinutes);
  };
  const current = window[window.length - 1];
  const currentValue = current ? hourlyOf(current) : null;
  if (!current || currentValue === null) return null;
  const previous = window
    .slice(0, -1)
    .map((item) => ({ item, value: hourlyOf(item) }))
    .filter((entry): entry is { item: HourlyMonth; value: bigint } => entry.value !== null);
  if (previous.length === 0) return null;

  const average = previous.reduce((sum, entry) => sum + entry.value, 0n) / BigInt(previous.length);
  if (average <= 0n) return null;
  const deltaCents = currentValue - average;
  const percent = Math.round((Number(deltaCents) / Number(average)) * 100);
  const direction = percent >= 3 ? 'up' : percent <= -3 ? 'down' : 'stable';
  const previousWorks =
    previous.reduce((sum, entry) => sum + entry.item.workCount, 0) / previous.length;
  return {
    direction,
    percent,
    deltaCents,
    currentCents: currentValue,
    bars: [
      ...previous.map((entry) => ({
        month: entry.item.month,
        hourlyCents: Number(entry.value),
        current: false,
      })),
      { month: current.month, hourlyCents: Number(currentValue), current: true },
    ],
    previousMonths: previous.map((entry) => entry.item.month),
    fewerWorks: direction === 'up' && current.workCount < previousWorks,
  };
}
