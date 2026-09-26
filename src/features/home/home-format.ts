import type { TFunction } from 'i18next';
import {
  differenceInLocalDays,
  formatDayMonth,
  type LocalDate,
  type LocalMonth,
  weekdayShort,
} from '@/domain/calendar';
import type { HomeBody, HomeHero } from './home-data';

type T = TFunction<'home'>;

export type MonthTense = 'past' | 'current' | 'future';

export function monthTense(month: LocalMonth, today: LocalDate): MonthTense {
  const current = today.slice(0, 7);
  return month < current ? 'past' : month > current ? 'future' : 'current';
}

/**
 * Valor e qualificador do topo. Mês passado mostra o que entrou; sem entrada prevista, a
 * mensagem vazia (nunca `R$ 0,00`).
 */
export function heroAmount(
  hero: HomeHero,
  tense: MonthTense,
  monthName: string,
  t: T,
): { amount: bigint; qualifier: string } | null {
  if (!hero.month.hasExpectedEntries) return null;
  if (tense === 'past') {
    return {
      amount: hero.month.receivedCents,
      qualifier: t('hero.pastMonth', { month: monthName.toLowerCase() }),
    };
  }
  return {
    amount: hero.month.expectedTotalCents,
    qualifier:
      tense === 'current'
        ? t('hero.currentMonth')
        : t('hero.futureMonth', { month: monthName.toLowerCase() }),
  };
}

/** Comparação com o mês anterior só com base real: os dois meses com entrada prevista. */
export function heroComparison(
  hero: HomeHero,
): { percent: number; deltaCents: bigint; direction: 'up' | 'down' | 'stable' } | null {
  if (!hero.month.hasExpectedEntries || !hero.previous.hasExpectedEntries) return null;
  const before = hero.previous.expectedTotalCents;
  if (before <= 0n) return null;
  const deltaCents = hero.month.expectedTotalCents - before;
  const percent = Math.round((Number(deltaCents) / Number(before)) * 100);
  return {
    percent,
    deltaCents,
    direction: percent > 0 ? 'up' : percent < 0 ? 'down' : 'stable',
  };
}

/**
 * Página de histórico do carrossel: só quando existe histórico de verdade (o mês e pelo menos
 * um anterior com entrada prevista). Meses sem dado ficam de fora — nunca uma barra zerada.
 */
export function heroHistory(
  hero: HomeHero,
): { month: LocalMonth; expectedTotalCents: bigint; current: boolean }[] | null {
  const bars = hero.history
    .map((item, index) => ({ ...item, current: index === hero.history.length - 1 }))
    .filter((item) => item.expectedTotalCents > 0n);
  const hasCurrent = bars.some((item) => item.current);
  return hasCurrent && bars.length >= 2 ? bars : null;
}

/** `HOJE`, `AMANHÃ` ou `SEX 12 SET` para o próximo trabalho. */
export function temporalLabel(date: LocalDate, today: LocalDate, t: T): string {
  const days = differenceInLocalDays(date, today);
  if (days <= 0) return t('work.today');
  if (days === 1) return t('work.tomorrow');
  return `${weekdayShort(date).toUpperCase()} ${formatDayMonth(date)}`;
}

export type SetupStep = { id: string; label: string };
export type SetupNext =
  | { id: 'first-work' | 'next-work'; label: string; target: 'new-work' }
  | { id: 'dates'; label: string; target: 'edit-work'; workId: string };

/** Depois de alguns trabalhos a fase de configuração acabou: o card não volta a aparecer. */
const SETUP_PHASE_WORKS = 10;

/**
 * Progresso inicial (Home 01/02/06). Passos só do que a pessoa já tem como fazer: residência
 * (só para residentes, contada quando organizada), primeiro trabalho e a visão do mês completa
 * (entradas com data e um próximo trabalho). Completo — ou fora da fase inicial — não existe.
 */
export function setupProgress(
  body: HomeBody,
  t: T,
): { completed: SetupStep[]; total: number; next: SetupNext } | null {
  if (body.totalWorks >= SETUP_PHASE_WORKS) return null;
  const steps: { step: SetupStep; done: boolean }[] = [];
  if (body.isResident && body.hasResidency) {
    steps.push({ step: { id: 'residency', label: t('progress.residencyDone') }, done: true });
  }
  const hasWork = body.totalWorks > 0;
  steps.push({ step: { id: 'first-work', label: t('progress.firstWorkDone') }, done: hasWork });
  const monthComplete = body.undatedCount === 0 && body.upcomingWorks.length > 0;
  steps.push({ step: { id: 'month', label: t('progress.monthDone') }, done: monthComplete });

  let next: SetupNext | null = null;
  if (!hasWork) {
    next = { id: 'first-work', label: t('progress.addFirstWork'), target: 'new-work' };
  } else if (body.undatedCount > 0 && body.firstUndatedWorkId) {
    next = {
      id: 'dates',
      label:
        body.undatedCount === 1
          ? t('progress.addDatesOne')
          : t('progress.addDatesMany', { count: body.undatedCount }),
      target: 'edit-work',
      workId: body.firstUndatedWorkId,
    };
  } else if (body.upcomingWorks.length === 0) {
    next = { id: 'next-work', label: t('progress.addNextWork'), target: 'new-work' };
  }
  if (!next) return null;
  return {
    completed: steps.filter((item) => item.done).map((item) => item.step),
    total: steps.length,
    next,
  };
}
