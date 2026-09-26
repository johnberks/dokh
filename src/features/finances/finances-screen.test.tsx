import '@/i18n';
import { act, fireEvent, screen } from '@testing-library/react-native';
import { router } from 'expo-router';
import { monthOf } from '@/domain/calendar';
import { deviceTimezone } from '@/features/onboarding/profile-data';
import { todayInTimezone } from '@/features/work/work-schedule';
import { renderWithProviders } from '@/test/render';
import { FinancesScreen } from './FinancesScreen';
import type { FinanceMonth } from './finance-data';

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn() },
  useFocusEffect: (effect: () => undefined) => jest.requireActual('react').useEffect(effect, []),
}));
jest.mock('@/features/auth/AuthSessionProvider', () => ({
  AuthSessionProvider: ({ children }: { children: React.ReactNode }) => children,
  useAuthSession: () => ({ status: 'signedIn', userId: 'user-1' }),
}));

type Query<T> = { isPending: boolean; isError: boolean; isSuccess: boolean; data?: T };
const ok = <T,>(data: T): Query<T> => ({ isPending: false, isError: false, isSuccess: true, data });
let mockPremium: Query<boolean> = ok(false);
let mockMonth: Query<FinanceMonth> = ok(undefined as never);
let mockOrigins: Query<unknown> = ok([]);
let mockNext: Query<unknown> = ok(null);
let mockUndated: Query<unknown> = ok([]);
let mockYear: Query<unknown> = ok(undefined);
let mockYearOrigins: Query<unknown> = ok([]);
let mockHourlyWindow: Query<unknown> = ok([]);
let mockYearWork: Query<unknown> = ok({ hourlyValueCents: null, hourlyEvolutionPercent: null });
const mockRefetch = jest.fn();

// A contagem do valor do topo tem seu próprio teste; aqui o valor aparece direto.
jest.mock('@/theme/useReducedMotion', () => ({ useReducedMotion: () => true }));
jest.mock('@/features/billing/entitlement', () => ({ usePremium: () => mockPremium }));
jest.mock('./finance-data', () => ({
  ...jest.requireActual('./finance-data'),
  useFinanceMonth: () => ({ ...mockMonth, refetch: mockRefetch, isFetching: false }),
  useFinanceOrigins: () => mockOrigins,
  useNextEntry: () => mockNext,
  useUndatedPreviews: () => mockUndated,
  useFinanceYear: () => ({ ...mockYear, refetch: mockRefetch, isFetching: false }),
  useYearOrigins: () => mockYearOrigins,
  useYearWork: () => mockYearWork,
  useHourlyWindow: () => mockHourlyWindow,
}));

const today = todayInTimezone(deviceTimezone());
const current = monthOf(today);

const month = (patch: Partial<FinanceMonth> = {}): FinanceMonth => ({
  hasExpectedEntries: true,
  expectedTotalCents: 1245000n,
  receivedCents: 835000n,
  awaitingCents: 410000n,
  undatedCount: 0,
  undatedTotalCents: 0n,
  workGeneratedCents: 1480000n,
  workCount: 7,
  workDurationMinutes: 5040,
  hourlyValueCents: 17600n,
  ...patch,
});

beforeEach(() => {
  jest.clearAllMocks();
  mockPremium = ok(false);
  mockMonth = ok(month());
  mockOrigins = ok([
    { origin: 'shift', amountCents: null },
    { origin: 'procedure', amountCents: null },
    { origin: 'appointment', amountCents: null },
    { origin: 'residency', amountCents: null },
  ]);
  mockNext = ok({
    receivableId: 'r1',
    origin: 'residency',
    locationName: null,
    amountCents: 410609n,
    expectedOn: today,
    following: [],
    moreCount: 0,
  });
  mockUndated = ok([]);
  mockYear = ok({
    months: [{ month: current, expectedTotalCents: 1245000n, receivedCents: 835000n }],
    totalCents: 1245000n,
    receivedCents: 835000n,
    awaitingCents: 410000n,
    historicalMonthCount: 0,
    historicalAverageCents: null,
  });
  mockYearOrigins = ok([]);
  mockHourlyWindow = ok([]);
  mockYearWork = ok({
    hourlyValueCents: null,
    hourlyEvolutionPercent: null,
    workCount: 7,
    workDurationMinutes: 5040,
    hourlyMinutes: 0,
  });
});

