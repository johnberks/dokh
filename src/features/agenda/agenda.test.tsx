import '@/i18n';
import { act, fireEvent, screen } from '@testing-library/react-native';
import { router } from 'expo-router';
import { formatDayMonth, monthOf, shiftMonth, weekdayShort } from '@/domain/calendar';
import { deviceTimezone } from '@/features/onboarding/profile-data';
import { todayInTimezone } from '@/features/work/work-schedule';
import { i18n } from '@/i18n';
import { renderWithProviders } from '@/test/render';
import { AgendaScreen } from './AgendaScreen';
import type { AgendaWork } from './agenda-data';
import { dotsByDay, worksByDay } from './agenda-data';
import {
  dayCountLabel,
  dayLabel,
  workKindLabel,
  workPayment,
  workTimeLabel,
} from './agenda-format';
import { WorkDetailScreen } from './WorkDetailScreen';

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn() },
}));
jest.mock('@/features/auth/AuthSessionProvider', () => ({
  AuthSessionProvider: ({ children }: { children: React.ReactNode }) => children,
  useAuthSession: () => ({ status: 'signedIn', userId: 'user-1' }),
}));

type QueryState = { isPending: boolean; isError: boolean; isSuccess: boolean; data?: unknown };
let mockMonth: QueryState = { isPending: false, isError: false, isSuccess: true, data: [] };
let mockDetail: QueryState = { isPending: false, isError: false, isSuccess: true, data: null };
const mockRefetch = jest.fn();
jest.mock('./agenda-data', () => ({
  ...jest.requireActual('./agenda-data'),
  // Os hooks chamam a leitura de dentro do próprio módulo; a tela recebe o estado por eles.
  useAgendaMonth: () => ({ ...mockMonth, refetch: mockRefetch, isFetching: false }),
  useAgendaWork: () => ({ ...mockDetail, refetch: mockRefetch, isFetching: false }),
}));

const t = i18n.getFixedT('pt-BR', 'agenda');
const today = todayInTimezone(deviceTimezone());
const month = monthOf(today);

const work = (patch: Partial<AgendaWork>): AgendaWork => ({
  id: 'w1',
  workDate: today,
  startTime: '19:00',
  durationMinutes: 720,
  type: 'shift',
  description: null,
  locationName: 'Hospital São Lucas',
  colorToken: 'sage',
  amountCents: 120000n,
  expectedOn: '2026-10-12',
  receiptStatus: 'scheduled',
  ...patch,
});

beforeEach(() => {
  jest.clearAllMocks();
  mockMonth = { isPending: false, isError: false, isSuccess: true, data: [] };
});

describe('regras de apresentação da Agenda', () => {
  it('rótulo do dia, contagem e horário sem 00:00 inventado', () => {
    expect(dayLabel('2026-09-25', '2026-09-25', t)).toBe('HOJE · 25 SET');
    expect(dayLabel('2026-09-12', '2026-09-25', t)).toBe('12 SET · SÁB');
    expect(dayCountLabel(0, t)).toBe('Dia livre');
    expect(dayCountLabel(1, t)).toBe('1 trabalho');
    expect(dayCountLabel(3, t)).toBe('3 trabalhos');
    expect(workTimeLabel(work({}))).toBe('19:00');
    expect(
      workTimeLabel(work({ type: 'appointment', startTime: '08:00', durationMinutes: 240 })),
    ).toBe('08:00–12:00');
    expect(workTimeLabel(work({ type: 'procedure', startTime: null }))).toBeUndefined();
  });

  it('tipo com duração ou descrição', () => {
    expect(workKindLabel(work({}), t)).toBe('Plantão · 12h');
    expect(workKindLabel(work({ type: 'procedure', description: 'Cirurgia' }), t)).toBe(
      'Procedimento · Cirurgia',
    );
    expect(workKindLabel(work({ type: 'appointment', durationMinutes: null }), t)).toBe(
      'Atendimento',
    );
  });

  it('pagamento: passado sem confirmação é pendência, sem data é "sem previsão"', () => {
    expect(workPayment(work({}), t)).toEqual({ state: 'scheduled', label: 'Recebe 12 OUT' });
    expect(workPayment(work({ receiptStatus: 'received' }), t).label).toBe('Recebido');
    expect(workPayment(work({ receiptStatus: 'confirmation_pending' }), t)).toEqual({
      state: 'confirmation_pending',
      label: 'Previsto 12 OUT · a confirmar',
    });
    expect(workPayment(work({ receiptStatus: 'undated', expectedOn: null }), t)).toEqual({
      state: 'undated',
      label: 'Sem previsão',
    });
  });

  it('agrupa por dia na ordem da consulta e limita os pontos a três', () => {
    const works = [
      work({ id: 'a', colorToken: 'sage' }),
      work({ id: 'b', colorToken: 'bronze' }),
      work({ id: 'c', colorToken: 'blue' }),
      work({ id: 'd', colorToken: 'green' }),
      work({ id: 'e', workDate: '2026-09-30', colorToken: 'terra' }),
    ];
    expect(
      worksByDay(works)
        .get(today)
        ?.map((item) => item.id),
    ).toEqual(['a', 'b', 'c', 'd']);
    expect(dotsByDay(works)[today]).toEqual(['sage', 'bronze', 'blue']);
  });
});

