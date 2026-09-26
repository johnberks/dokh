import '@/i18n';
import { act, fireEvent, screen } from '@testing-library/react-native';
import { router } from 'expo-router';
import { monthOf, shiftMonth } from '@/domain/calendar';
import { deviceTimezone } from '@/features/onboarding/profile-data';
import { todayInTimezone } from '@/features/work/work-schedule';
import { renderWithProviders } from '@/test/render';
import { EntriesScreen } from './EntriesScreen';
import type { FinanceMonth, MonthEntry } from './finance-data';

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
let mockEntries: Query<MonthEntry[]> = ok([]);
const mockRefetch = jest.fn();
const mockConfirm = jest.fn();

jest.mock('./finance-data', () => ({
  ...jest.requireActual('./finance-data'),
  useFinanceMonth: () => ({ ...mockMonth, refetch: mockRefetch, isFetching: false }),
  useMonthEntries: () => ({ ...mockEntries, refetch: mockRefetch, isFetching: false }),
}));
jest.mock('@/features/work/work-data', () => ({
  useConfirmReceivable: () => ({ mutate: mockConfirm }),
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
  workGeneratedCents: 0n,
  workCount: 0,
  workDurationMinutes: 0,
  hourlyValueCents: null,
  ...patch,
});

const entry = (patch: Partial<MonthEntry>): MonthEntry => ({
  receivableId: 'r1',
  workId: 'w1',
  origin: 'shift',
  locationName: 'Hospital São Lucas',
  amountCents: 120000n,
  expectedOn: `${current}-12`,
  status: 'received',
  ...patch,
});

beforeEach(() => {
  jest.clearAllMocks();
  mockMonth = ok(month());
  mockEntries = ok([
    entry({ receivableId: 'r0', workId: null, origin: 'residency', locationName: null }),
    entry({ receivableId: 'r1' }),
    entry({ receivableId: 'r2', status: 'scheduled', expectedOn: `${current}-26` }),
  ]);
});

describe('Entradas', () => {
  it('mês atual: resumo sobre o topo verde e timeline com recebido e previsto distintos', async () => {
    await renderWithProviders(<EntriesScreen initialMonth={current} />);
    expect(screen.getByText('Entradas')).toBeTruthy();
    expect(screen.getByTestId('entries-summary-wrap')).toHaveStyle({ marginTop: -114 });
    expect(screen.getByText('RECEBIDOS')).toBeTruthy();
    expect(screen.getByText('67% recebido')).toBeTruthy();
    expect(screen.getByText('Residência')).toBeTruthy();
    expect(screen.getAllByText('Recebido')).toHaveLength(2);
    expect(screen.getByText('Previsto')).toBeTruthy();
    // Nada pendente, nenhuma ação de confirmar.
    expect(screen.queryByText('Você recebeu?')).toBeNull();
    // Sem barra de rolagem visível.
    expect(screen.getByTestId('entries-screen').props.showsVerticalScrollIndicator).toBe(false);
  });

  it('tocar num trabalho abre o detalhe; a Residência não leva a lugar nenhum', async () => {
    await renderWithProviders(<EntriesScreen initialMonth={current} />);
    await act(async () => {
      await fireEvent.press(screen.getByTestId('entries-row-r1-details'));
    });
    expect(router.push).toHaveBeenCalledWith({ pathname: '/work/[id]', params: { id: 'w1' } });
    expect(screen.getByTestId('entries-row-r0-details').props.accessibilityState).toMatchObject({
      disabled: true,
    });
  });

  it('mês passado: pendente em bronze com "Você recebeu?" confirmando só pelo servidor', async () => {
    const past = shiftMonth(current, -1);
    mockMonth = ok(month({ receivedCents: 1512000n, awaitingCents: 120000n }));
    mockEntries = ok([
      entry({ receivableId: 'r5', expectedOn: `${past}-05` }),
      entry({ receivableId: 'r6', status: 'confirmation_pending', expectedOn: `${past}-28` }),
    ]);
    await renderWithProviders(<EntriesScreen initialMonth={past} />);
    expect(screen.getByText('Confirmação pendente')).toBeTruthy();
    expect(screen.getByText('1 entrada aguardando sua confirmação')).toBeTruthy();
    await act(async () => {
      await fireEvent.press(screen.getByTestId('entries-row-r6-confirm'));
    });
    expect(mockConfirm).toHaveBeenCalledWith('r6', expect.any(Object));
    // Sem otimismo: o item continua pendente até o servidor responder.
    expect(screen.getByText('Confirmação pendente')).toBeTruthy();

    // Falha mantém o pendente e avisa.
    const { onError, onSettled } = mockConfirm.mock.calls[0][1];
    await act(async () => {
      onError(new Error('offline'));
      onSettled();
    });
    expect(screen.getByTestId('entries-confirm-error')).toBeTruthy();
    expect(screen.getByText('Confirmação pendente')).toBeTruthy();
  });

  it('mês futuro: só previstos, com o total e a quantidade de entradas', async () => {
    const next = shiftMonth(current, 1);
    mockMonth = ok(month({ expectedTotalCents: 990609n, receivedCents: 0n }));
    mockEntries = ok([
      entry({ receivableId: 'r7', status: 'scheduled', expectedOn: `${next}-05` }),
      entry({ receivableId: 'r8', status: 'scheduled', expectedOn: `${next}-10` }),
    ]);
    await renderWithProviders(<EntriesScreen initialMonth={next} />);
    expect(screen.getByText('PREVISTOS')).toBeTruthy();
    expect(screen.getByText('2')).toBeTruthy();
    expect(screen.queryByText('RECEBIDOS')).toBeNull();
    expect(screen.getAllByText('Previsto')).toHaveLength(2);
  });

  it('mês vazio: "Nada previsto por enquanto", sem R$ 0, e a navegação continua', async () => {
    mockMonth = ok(month({ hasExpectedEntries: false, expectedTotalCents: 0n }));
    mockEntries = ok([]);
    await renderWithProviders(<EntriesScreen initialMonth={current} />);
    expect(screen.getByText('Nada previsto por enquanto.')).toBeTruthy();
    expect(screen.queryByText('R$ 0')).toBeNull();
    expect(screen.queryByTestId('entries-summary-wrap')).toBeNull();
    expect(screen.getByTestId('entries-month-next')).toBeTruthy();
  });

  it('falha de leitura mostra erro, nunca "nada previsto"', async () => {
    mockEntries = { isPending: false, isError: true, isSuccess: false };
    await renderWithProviders(<EntriesScreen initialMonth={current} />);
    expect(screen.getByTestId('entries-error')).toBeTruthy();
    expect(screen.queryByText('Nada previsto por enquanto.')).toBeNull();
  });

  it('voltar leva a Finanças', async () => {
    await renderWithProviders(<EntriesScreen initialMonth={current} />);
    await act(async () => {
      await fireEvent.press(screen.getByTestId('entries-back'));
    });
    expect(router.back).toHaveBeenCalled();
  });
});
