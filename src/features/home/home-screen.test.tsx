import '@/i18n';
import { act, fireEvent, screen } from '@testing-library/react-native';
import { router } from 'expo-router';
import { monthOf, shiftMonth } from '@/domain/calendar';
import type { AgendaWork } from '@/features/agenda/agenda-data';
import type { FinanceMonth } from '@/features/finances/finance-data';
import { deviceTimezone } from '@/features/onboarding/profile-data';
import { todayInTimezone } from '@/features/work/work-schedule';
import { renderWithProviders } from '@/test/render';
import { HomeScreen } from './HomeScreen';
import type { HomeBody, HomeEntry, HomeHero } from './home-data';

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
let mockHero: Query<HomeHero> = ok(undefined as never);
let mockBody: Query<HomeBody> = ok(undefined as never);
const mockConfirm = jest.fn();

jest.mock('./home-data', () => ({
  useHomeHero: () => ({ ...mockHero, refetch: jest.fn(), isFetching: false }),
  useHomeBody: () => ({ ...mockBody, refetch: jest.fn(), isFetching: false }),
}));
jest.mock('@/features/work/work-data', () => ({
  useConfirmReceivable: () => ({ mutate: mockConfirm }),
}));

const today = todayInTimezone(deviceTimezone());
const current = monthOf(today);
const plus = (days: number) => {
  const [y, m, d] = today.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
};

const finance = (patch: Partial<FinanceMonth> = {}): FinanceMonth => ({
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
  month: finance(),
  previous: finance({ expectedTotalCents: 1110000n }),
  history: [-3, -2, -1, 0].map((delta, index) => ({
    month: shiftMonth(current, delta),
    expectedTotalCents: [980000n, 1040000n, 1110000n, 1245000n][index],
  })),
  openCount: 4,
  ...patch,
});

const work = (patch: Partial<AgendaWork> = {}): AgendaWork => ({
  id: 'w1',
  workDate: today,
  startTime: '19:00',
  durationMinutes: 720,
  type: 'shift',
  description: null,
  locationName: 'Hospital São Lucas',
  colorToken: 'sage',
  amountCents: 120000n,
  expectedOn: plus(16),
  receiptStatus: 'scheduled',
  ...patch,
});

const entry = (patch: Partial<HomeEntry> = {}): HomeEntry => ({
  receivableId: 'r1',
  workId: 'w9',
  origin: 'shift',
  locationName: 'Clínica Central',
  colorToken: 'bronze',
  workType: 'shift',
  workDate: plus(-14),
  amountCents: 85000n,
  expectedOn: plus(9),
  ...patch,
});

const body = (patch: Partial<HomeBody> = {}): HomeBody => ({
  firstName: 'Anna',
  isResident: false,
  hasResidency: false,
  upcomingWorks: [
    work(),
    work({ id: 'w2', workDate: plus(2), locationName: 'Clínica Central', startTime: '08:00' }),
  ],
  upcomingEntries: [
    entry({ receivableId: 'r0', workId: null, origin: 'residency', locationName: null }),
    entry(),
  ],
  dueToday: [],
  overdue: [],
  undatedCount: 0,
  undatedTotalCents: 0n,
  firstUndatedWorkId: null,
  totalWorks: 12,
  ...patch,
});

beforeEach(() => {
  jest.clearAllMocks();
  mockHero = ok(hero());
  mockBody = ok(body());
});