describe('Agenda (01–05)', () => {
  it('começa em hoje e mostra os trabalhos do dia; tocar abre o detalhe', async () => {
    mockMonth.data = [
      work({}),
      work({ id: 'w2', startTime: null, type: 'procedure', durationMinutes: null }),
    ];
    await renderWithProviders(<AgendaScreen />);
    expect(screen.getByTestId('agenda-day-label').props.children).toBe(
      `HOJE · ${formatDayMonth(today)}`,
    );
    expect(screen.getByText('2 trabalhos')).toBeTruthy();
    expect(screen.getByTestId('agenda-work-w1')).toBeTruthy();
    // A Agenda não soma valores.
    expect(screen.queryByText(/2\.400/)).toBeNull();

    await act(async () => {
      await fireEvent.press(screen.getByTestId('agenda-work-w1'));
    });
    expect(router.push).toHaveBeenCalledWith({ pathname: '/work/[id]', params: { id: 'w1' } });
  });

  it('dia livre oferece adicionar trabalho, e o + do topo abre o mesmo fluxo', async () => {
    await renderWithProviders(<AgendaScreen />);
    expect(screen.getByText('Dia livre')).toBeTruthy();
    await act(async () => {
      await fireEvent.press(screen.getByTestId('agenda-free-day-action'));
    });
    await act(async () => {
      await fireEvent.press(screen.getByTestId('agenda-add'));
    });
    expect(router.push).toHaveBeenNthCalledWith(1, '/work/new');
    expect(router.push).toHaveBeenNthCalledWith(2, '/work/new');
  });

  it('outro mês seleciona o dia 1; voltar ao mês atual seleciona hoje', async () => {
    await renderWithProviders(<AgendaScreen />);
    await act(async () => {
      await fireEvent.press(screen.getByTestId('agenda-next-month'));
    });
    const first = `${shiftMonth(month, 1)}-01`;
    expect(screen.getByTestId('agenda-day-label').props.children).toBe(
      `${formatDayMonth(first)} · ${weekdayShort(first)}`,
    );
    await act(async () => {
      await fireEvent.press(screen.getByTestId('agenda-previous-month'));
    });
    expect(screen.getByTestId('agenda-day-label').props.children).toBe(
      `HOJE · ${formatDayMonth(today)}`,
    );
  });

  it('falha de leitura mostra erro com nova tentativa, nunca "dia livre"', async () => {
    mockMonth = { isPending: false, isError: true, isSuccess: false };
    await renderWithProviders(<AgendaScreen />);
    expect(screen.getByTestId('agenda-error')).toBeTruthy();
    expect(screen.queryByText('Dia livre')).toBeNull();
    expect(screen.queryByTestId('agenda-free-day')).toBeNull();
  });
});

describe('detalhes do trabalho (Agenda 15, leitura)', () => {
  it('mostra início → término, valor, previsão e status com ponto e texto', async () => {
    mockDetail = {
      isPending: false,
      isError: false,
      isSuccess: true,
      data: work({ workDate: '2026-09-14', expectedOn: '2026-10-12' }),
    };
    await renderWithProviders(<WorkDetailScreen workId="w1" />);
    expect(screen.getByText('Segunda-feira, 14 de setembro')).toBeTruthy();
    expect(screen.getByRole('header', { name: 'Hospital São Lucas' })).toBeTruthy();
    expect(screen.getByText('→ 07:00 do dia seguinte · Plantão 12h')).toBeTruthy();
    expect(screen.getByText('12 de outubro')).toBeTruthy();
    expect(screen.getByText('A receber')).toBeTruthy();
  });

  it('sem horário e sem previsão não inventa dados', async () => {
    mockDetail = {
      isPending: false,
      isError: false,
      isSuccess: true,
      data: work({
        type: 'procedure',
        startTime: null,
        durationMinutes: null,
        expectedOn: null,
        receiptStatus: 'undated',
      }),
    };
    await renderWithProviders(<WorkDetailScreen workId="w1" />);
    expect(screen.queryByTestId('work-detail-time')).toBeNull();
    expect(screen.getByTestId('work-detail-expected').props.children).toBe('Sem previsão');
    await act(async () => {
      await fireEvent.press(screen.getByTestId('work-detail-back'));
    });
    expect(router.back).toHaveBeenCalled();
  });
});
