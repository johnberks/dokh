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
let mockYearWork: Query<unknown> = ok({ hourlyValueCents: null, hourlyEvolutionPercent: null });
const mockRefetch = jest.fn();

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
  });
  mockUndated = ok([]);
  mockYear = ok({
    months: [{ month: current, expectedTotalCents: 1245000n }],
    totalCents: 1245000n,
    historicalMonthCount: 0,
    historicalAverageCents: null,
  });
  mockYearOrigins = ok([]);
  mockYearWork = ok({ hourlyValueCents: null, hourlyEvolutionPercent: null });
});

describe('Finanças — mês', () => {
  it('mês atual: previsto, recebido × a receber, percentual e próxima entrada', async () => {
    await renderWithProviders(<FinancesScreen />);
    expect(screen.getByText('previstos para entrar este mês')).toBeTruthy();
    expect(screen.getByTestId('finances-received')).toBeTruthy();
    expect(screen.getByTestId('finances-awaiting')).toBeTruthy();
    expect(screen.getByText('67% recebido')).toBeTruthy();
    expect(screen.getByTestId('finances-next')).toBeTruthy();
    expect(screen.getByText('hoje')).toBeTruthy();
    // Sem pendência, nenhum card de revisão.
    expect(screen.queryByTestId('finances-review')).toBeNull();
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
    // O atalho do extrato só aparece quando o extrato existir.
    expect(screen.queryByTestId('finances-no-next-action')).toBeNull();
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
    expect(screen.queryByTestId('finances-received')).toBeNull();
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
    expect(screen.queryByTestId('finances-received')).toBeNull();
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
    expect(screen.getByText('EXEMPLO')).toBeTruthy();

    await act(async () => {
      await fireEvent.press(screen.getByTestId('finances-awaiting'));
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

describe('Finanças — ano', () => {
  async function openYear() {
    await renderWithProviders(<FinancesScreen />);
    await act(async () => {
      await fireEvent.press(screen.getByTestId('finances-mode-year'));
    });
  }

  it('Ano mostra o total, o gráfico e, no primeiro mês, que o histórico começa agora', async () => {
    await openYear();
    expect(screen.getByTestId('finances-year-title')).toBeTruthy();
    expect(screen.getByText(`recebidos e previstos em ${current.slice(0, 4)}`)).toBeTruthy();
    expect(screen.getByTestId('finances-year-chart')).toBeTruthy();
    expect(screen.getByText('mês atual')).toBeTruthy();
    // Sem base suficiente, nada de média inventada.
    expect(screen.getByTestId('finances-year-history-start')).toBeTruthy();
    expect(screen.queryByTestId('finances-year-average')).toBeNull();
  });

  it('com histórico mostra a média; Premium vê a origem do ano sem selo', async () => {
    mockPremium = ok(true);
    mockYear = ok({
      months: [
        { month: `${current.slice(0, 4)}-01`, expectedTotalCents: 1000000n },
        { month: current, expectedTotalCents: 1245000n },
      ],
      totalCents: 2245000n,
      historicalMonthCount: 2,
      historicalAverageCents: 1289700n,
    });
    mockYearOrigins = ok([
      { origin: 'shift', amountCents: 1245000n },
      { origin: 'residency', amountCents: 1000000n },
    ]);
    await openYear();
    expect(screen.getByTestId('finances-year-average')).toBeTruthy();
    expect(screen.getByText('previstos por mês, em média')).toBeTruthy();
    expect(screen.queryByTestId('finances-year-origin-premium')).toBeNull();
    expect(screen.getByText('Plantões')).toBeTruthy();
  });

  it('Free: origem do ano oculta com selo; voltar para Mês', async () => {
    await openYear();
    expect(screen.getByTestId('finances-year-origin-locked')).toBeTruthy();
    expect(screen.getByTestId('finances-year-origin-premium')).toBeTruthy();
    await act(async () => {
      await fireEvent.press(screen.getByTestId('finances-mode-month'));
    });
    expect(screen.getByTestId('finances-month-title')).toBeTruthy();
  });

  it('ano sem nenhum dado: convite para adicionar, sem gráfico vazio', async () => {
    mockYear = ok({
      months: [],
      totalCents: 0n,
      historicalMonthCount: 0,
      historicalAverageCents: null,
    });
    await openYear();
    expect(screen.getByTestId('finances-year-empty')).toBeTruthy();
    expect(screen.queryByTestId('finances-year-chart')).toBeNull();
  });

  it('Premium: valor/hora no ano, evolução e projeção até dezembro, sem selos', async () => {
    mockPremium = ok(true);
    const y = current.slice(0, 4);
    mockYear = ok({
      months: [
        { month: `${y}-01`, expectedTotalCents: 1000000n },
        { month: `${y}-02`, expectedTotalCents: 1200000n },
        { month: current, expectedTotalCents: 1245000n },
      ],
      totalCents: 3445000n,
      historicalMonthCount: 2,
      historicalAverageCents: 1100000n,
    });
    mockYearWork = ok({ hourlyValueCents: 15800n, hourlyEvolutionPercent: 24 });
    await renderWithProviders(<FinancesScreen />);
    await act(async () => {
      await fireEvent.press(screen.getByTestId('finances-mode-year'));
    });
    expect(screen.getByText('+24%')).toBeTruthy();
    expect(screen.getByText('valor/hora médio no ano')).toBeTruthy();
    expect(screen.getByTestId('finances-projection-chart')).toBeTruthy();
    expect(screen.queryByTestId('finances-year-projection-premium')).toBeNull();
    expect(screen.queryByText('PREMIUM')).toBeNull();
  });

  it('Free: valor/hora, evolução e projeção ocultos com selo', async () => {
    await renderWithProviders(<FinancesScreen />);
    await act(async () => {
      await fireEvent.press(screen.getByTestId('finances-mode-year'));
    });
    expect(screen.getByText('+••%')).toBeTruthy();
    expect(screen.getByTestId('finances-year-projection-premium')).toBeTruthy();
    expect(screen.queryByTestId('finances-projection-chart')).toBeNull();
  });
});