describe('Finanças — mês', () => {
  it('mês atual: previsto, recebido × a receber, percentual e próxima entrada', async () => {
    await renderWithProviders(<FinancesScreen />);
    expect(screen.getByText('previstos para entrar este mês')).toBeTruthy();
    expect(screen.getByTestId('finances-split-received')).toBeTruthy();
    expect(screen.getByTestId('finances-split-awaiting')).toBeTruthy();
    // Card único sobre o topo verde, como o calendário da Agenda.
    expect(screen.getByTestId('finances-split-wrap')).toHaveStyle({ marginTop: -114 });
    // Mesma altura de verde da Início e da Agenda.
    expect(screen.getByTestId('two-tone-hero')).toHaveStyle({ height: 272 });
    expect(screen.getByText('67% recebido')).toBeTruthy();
    expect(screen.getByTestId('finances-next')).toBeTruthy();
    // O tempo que falta é a manchete; no dia, a etiqueta vira "Hoje" e dá para confirmar ali.
    expect(screen.getByTestId('finances-next-when').props.children).toBe('Hoje');
    expect(screen.getByTestId('finances-next-tag')).toHaveTextContent('Hoje');
    expect(screen.getByTestId('finances-next-confirm')).toBeTruthy();
    // Sem pendência, nenhum card de revisão.
    expect(screen.queryByTestId('finances-review')).toBeNull();
    // A próxima entrada leva ao extrato do mês.
    expect(screen.getByText('Ver entradas')).toBeTruthy();
    await act(async () => {
      await fireEvent.press(screen.getByTestId('finances-next-see-entries'));
    });
    expect(router.push).toHaveBeenCalledWith({
      pathname: '/finances/entries',
      params: { month: current },
    });
  });

  it('próxima entrada futura: "Previsto", sem confirmar, e as seguintes do mês', async () => {
    const [y, m, d] = today.split('-').map(Number);
    const plus = (days: number) => {
      const date = new Date(Date.UTC(y, m - 1, d + days));
      return date.toISOString().slice(0, 10);
    };
    mockNext = ok({
      receivableId: 'r1',
      origin: 'shift',
      locationName: 'Hospital São Lucas',
      amountCents: 120000n,
      expectedOn: plus(1),
      following: [
        {
          receivableId: 'r2',
          origin: 'procedure',
          locationName: 'Hospital São Camilo',
          amountCents: 140000n,
          expectedOn: plus(8),
        },
      ],
      moreCount: 3,
    });
    await renderWithProviders(<FinancesScreen />);
    expect(screen.getByTestId('finances-next-when').props.children).toBe('Amanhã');
    expect(screen.getByTestId('finances-next-tag')).toHaveTextContent('Previsto');
    expect(screen.queryByTestId('finances-next-confirm')).toBeNull();
    expect(screen.getByText('Hospital São Lucas')).toBeTruthy();
    expect(screen.getByTestId('finances-next-following')).toBeTruthy();
    expect(screen.getByText('+3 entradas até o fim do mês')).toBeTruthy();
  });

  it('Free: origem e valor/hora ocultos com selo Premium, sem números inventados', async () => {
    await renderWithProviders(<FinancesScreen />);
    expect(screen.getByTestId('finances-origin-locked')).toBeTruthy();
    expect(screen.getByTestId('finances-origin-premium')).toBeTruthy();
    expect(screen.getByTestId('finances-hourly')).toBeTruthy();
    expect(screen.queryByText(/176/)).toBeNull();
  });

  it('Premium liberado: números reais e nenhum selo ou cadeado', async () => {
    mockPremium = ok(true);
    mockOrigins = ok([
      { origin: 'shift', amountCents: 300000n },
      { origin: 'procedure', amountCents: 0n },
      { origin: 'appointment', amountCents: 0n },
      { origin: 'residency', amountCents: 945000n },
    ]);
    await renderWithProviders(<FinancesScreen />);
    expect(screen.queryByTestId('finances-origin-premium')).toBeNull();
    expect(screen.queryByTestId('finances-origin-locked')).toBeNull();
    expect(screen.queryByText('PREMIUM')).toBeNull();
    // Residência aparece na próxima entrada e na origem.
    expect(screen.getAllByText('Residência')).toHaveLength(2);
    expect(screen.getByText('76%')).toBeTruthy();
    expect(screen.getByText(/176/)).toBeTruthy();
    expect(screen.getByText('valor/hora')).toBeTruthy();
  });

  it('tudo recebido: 100% e "Nenhuma prevista"', async () => {
    mockMonth = ok(month({ receivedCents: 1245000n, awaitingCents: 0n }));
    mockNext = ok(null);
    await renderWithProviders(<FinancesScreen />);
    expect(screen.getByText('100% recebido · nada em aberto')).toBeTruthy();
    expect(screen.getByTestId('finances-no-next')).toBeTruthy();
    // Com entradas no mês, o atalho abre o extrato do mês.
    await act(async () => {
      await fireEvent.press(screen.getByTestId('finances-no-next-action'));
    });
    expect(router.push).toHaveBeenCalledWith({
      pathname: '/finances/entries',
      params: { month: expect.any(String) },
    });
  });

  it('mês passado fechado mostra o que entrou', async () => {
    mockMonth = ok(
      month({ receivedCents: 1632000n, awaitingCents: 0n, expectedTotalCents: 1632000n }),
    );
    await renderWithProviders(<FinancesScreen />);
    await act(async () => {
      await fireEvent.press(screen.getByTestId('finances-month-previous'));
    });
    expect(screen.getByText(/^entraram em .* · mês fechado$/)).toBeTruthy();
    expect(screen.getByText('100% recebido · mês fechado')).toBeTruthy();
  });

  it('somente sem data: R$ —, revisão no mês atual e trabalho gerado preservado', async () => {
    mockMonth = ok(
      month({
        hasExpectedEntries: false,
        expectedTotalCents: 0n,
        receivedCents: 0n,
        awaitingCents: 0n,
        undatedCount: 3,
        undatedTotalCents: 360000n,
        workGeneratedCents: 360000n,
        workCount: 3,
      }),
    );
    mockUndated = ok([
      {
        workId: 'w1',
        type: 'procedure',
        locationName: 'Hospital São Lucas',
        description: 'Cirurgia',
        colorToken: 'bronze',
        amountCents: 150000n,
      },
    ]);
    await renderWithProviders(<FinancesScreen />);
    expect(screen.getByText('R$ —')).toBeTruthy();
    expect(screen.getByText('nada previsto para entrar ainda')).toBeTruthy();
    expect(screen.queryByTestId('finances-split-received')).toBeNull();
    expect(screen.queryByTestId('finances-split-wrap')).toBeNull();
    expect(screen.getByText('REVISÃO NECESSÁRIA · 3 ENTRADAS')).toBeTruthy();
    expect(screen.getByTestId('finances-work')).toBeTruthy();

    await act(async () => {
      await fireEvent.press(screen.getByTestId('finances-review'));
    });
    expect(router.push).toHaveBeenCalledWith({ pathname: '/work/edit/[id]', params: { id: 'w1' } });

    // Em outro mês a pendência não reaparece.
    await act(async () => {
      await fireEvent.press(screen.getByTestId('finances-month-next'));
    });
    expect(screen.queryByTestId('finances-review')).toBeNull();
  });

  it('sem trabalhos: convite para adicionar, sem cards de R$ 0', async () => {
    mockMonth = ok(month({ hasExpectedEntries: false, workCount: 0, undatedCount: 0 }));
    await renderWithProviders(<FinancesScreen />);
    expect(screen.getByText('nada registrado ainda')).toBeTruthy();
    expect(screen.getByTestId('finances-empty')).toBeTruthy();
    expect(screen.queryByTestId('finances-split-received')).toBeNull();
    expect(screen.queryByTestId('finances-work')).toBeNull();
    await act(async () => {
      await fireEvent.press(screen.getByTestId('finances-empty-action'));
    });
    expect(router.push).toHaveBeenCalledWith('/work/new');
  });

  it('falha de leitura mostra erro, nunca mês vazio', async () => {
    mockMonth = { isPending: false, isError: true, isSuccess: false };
    await renderWithProviders(<FinancesScreen />);
    expect(screen.getByTestId('finances-error')).toBeTruthy();
    expect(screen.queryByTestId('finances-empty')).toBeNull();
    expect(screen.queryByText('R$ —')).toBeNull();
  });

  it('abre no mês atual', async () => {
    await renderWithProviders(<FinancesScreen />);
    expect(screen.getByText(` ${current.slice(0, 4)}`)).toBeTruthy();
  });
});

