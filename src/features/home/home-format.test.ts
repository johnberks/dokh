import type { FinanceMonth } from '@/features/finances/finance-data';
import { i18n } from '@/i18n';
import type { HomeBody, HomeHero } from './home-data';
import {
  heroAmount,
  heroComparison,
  heroHistory,
  monthTense,
  setupProgress,
  temporalLabel,
} from './home-format';

const t = i18n.getFixedT('pt-BR', 'home');

const month = (patch: Partial<FinanceMonth> = {}): FinanceMonth => ({
  hasExpectedEntries: true,
  expectedTotalCents: 1245000n,
  receivedCents: 835000n,
  awaitingCents: 410000n,
  undatedCount: 0,
  undatedTotalCents: 0n,
  workGeneratedCents: 0n,
  workCount: 0,
  workDurationMinutes: 0,
  hourlyValueCents: null,
  ...patch,
});

const hero = (patch: Partial<HomeHero> = {}): HomeHero => ({
  month: month(),
  previous: month({ expectedTotalCents: 1110000n }),
  history: [
    { month: '2026-06', expectedTotalCents: 980000n },
    { month: '2026-07', expectedTotalCents: 1040000n },
    { month: '2026-08', expectedTotalCents: 1110000n },
    { month: '2026-09', expectedTotalCents: 1245000n },
  ],
  openCount: 4,
  ...patch,
});

const body = (patch: Partial<HomeBody> = {}): HomeBody => ({
  firstName: 'Anna',
  isResident: true,
  hasResidency: true,
  upcomingWorks: [],
  upcomingEntries: [],
  dueToday: [],
  overdue: [],
  undatedCount: 0,
  undatedTotalCents: 0n,
  firstUndatedWorkId: null,
  totalWorks: 1,
  ...patch,
});

describe('topo da Home', () => {
  it('valor e qualificador por tempo do mês; mês vazio não vira R$ 0', () => {
    expect(heroAmount(hero(), 'current', 'Setembro', t)).toEqual({
      amount: 1245000n,
      qualifier: 'para receber este mês',
    });
    expect(heroAmount(hero(), 'past', 'Agosto', t)).toEqual({
      amount: 835000n,
      qualifier: 'recebidos em agosto',
    });
    expect(heroAmount(hero(), 'future', 'Outubro', t)?.qualifier).toBe('para receber em outubro');
    expect(
      heroAmount(hero({ month: month({ hasExpectedEntries: false }) }), 'current', 'Setembro', t),
    ).toBeNull();
    expect(monthTense('2026-08', '2026-09-26')).toBe('past');
  });

  it('comparação só com o mês anterior real', () => {
    expect(heroComparison(hero())).toEqual({ percent: 12, deltaCents: 135000n, direction: 'up' });
    expect(heroComparison(hero({ previous: month({ hasExpectedEntries: false }) }))).toBeNull();
  });

  it('histórico só com o mês e pelo menos um anterior; meses sem dado ficam de fora', () => {
    expect(heroHistory(hero())).toHaveLength(4);
    const sparse = hero({
      history: [
        { month: '2026-06', expectedTotalCents: 0n },
        { month: '2026-07', expectedTotalCents: 0n },
        { month: '2026-08', expectedTotalCents: 1110000n },
        { month: '2026-09', expectedTotalCents: 1245000n },
      ],
    });
    expect(heroHistory(sparse)?.map((bar) => bar.month)).toEqual(['2026-08', '2026-09']);
    const first = hero({
      history: [
        { month: '2026-06', expectedTotalCents: 0n },
        { month: '2026-07', expectedTotalCents: 0n },
        { month: '2026-08', expectedTotalCents: 0n },
        { month: '2026-09', expectedTotalCents: 410609n },
      ],
    });
    expect(heroHistory(first)).toBeNull();
  });

  it('relação temporal do próximo trabalho', () => {
    expect(temporalLabel('2026-09-26', '2026-09-26', t)).toBe('HOJE');
    expect(temporalLabel('2026-09-27', '2026-09-26', t)).toBe('AMANHÃ');
    expect(temporalLabel('2026-10-02', '2026-09-26', t)).toBe('SEX 02 OUT');
  });
});

describe('progresso inicial', () => {
  const work = { id: 'w1' } as HomeBody['upcomingWorks'][number];

  it('residente com residência e primeiro trabalho: falta a visão do mês', () => {
    const progress = setupProgress(body({ upcomingWorks: [] }), t);
    expect(progress?.completed.map((step) => step.id)).toEqual(['residency', 'first-work']);
    expect(progress?.total).toBe(3);
    expect(progress?.next).toMatchObject({ id: 'next-work', target: 'new-work' });
  });

  it('valores sem data vêm primeiro e levam ao trabalho', () => {
    const progress = setupProgress(
      body({ upcomingWorks: [work], undatedCount: 2, firstUndatedWorkId: 'w9' }),
      t,
    );
    expect(progress?.next).toEqual({
      id: 'dates',
      label: 'Adicionar datas a 2 entradas',
      target: 'edit-work',
      workId: 'w9',
    });
  });

  it('generalista sem trabalho: dois passos e o primeiro trabalho como próxima ação', () => {
    const progress = setupProgress(
      body({ isResident: false, hasResidency: false, totalWorks: 0 }),
      t,
    );
    expect(progress?.total).toBe(2);
    expect(progress?.completed).toEqual([]);
    expect(progress?.next.id).toBe('first-work');
  });

  it('completo ou fora da fase inicial: o card não existe', () => {
    expect(setupProgress(body({ upcomingWorks: [work] }), t)).toBeNull();
    expect(setupProgress(body({ totalWorks: 30, upcomingWorks: [] }), t)).toBeNull();
  });
});