describe('Início', () => {
  it('padrão: mês com comparação, próximo trabalho sobre o verde e as duas listas', async () => {
    await renderWithProviders(<HomeScreen />);
    expect(screen.getByTestId('home-hero-amount')).toHaveTextContent(/R\$\s?12\.450/);
    // Visão 2A: card do mês com rótulo, contagem e comparação.
    expect(screen.getByText(/^PARA RECEBER · /)).toBeTruthy();
    expect(screen.getByText('4 entradas previstas')).toBeTruthy();
    expect(screen.getByTestId('home-hero-comparison')).toHaveTextContent(/↑ 12%.*R\$\s?1\.350/);
    expect(screen.getByTestId('home-next-work-wrap')).toHaveStyle({ marginTop: -114 });
    expect(screen.getByText('HOJE')).toBeTruthy();
    expect(screen.getByText('PRÓXIMAS ENTRADAS')).toBeTruthy();
    expect(screen.getByText('Residência')).toBeTruthy();
    expect(screen.getByText('PRÓXIMOS TRABALHOS')).toBeTruthy();
    // Sem pendência, nenhum Review Card; setup concluído, sem progresso.
    expect(screen.queryByTestId('home-review-today')).toBeNull();
    expect(screen.queryByTestId('home-progress')).toBeNull();
    // Sem barra de rolagem.
    expect(screen.getByTestId('home-screen').props.showsVerticalScrollIndicator).toBe(false);
  });

  it('destinos: detalhe do trabalho, todas as entradas e agenda', async () => {
    await renderWithProviders(<HomeScreen />);
    await act(async () => {
      await fireEvent.press(screen.getByTestId('home-next-work'));
    });
    expect(router.push).toHaveBeenCalledWith({ pathname: '/work/[id]', params: { id: 'w1' } });
    await act(async () => {
      await fireEvent.press(screen.getByTestId('home-entries-action'));
    });
    expect(router.push).toHaveBeenCalledWith({
      pathname: '/finances/entries',
      params: { month: current },
    });
    await act(async () => {
      await fireEvent.press(screen.getByTestId('home-works-action'));
    });
    expect(router.push).toHaveBeenCalledWith('/agenda');
  });

  it('2A: histórico como segundo card com peek, pontos e olho que oculta os valores', async () => {
    await renderWithProviders(<HomeScreen />);
    expect(screen.getByTestId('home-hero-history')).toBeTruthy();
    expect(screen.getByText(/^HISTÓRICO · 4 MESES$/)).toBeTruthy();
    // O card do mês é mais estreito que a tela: o histórico aparece na borda direita.
    expect(screen.getByTestId('home-hero-cards').props.horizontal).toBe(true);
    expect(screen.getByTestId('home-hero-dot-1')).toBeTruthy();
    await act(async () => {
      await fireEvent.press(screen.getByTestId('home-hero-dot-1'));
    });
    expect(screen.getByTestId('home-hero-dot-1').props.accessibilityState).toMatchObject({
      selected: true,
    });
    await act(async () => {
      await fireEvent.press(screen.getByTestId('home-hero-eye'));
    });
    expect(screen.getByTestId('home-hero-amount')).toHaveTextContent('R$ ••••');
    expect(screen.queryByText('12,4k')).toBeNull();
  });

  it('primeiro acesso: sem histórico, sem comparação e com o progresso inicial', async () => {
    mockHero = ok(
      hero({
        previous: finance({ hasExpectedEntries: false }),
        history: [-3, -2, -1, 0].map((delta) => ({
          month: shiftMonth(current, delta),
          expectedTotalCents: delta === 0 ? 410609n : 0n,
        })),
      }),
    );
    mockBody = ok(body({ isResident: true, hasResidency: true, totalWorks: 1, upcomingWorks: [] }));
    await renderWithProviders(<HomeScreen />);
    expect(screen.queryByTestId('home-hero-history')).toBeNull();
    expect(screen.queryByTestId('home-hero-dot-1')).toBeNull();
    expect(screen.queryByTestId('home-hero-comparison')).toBeNull();
    expect(screen.getByTestId('home-progress')).toBeTruthy();
    expect(screen.getByText('Residência organizada')).toBeTruthy();
    expect(screen.getByText('Adicionar seu próximo trabalho')).toBeTruthy();
  });

  it('entrada de hoje: Review Card de atenção que confirma só pelo servidor', async () => {
    mockBody = ok(
      body({
        dueToday: [
          entry({ receivableId: 'r5', expectedOn: today, locationName: 'Hospital São Lucas' }),
        ],
      }),
    );
    await renderWithProviders(<HomeScreen />);
    expect(screen.getByText('ENTRADA PREVISTA PARA HOJE')).toBeTruthy();
    // A entrada de hoje não se repete na lista passiva.
    expect(screen.queryByTestId('home-entry-r5')).toBeNull();
    await act(async () => {
      await fireEvent.press(screen.getByTestId('home-review-today'));
    });
    expect(mockConfirm).toHaveBeenCalledWith('r5', expect.any(Object));
    const { onError, onSettled } = mockConfirm.mock.calls[0][1];
    await act(async () => {
      onError(new Error('offline'));
      onSettled();
    });
    expect(screen.getByTestId('home-confirm-error')).toBeTruthy();
    expect(screen.getByText('ENTRADA PREVISTA PARA HOJE')).toBeTruthy();
  });

  it('entrada vencida: pendência neutra "Confirmar entrada", nunca recebida sozinha', async () => {
    mockBody = ok(body({ overdue: [entry({ receivableId: 'r7', expectedOn: plus(-3) })] }));
    await renderWithProviders(<HomeScreen />);
    expect(screen.getByTestId('home-review-overdue')).toBeTruthy();
    expect(screen.getByText('Pagamento ainda não confirmado')).toBeTruthy();
    expect(screen.getByText('Confirmar entrada')).toBeTruthy();
  });

  it('no máximo dois Review Cards, um de atenção primeiro', async () => {
    mockBody = ok(
      body({
        dueToday: [entry({ receivableId: 'r5', expectedOn: today })],
        overdue: [entry({ receivableId: 'r7', expectedOn: plus(-3) })],
        undatedCount: 2,
        undatedTotalCents: 240000n,
        firstUndatedWorkId: 'w3',
      }),
    );
    await renderWithProviders(<HomeScreen />);
    expect(screen.getByTestId('home-review-today')).toBeTruthy();
    expect(screen.getByTestId('home-review-overdue')).toBeTruthy();
    expect(screen.queryByTestId('home-review-undated')).toBeNull();
  });

  it('mês vazio: mensagem no topo, sem R$ 0, e revisão dos valores sem data', async () => {
    mockHero = ok(hero({ month: finance({ hasExpectedEntries: false }) }));
    mockBody = ok(
      body({
        upcomingEntries: [],
        undatedCount: 1,
        undatedTotalCents: 120000n,
        firstUndatedWorkId: 'w3',
      }),
    );
    await renderWithProviders(<HomeScreen />);
    expect(screen.getByText('Nenhuma entrada prevista ainda.')).toBeTruthy();
    expect(screen.queryByText(/R\$\s?0/)).toBeNull();
    expect(screen.getByTestId('home-review-undated')).toBeTruthy();
    expect(screen.queryByTestId('home-entries')).toBeNull();
    await act(async () => {
      await fireEvent.press(screen.getByTestId('home-review-undated'));
    });
    expect(router.push).toHaveBeenCalledWith({ pathname: '/work/edit/[id]', params: { id: 'w3' } });
  });

  it('sem próximo trabalho: estado vazio tipográfico; finanças preservadas', async () => {
    mockBody = ok(body({ upcomingWorks: [] }));
    await renderWithProviders(<HomeScreen />);
    expect(screen.getByTestId('home-no-work')).toBeTruthy();
    expect(screen.getByText('Nenhum trabalho adicionado ainda.')).toBeTruthy();
    expect(screen.getByTestId('home-hero-amount')).toBeTruthy();
    expect(screen.queryByTestId('home-works')).toBeNull();
    await act(async () => {
      await fireEvent.press(screen.getByTestId('home-no-work'));
    });
    expect(router.push).toHaveBeenCalledWith('/work/new');
  });

  it('trocar o mês no topo', async () => {
    await renderWithProviders(<HomeScreen />);
    await act(async () => {
      await fireEvent.press(screen.getByTestId('home-month-next'));
    });
    expect(screen.getByTestId('home-month-title').props.children).toMatch(/\d{4}$/);
  });

  it('falha de leitura mostra erro, nunca estado vazio', async () => {
    mockBody = { isPending: false, isError: true, isSuccess: false };
    await renderWithProviders(<HomeScreen />);
    expect(screen.getByTestId('home-error')).toBeTruthy();
    expect(screen.queryByTestId('home-no-work')).toBeNull();
  });
});