describe('Finanças — topo e explicações', () => {
  it('topo tem só a troca de mês e o seletor, sem "SUAS FINANÇAS"', async () => {
    await renderWithProviders(<FinancesScreen />);
    expect(screen.queryByText('SUAS FINANÇAS')).toBeNull();
    expect(screen.getByTestId('finances-month-title')).toBeTruthy();
    expect(screen.getByTestId('finances-mode-year')).toBeTruthy();
  });

  it('o i do topo e os blocos abrem a explicação com o valor do mês', async () => {
    await renderWithProviders(<FinancesScreen />);
    await act(async () => {
      await fireEvent.press(screen.getByTestId('finances-info-expected'));
    });
    expect(screen.getByText('PREVISTO PARA ENTRAR')).toBeTruthy();
    expect(screen.getByTestId('finance-info-value').props.children).toMatch(/12\.450/);

    await act(async () => {
      await fireEvent.press(screen.getByTestId('finances-split-awaiting'));
    });
    // O bloco e a folha dizem "A RECEBER"; a folha traz o valor do bloco.
    expect(screen.getAllByText('A RECEBER')).toHaveLength(2);
    expect(screen.getByTestId('finance-info-value').props.children).toMatch(/4\.100/);
  });

  it('revisão necessária sem o texto de apoio', async () => {
    mockMonth = ok(month({ undatedCount: 1, undatedTotalCents: 85000n }));
    mockUndated = ok([
      {
        workId: 'w9',
        type: 'shift',
        locationName: 'Ubs Xpto',
        description: null,
        colorToken: 'sage',
        amountCents: 85000n,
      },
    ]);
    await renderWithProviders(<FinancesScreen />);
    expect(screen.getByTestId('finances-review')).toBeTruthy();
    expect(screen.queryByText('Estes valores não entram no total do mês.')).toBeNull();
  });
});

