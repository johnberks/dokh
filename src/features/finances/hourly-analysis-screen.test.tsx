import '@/i18n';
import { screen } from '@testing-library/react-native';
import { renderWithProviders } from '@/test/render';
import type { FinanceMonth, HourlyMonth } from './finance-data';
import { HourlyAnalysisScreen } from './HourlyAnalysisScreen';

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn() },
}));
jest.mock('@/features/auth/AuthSessionProvider', () => ({
  AuthSessionProvider: ({ children }: { children: React.ReactNode }) => children,
  useAuthSession: () => ({ status: 'signedIn', userId: 'user-1' }),
}));

type Query<T> = { isPending: boolean; isError: boolean; isSuccess: boolean; data?: T };
const ok = <T,>(data: T): Query<T> => ({ isPending: false, isError: false, isSuccess: true, data });
let mockMonth: Query<FinanceMonth> = ok(undefined as never);
let mockHistory: Query<HourlyMonth[]> = ok([]);

jest.mock('./finance-data', () => ({
  ...jest.requireActual('./finance-data'),
  useFinanceMonth: () => ({ ...mockMonth, refetch: jest.fn(), isFetching: false }),
  useHourlyHistory: () => mockHistory,
}));

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

const history = (values: Array<bigint | null>): HourlyMonth[] =>
  ['2026-04', '2026-05', '2026-06', '2026-07', '2026-08', '2026-09'].map((m, index) => ({
    month: m,
    hourlyValueCents: values[index],
    workCount: 5,
    workGeneratedCents: 0n,
    workDurationMinutes: 600,
  }));

beforeEach(() => {
  mockMonth = ok(month());
  mockHistory = ok(history([14200n, 15100n, 14700n, 14800n, 16200n, 17600n]));
});

describe('Análise completa de valor/hora', () => {
  it('trabalho do mês, fórmula com o resultado e evolução com números reais', async () => {
    await renderWithProviders(<HourlyAnalysisScreen month="2026-09" />);
    expect(screen.getByText('Seu valor por hora')).toBeTruthy();
    expect(screen.getByText('SETEMBRO 2026')).toBeTruthy();
    expect(screen.getByText('SEU TRABALHO EM SETEMBRO')).toBeTruthy();
    const formula = screen.getByTestId('analysis-formula');
    expect(formula.props.numberOfLines).toBe(1);
    expect(screen.getByTestId('analysis-result-text').props.children).toMatch(
      /^Cada hora do seu trabalho em setembro valeu R\$\s?176 — o maior valor dos últimos 6 meses\.$/,
    );
    expect(screen.getByText('Seis meses de valor/hora, lado a lado.')).toBeTruthy();
    expect(screen.getByTestId('analysis-evolution-text').props.children).toBe(
      'Seu valor/hora subiu 24% desde abril. Agosto e setembro foram os dois melhores meses.',
    );
    // Sem CTAs: a tela é a análise; e sem selo Premium, porque está liberada.
    expect(screen.queryByText('Ver análise completa')).toBeNull();
    expect(screen.queryByText('PREMIUM')).toBeNull();
  });

  it('mês sem valor/hora não entra como zero nem inventa comparação', async () => {
    mockHistory = ok(history([null, null, null, null, 16200n, 17600n]));
    await renderWithProviders(<HourlyAnalysisScreen month="2026-09" />);
    expect(screen.queryByTestId('analysis-bar-2026-04')).toBeNull();
    expect(screen.getByText('Dois meses de valor/hora, lado a lado.')).toBeTruthy();
    expect(screen.getByTestId('analysis-evolution-text').props.children).toBe(
      'Seu valor/hora subiu 9% desde agosto.',
    );
    expect(screen.getByTestId('analysis-result-text').props.children).toMatch(
      /^Cada hora do seu trabalho em setembro valeu R\$\s?176\.$/,
    );
  });

  it('sem horas registradas: explica como ter o valor/hora, sem número', async () => {
    mockMonth = ok(month({ workDurationMinutes: 0, hourlyValueCents: null }));
    mockHistory = ok(history([null, null, null, null, null, null]));
    await renderWithProviders(<HourlyAnalysisScreen month="2026-09" />);
    expect(screen.getByTestId('analysis-no-hours')).toBeTruthy();
    expect(screen.queryByTestId('analysis-evolution')).toBeNull();
  });
});
