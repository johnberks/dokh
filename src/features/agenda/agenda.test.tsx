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
  // Foco da tela = montagem, suficiente para o comportamento de abrir no mês atual.
  useFocusEffect: (effect: () => undefined) => jest.requireActual('react').useEffect(effect, []),
}));
jest.mock('@/features/auth/AuthSessionProvider', () => ({
  AuthSessionProvider: ({ children }: { children: React.ReactNode }) => children,
  useAuthSession: () => ({ status: 'signedIn', userId: 'user-1' }),
}));

type QueryState = { isPending: boolean; isError: boolean; isSuccess: boolean; data?: unknown };
let mockMonth: QueryState = { isPending: false, isError: false, isSuccess: true, data: [] };
let mockDetail: QueryState = { isPending: false, isError: false, isSuccess: true, data: null };
const mockRefetch = jest.fn();
const mockDelete = jest.fn(async (_workId: string, _key: string) => ({
  workId: 'w1',
  receivableId: 'r1',
}));
jest.mock('@/features/work/work-data', () => {
  const { useMutation } = jest.requireActual('@tanstack/react-query');
  return {
    ...jest.requireActual('@/features/work/work-data'),
    // O hook chama a RPC de dentro do próprio módulo; a mutation real usa a função simulada.
    useDeleteWork: () =>
      useMutation({
        mutationFn: ({
          workEntryId,
          idempotencyKey,
        }: {
          workEntryId: string;
          idempotencyKey: string;
        }) => mockDelete(workEntryId, idempotencyKey),
      }),
    newIdempotencyKey: () => 'delete-key',
  };
});
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

  it('dia de outro mês leva ao mês dele e a grade não tem semana extra', async () => {
    await renderWithProviders(<AgendaScreen />);
    expect(screen.getByTestId('agenda-month')).toBeTruthy();
    // O último quadrado da grade completa a última semana do mês, no máximo.
    const ids = screen
      .getAllByRole('button')
      .map((button) => button.props.testID as string | undefined)
      .filter((id): id is string => /^agenda-calendar-\d{4}-\d{2}-\d{2}$/.test(id ?? ''));
    const last = ids[ids.length - 1].replace('agenda-calendar-', '');
    const lastOfMonth = ids
      .filter((id) => id.includes(`-${month}-`))
      .pop()
      ?.replace('agenda-calendar-', '');
    expect(lastOfMonth).toBeDefined();
    expect(ids.length % 7).toBe(0);
    // Nunca uma semana inteira do mês seguinte.
    expect(ids.slice(-7).some((id) => id.includes(`-${month}-`))).toBe(true);

    if (last.startsWith(month)) return;
    await act(async () => {
      await fireEvent.press(screen.getByTestId(`agenda-calendar-${last}`));
    });
    expect(screen.getByTestId('agenda-day-label').props.children).toBe(
      `${formatDayMonth(last)} · ${weekdayShort(last)}`,
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
  it('mostra início, término (+1 dia) e duração em blocos, valor, previsão e status', async () => {
    mockDetail = {
      isPending: false,
      isError: false,
      isSuccess: true,
      data: work({ workDate: '2026-09-14', expectedOn: '2026-10-12' }),
    };
    await renderWithProviders(<WorkDetailScreen workId="w1" />);
    expect(screen.getByText('Segunda-feira, 14 de setembro')).toBeTruthy();
    expect(screen.getByRole('header', { name: 'Hospital São Lucas' })).toBeTruthy();
    expect(screen.getByText('PLANTÃO')).toBeTruthy();
    expect(screen.getByTestId('work-detail-start').props.accessibilityLabel).toBe('INÍCIO, 19:00');
    expect(screen.getByTestId('work-detail-end').props.accessibilityLabel).toBe(
      'TÉRMINO, 07:00, +1 dia · 15 SET',
    );
    expect(screen.getByTestId('work-detail-duration').props.accessibilityLabel).toBe(
      'DURAÇÃO, 12h',
    );
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
    expect(screen.queryByTestId('work-detail-start')).toBeNull();
    expect(screen.queryByTestId('work-detail-end')).toBeNull();
    expect(screen.queryByTestId('work-detail-duration')).toBeNull();
    expect(screen.getByTestId('work-detail-expected').props.children).toBe('Sem previsão');
    await act(async () => {
      await fireEvent.press(screen.getByTestId('work-detail-back'));
    });
    expect(router.back).toHaveBeenCalled();
  });

  it('excluir pede confirmação explicando Agenda e Finanças e só então apaga', async () => {
    mockDetail = {
      isPending: false,
      isError: false,
      isSuccess: true,
      data: work({ workDate: '2026-09-28', locationName: 'Ubs Xpto' }),
    };
    await renderWithProviders(<WorkDetailScreen workId="w1" />);
    await act(async () => {
      await fireEvent.press(screen.getByTestId('work-detail-delete'));
    });
    expect(screen.getByText('Excluir este trabalho?')).toBeTruthy();
    expect(screen.getByText(/sai da sua Agenda .* deixa de aparecer em Finanças/)).toBeTruthy();
    expect(screen.getByText(/Ubs Xpto no dia 28 SET/)).toBeTruthy();
    expect(mockDelete).not.toHaveBeenCalled();

    await act(async () => {
      await fireEvent.press(screen.getByTestId('work-delete-confirm'));
    });
    expect(mockDelete).toHaveBeenCalledWith('w1', 'delete-key');
    expect(router.back).toHaveBeenCalled();
  });

  it('Editar trabalho abre o formulário de edição', async () => {
    mockDetail = { isPending: false, isError: false, isSuccess: true, data: work({}) };
    await renderWithProviders(<WorkDetailScreen workId="w1" />);
    await act(async () => {
      await fireEvent.press(screen.getByTestId('work-detail-edit'));
    });
    expect(router.push).toHaveBeenCalledWith({ pathname: '/work/edit/[id]', params: { id: 'w1' } });
  });

  it('cancelar não apaga', async () => {
    mockDetail = { isPending: false, isError: false, isSuccess: true, data: work({}) };
    await renderWithProviders(<WorkDetailScreen workId="w1" />);
    await act(async () => {
      await fireEvent.press(screen.getByTestId('work-detail-delete'));
    });
    await act(async () => {
      await fireEvent.press(screen.getByTestId('work-delete-cancel'));
    });
    expect(mockDelete).not.toHaveBeenCalled();
  });
});