describe('Finanças — valor/hora e insight', () => {
  const window = (current: bigint | null) => [
    {
      month: '2026-07',
      hourlyValueCents: 14800n,
      workCount: 9,
      workGeneratedCents: 0n,
      workDurationMinutes: 600,
    },
    {
      month: '2026-08',
      hourlyValueCents: 16200n,
      workCount: 8,
      workGeneratedCents: 0n,
      workDurationMinutes: 600,
    },
    {
      month: '2026-09',
      hourlyValueCents: current,
      workCount: 7,
      workGeneratedCents: 0n,
      workDurationMinutes: 600,
    },
  ];

  it('valor/hora em reais inteiros numa linha só (sem quebrar como R$ 109,26)', async () => {
    mockPremium = ok(true);
    mockMonth = ok(month({ hourlyValueCents: 10926n }));
    await renderWithProviders(<FinancesScreen />);
    const value = screen.getByTestId('finances-hourly-value');
    expect(value.props.numberOfLines).toBe(1);
    expect(value.props.adjustsFontSizeToFit).toBe(true);
    expect(screen.queryByText(/109,26/)).toBeNull();
    expect(screen.getByText(/R\$\s?109/)).toBeTruthy();
  });

  it('Premium: insight com barras, variação e frase com números reais', async () => {
    mockPremium = ok(true);
    mockHourlyWindow = ok(window(17600n));
    await renderWithProviders(<FinancesScreen />);
    expect(screen.getByText('Seu valor/hora está aumentando.')).toBeTruthy();
    expect(screen.getByTestId('finances-insight-delta').props.children).toBe('↑ 14%');
    expect(screen.getByTestId('finances-insight-text').props.children).toMatch(
      /^R\$\s?176 por hora em setembro — R\$\s?21 acima da média de julho e agosto\. Menos trabalhos, valor maior\.$/,
    );
    expect(screen.queryByTestId('finances-insight-premium')).toBeNull();
    await act(async () => {
      await fireEvent.press(screen.getByTestId('finances-insight-analysis'));
    });
    expect(router.push).toHaveBeenCalledWith({
      pathname: '/finances/hourly',
      params: { month: current },
    });
  });

  it('Free: conclusão visível, números ocultos e selo', async () => {
    mockHourlyWindow = ok(
      window(null).map((item) => ({
        ...item,
        hourlyValueCents: null,
        workGeneratedCents: item.month === '2026-09' ? 176000n : 150000n,
      })),
    );
    await renderWithProviders(<FinancesScreen />);
    expect(screen.getByText('Seu valor/hora está aumentando.')).toBeTruthy();
    expect(screen.getByTestId('finances-insight-delta').props.children).toBe('↑ ••%');
    expect(screen.getByTestId('finances-insight-premium')).toBeTruthy();
    expect(screen.getByTestId('finances-insight-text').props.children).toMatch(
      /Descubra quanto\.$/,
    );
    // Análise completa é 100% Premium: sem link no Free até o fluxo de benefícios (5.5).
    expect(screen.queryByTestId('finances-insight-analysis')).toBeNull();
  });

  it('sem mês anterior com valor/hora não há insight', async () => {
    mockPremium = ok(true);
    mockHourlyWindow = ok([
      {
        month: '2026-08',
        hourlyValueCents: null,
        workCount: 0,
        workGeneratedCents: 0n,
        workDurationMinutes: 0,
      },
      {
        month: '2026-09',
        hourlyValueCents: 17600n,
        workCount: 1,
        workGeneratedCents: 0n,
        workDurationMinutes: 600,
      },
    ]);
    await renderWithProviders(<FinancesScreen />);
    expect(screen.queryByTestId('finances-insight')).toBeNull();
  });

  it('a folha do i fecha em "Entendi"', async () => {
    await renderWithProviders(<FinancesScreen />);
    await act(async () => {
      await fireEvent.press(screen.getByTestId('finances-info-generated'));
    });
    expect(screen.getByText('TRABALHO GERADO')).toBeTruthy();
    expect(screen.getByTestId('finance-info-close')).toBeTruthy();
    expect(screen.getByText('Entendi')).toBeTruthy();
  });
});

describe('Finanças — ano', () => {
  async function openYear() {
    await renderWithProviders(<FinancesScreen />);
    await act(async () => {
      await fireEvent.press(screen.getByTestId('finances-mode-year'));
    });
  }
  const y = current.slice(0, 4);
  const premiumYear = () => ({
    months: [
      { month: `${y}-01`, expectedTotalCents: 1000000n, receivedCents: 1000000n },
      { month: `${y}-02`, expectedTotalCents: 1200000n, receivedCents: 1200000n },
      { month: current, expectedTotalCents: 1245000n, receivedCents: 835000n },
    ],
    totalCents: 3445000n,
    receivedCents: 3035000n,
    awaitingCents: 410000n,
    historicalMonthCount: 2,
    historicalAverageCents: 1100000n,
  });

  it('topo só com o total; gráfico com o ganho médio e, no primeiro mês, sem média inventada', async () => {
    await openYear();
    expect(screen.getByTestId('finances-year-title')).toBeTruthy();
    expect(screen.getByText(`recebidos e previstos em ${y}`)).toBeTruthy();
    // Sem barra nem valores de recebido/a receber no topo.
    expect(screen.queryByTestId('finances-year-split')).toBeNull();
    expect(screen.getByTestId('finances-year-chart')).toBeTruthy();
    // Títulos dentro dos cards; legenda com os três tipos de barra.
    expect(screen.getByText(`GANHOS DE ${y}`)).toBeTruthy();
    expect(screen.getByText('Consolidado')).toBeTruthy();
    expect(screen.getByText('Mês atual')).toBeTruthy();
    expect(screen.getByText('Previsto')).toBeTruthy();
    expect(screen.getByText('SEU ANO')).toBeTruthy();
    expect(screen.getByTestId('finances-year-history-start')).toBeTruthy();
    expect(screen.queryByTestId('finances-year-average')).toBeNull();
  });

  it('com histórico: o gráfico traz o ganho médio até o mês atual, sobre o verde', async () => {
    mockYear = ok(premiumYear());
    await openYear();
    expect(screen.getByTestId('finances-year-average')).toHaveTextContent(
      /R\$\s?11\.000.*é sua média de ganho mensal/,
    );
    expect(screen.getByText('12,4k')).toBeTruthy();
    expect(screen.getByTestId('finances-year-chart-wrap')).toHaveStyle({ marginTop: -114 });
  });

  it('seu ano: média, melhor mês, trabalhos e horas (abertos no Free)', async () => {
    mockYear = ok(premiumYear());
    await openYear();
    expect(screen.getByTestId('finances-stat-average')).toHaveTextContent(/R\$\s?11\.000/);
    expect(screen.getByTestId('finances-stat-best')).toHaveTextContent(
      /R\$\s?12\.450.*Setembro|Setembro/,
    );
    expect(screen.getByTestId('finances-stat-works')).toHaveTextContent(/7/);
    expect(screen.getByTestId('finances-stat-hours')).toHaveTextContent(/84h/);
  });

  it('Premium: origem sem selo, valor/hora com horas usadas e evolução, projeção com valor final', async () => {
    mockPremium = ok(true);
    mockYear = ok(premiumYear());
    mockYearOrigins = ok([
      { origin: 'shift', amountCents: 1245000n },
      { origin: 'residency', amountCents: 1000000n },
    ]);
    mockYearWork = ok({
      hourlyValueCents: 15800n,
      hourlyEvolutionPercent: 24,
      workCount: 7,
      workDurationMinutes: 5040,
      hourlyMinutes: 4800,
    });
    await openYear();
    expect(screen.queryByTestId('finances-year-origin-premium')).toBeNull();
    expect(screen.getByText('Plantões')).toBeTruthy();
    expect(screen.getByTestId('finances-year-hourly-value')).toHaveTextContent(/R\$\s?158\/h/);
    // Sem percentual de evolução no card do valor/hora.
    expect(screen.queryByText(/no ano$/)).toBeNull();
    expect(screen.queryByText('+24%')).toBeNull();
    expect(screen.getByText('calculado com 80h de trabalhos com duração registrada')).toBeTruthy();
    expect(screen.getByTestId('finances-projection-chart')).toBeTruthy();
    expect(screen.getByTestId('finances-projection-total')).toBeTruthy();
    expect(screen.queryByTestId('finances-year-projection-premium')).toBeNull();
    expect(screen.queryByText('PREMIUM')).toBeNull();
  });

  it('Free: origem, valor/hora e projeção ocultos com selo; horas abertas; voltar para Mês', async () => {
    await openYear();
    expect(screen.getByTestId('finances-year-origin-locked')).toBeTruthy();
    expect(screen.getByTestId('finances-year-hourly-premium')).toBeTruthy();
    expect(screen.getByTestId('finances-year-hourly-value')).toHaveTextContent(/R\$ •••/);
    expect(screen.getByText('calculado com 84h de trabalhos com duração registrada')).toBeTruthy();
    expect(screen.getByTestId('finances-year-projection-premium')).toBeTruthy();
    expect(screen.queryByTestId('finances-projection-chart')).toBeNull();
    await act(async () => {
      await fireEvent.press(screen.getByTestId('finances-mode-month'));
    });
    expect(screen.getByTestId('finances-month-title')).toBeTruthy();
  });

  it('ano sem nenhum dado: convite para adicionar, sem gráfico vazio', async () => {
    mockYear = ok({
      months: [],
      totalCents: 0n,
      receivedCents: 0n,
      awaitingCents: 0n,
      historicalMonthCount: 0,
      historicalAverageCents: null,
    });
    await openYear();
    expect(screen.getByTestId('finances-year-empty')).toBeTruthy();
    expect(screen.queryByTestId('finances-year-chart')).toBeNull();
  });
});
