import '@/i18n';
import { act, fireEvent, screen } from '@testing-library/react-native';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import type { PanGesture } from 'react-native-gesture-handler';
import { State } from 'react-native-gesture-handler';
import { fireGestureHandler, getByGestureTestId } from 'react-native-gesture-handler/jest-utils';
import { formatDayMonth, monthOf, shiftMonth, weekdayShort } from '@/domain/calendar';
import { deviceTimezone } from '@/features/onboarding/profile-data';
import { todayInTimezone } from '@/features/work/work-schedule';
import { i18n } from '@/i18n';
import { renderWithProviders } from '@/test/render';
import { AgendaScreen } from './AgendaScreen';
import type { AgendaWork } from './agenda-data';
import { dotsByDay, worksByDay } from './agenda-data';
import { useAgendaDay } from './agenda-day';
import {
  dayCountLabel,
  dayLabel,
  workKindLabel,
  workPayment,
  workTimeLabel,
} from './agenda-format';
import { WorkDetailScreen } from './WorkDetailScreen';

let mockSearchParams: { date?: string } = {};
jest.mock('expo-router', () => ({
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn(), setParams: jest.fn() },
  useLocalSearchParams: () => mockSearchParams,
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
let mockConfirmFails = false;
const mockConfirm = jest.fn(async (receivableId: string) => {
  if (mockConfirmFails) throw new Error('offline');
  return { receivableId, receivedAt: '2026-10-03T12:00:00Z' };
});
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
    useConfirmReceivable: () =>
      useMutation({ mutationFn: (receivableId: string) => mockConfirm(receivableId) }),
    newIdempotencyKey: () => 'delete-key',
  };
});
let mockPremium = false;
jest.mock('@/features/billing/entitlement', () => ({
  usePremium: () => ({ isSuccess: true, data: mockPremium }),
}));
const mockStop = jest.fn(async (_seriesId: string) => ({ removed: 4 }));
const mockDeleteForward = jest.fn(async (_workId: string) => ({ removed: 3 }));
jest.mock('@/features/work/work-recurrence', () => {
  const { useMutation } = jest.requireActual('@tanstack/react-query');
  return {
    ...jest.requireActual('@/features/work/work-recurrence'),
    useNextOccurrence: (seriesId: string | null) => ({
      data: seriesId ? '2026-09-21' : undefined,
    }),
    useStopWorkSeries: () => useMutation({ mutationFn: (id: string) => mockStop(id) }),
    useDeleteWorkSeriesFrom: () =>
      useMutation({ mutationFn: (id: string) => mockDeleteForward(id) }),
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
  receivableId: 'r1',
  seriesId: null,
  seriesFrequency: null,
  seriesActive: false,
  ...patch,
});

beforeEach(() => {
  jest.clearAllMocks();
  mockMonth = { isPending: false, isError: false, isSuccess: true, data: [] };
  mockConfirmFails = false;
  useAgendaDay.setState({ date: null, keepOnReturn: false });
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
    const otherDay = today.endsWith('-01') ? `${today.slice(0, 8)}02` : `${today.slice(0, 8)}01`;
    const works = [
      work({ id: 'a', colorToken: 'sage' }),
      work({ id: 'b', colorToken: 'bronze' }),
      work({ id: 'c', colorToken: 'blue' }),
      work({ id: 'd', colorToken: 'green' }),
      // Outro dia qualquer, nunca o de hoje (antes era 2026-09-30 fixo e quebrou nesse dia).
      work({ id: 'e', workDate: otherDay, colorToken: 'terra' }),
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
  it('depois de salvar um Trabalho, abre no dia dele e limpa o parâmetro', async () => {
    const saved = `${shiftMonth(month, 1)}-12`;
    mockSearchParams = { date: saved };
    mockMonth.data = [];
    await renderWithProviders(<AgendaScreen />);
    expect(screen.getByTestId('agenda-day-label').props.children).toMatch(
      new RegExp(`^${formatDayMonth(saved)}`),
    );
    expect(router.setParams).toHaveBeenCalledWith({ date: undefined });
    mockSearchParams = {};
  });

  it('começa em hoje e mostra os trabalhos do dia; tocar abre o detalhe', async () => {
    mockMonth.data = [
      work({}),
      work({ id: 'w2', startTime: null, type: 'procedure', durationMinutes: null }),
    ];
    await renderWithProviders(<AgendaScreen />);
    // Mesma altura de verde da Início e de Finanças.
    expect(screen.getByTestId('two-tone-hero')).toHaveStyle({ height: 272 });
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

  it('dia livre oferece adicionar trabalho, e o + do topo abre o mesmo fluxo no dia', async () => {
    await renderWithProviders(<AgendaScreen />);
    expect(screen.getByText('Dia livre')).toBeTruthy();
    await act(async () => {
      await fireEvent.press(screen.getByTestId('agenda-free-day-action'));
    });
    await act(async () => {
      await fireEvent.press(screen.getByTestId('agenda-add'));
    });
    const onToday = { pathname: '/work/new', params: { date: today } };
    expect(router.push).toHaveBeenNthCalledWith(1, onToday);
    expect(router.push).toHaveBeenNthCalledWith(2, onToday);
  });

  it('o + abre o novo trabalho no dia escolhido, passado ou futuro', async () => {
    await renderWithProviders(<AgendaScreen />);
    await act(async () => {
      await fireEvent.press(screen.getByTestId('agenda-month-next'));
    });
    const first = `${shiftMonth(month, 1)}-01`;
    // O `+` central lê o mesmo dia enquanto a Agenda está na tela.
    expect(useAgendaDay.getState().date).toBe(first);
    await act(async () => {
      await fireEvent.press(screen.getByTestId('agenda-add'));
    });
    expect(router.push).toHaveBeenLastCalledWith({
      pathname: '/work/new',
      params: { date: first },
    });
    // Voltar do `+` sem salvar mantém o dia que a Agenda mostrava.
    expect(useAgendaDay.getState().keepOnReturn).toBe(true);

    for (let back = 0; back < 2; back++) {
      await act(async () => {
        await fireEvent.press(screen.getByTestId('agenda-month-previous'));
      });
    }
    const past = `${shiftMonth(month, -1)}-01`;
    await act(async () => {
      await fireEvent.press(screen.getByTestId('agenda-add'));
    });
    expect(router.push).toHaveBeenLastCalledWith({ pathname: '/work/new', params: { date: past } });
  });

  it('outro mês seleciona o dia 1; voltar ao mês atual seleciona hoje', async () => {
    await renderWithProviders(<AgendaScreen />);
    await act(async () => {
      await fireEvent.press(screen.getByTestId('agenda-month-next'));
    });
    const first = `${shiftMonth(month, 1)}-01`;
    expect(screen.getByTestId('agenda-day-label').props.children).toBe(
      `${formatDayMonth(first)} · ${weekdayShort(first)}`,
    );
    await act(async () => {
      await fireEvent.press(screen.getByTestId('agenda-month-previous'));
    });
    expect(screen.getByTestId('agenda-day-label').props.children).toBe(
      `HOJE · ${formatDayMonth(today)}`,
    );
  });

  it('dia de outro mês leva ao mês dele e a grade não tem semana extra', async () => {
    await renderWithProviders(<AgendaScreen />);
    expect(screen.getByTestId('agenda-month-title')).toBeTruthy();
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

describe('deslizar o card do dia (Agenda)', () => {
  function swipe(workId: string, translationX: number, velocityX = 0) {
    fireGestureHandler<PanGesture>(getByGestureTestId(`agenda-row-${workId}-swipe`), [
      { state: State.BEGAN, translationX: 0 },
      { state: State.ACTIVE, translationX: translationX / 2 },
      { state: State.ACTIVE, translationX },
      { state: State.END, translationX, velocityX },
    ]);
  }

  async function swipeOpen(workId = 'w1') {
    await act(async () => {
      swipe(workId, -180);
    });
  }

  function actionsHidden(workId = 'w1') {
    return screen.getByTestId(`agenda-row-${workId}-actions`, { includeHiddenElements: true }).props
      .accessibilityElementsHidden;
  }

  it('arrasto curto volta; arrasto longo revela Recebido e Excluir', async () => {
    mockMonth = { isPending: false, isError: false, isSuccess: true, data: [work({})] };
    await renderWithProviders(<AgendaScreen />);
    await act(async () => {
      swipe('w1', -40);
    });
    expect(screen.queryByRole('button', { name: 'Marcar como recebido' })).toBeNull();

    await swipeOpen();
    expect(screen.getByRole('button', { name: 'Marcar como recebido' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Excluir trabalho' })).toBeTruthy();
    expect(screen.getByText('Recebido')).toBeTruthy();
    expect(screen.getByText('Excluir')).toBeTruthy();
  });

  it('Recebido confirma no servidor e fecha o card', async () => {
    mockMonth = { isPending: false, isError: false, isSuccess: true, data: [work({})] };
    await renderWithProviders(<AgendaScreen />);
    await swipeOpen();
    await act(async () => {
      await fireEvent.press(screen.getByTestId('agenda-row-w1-action-received'));
    });
    expect(mockConfirm).toHaveBeenCalledWith('r1');
    expect(screen.queryByRole('button', { name: 'Marcar como recebido' })).toBeNull();
    expect(Haptics.notificationAsync).toHaveBeenCalledWith('success');
  });

  it('falha ao marcar mantém o card aberto e avisa', async () => {
    mockConfirmFails = true;
    mockMonth = { isPending: false, isError: false, isSuccess: true, data: [work({})] };
    await renderWithProviders(<AgendaScreen />);
    await swipeOpen();
    await act(async () => {
      await fireEvent.press(screen.getByTestId('agenda-row-w1-action-received'));
    });
    expect(screen.getByTestId('agenda-receive-error-w1')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Marcar como recebido' })).toBeTruthy();
    expect(Haptics.notificationAsync).toHaveBeenCalledWith('error');
  });

  it('trabalho já recebido só oferece Excluir', async () => {
    mockMonth = {
      isPending: false,
      isError: false,
      isSuccess: true,
      data: [work({ receiptStatus: 'received' })],
    };
    await renderWithProviders(<AgendaScreen />);
    await swipeOpen();
    expect(screen.queryByTestId('agenda-row-w1-action-received')).toBeNull();
    expect(screen.getByRole('button', { name: 'Excluir trabalho' })).toBeTruthy();
  });

  it('Excluir abre a confirmação de sempre e só então apaga', async () => {
    mockMonth = {
      isPending: false,
      isError: false,
      isSuccess: true,
      data: [work({ locationName: 'Ubs Xpto' })],
    };
    await renderWithProviders(<AgendaScreen />);
    await swipeOpen();
    await act(async () => {
      await fireEvent.press(screen.getByTestId('agenda-row-w1-action-delete'));
    });
    expect(screen.getByText('Excluir este trabalho?')).toBeTruthy();
    expect(mockDelete).not.toHaveBeenCalled();
    await act(async () => {
      await fireEvent.press(screen.getByTestId('work-delete-confirm'));
    });
    expect(mockDelete).toHaveBeenCalledWith('w1', 'delete-key');
  });

  it('com um card aberto, tocar fecha em vez de abrir o detalhe; só um aberto por vez', async () => {
    mockMonth = {
      isPending: false,
      isError: false,
      isSuccess: true,
      data: [work({}), work({ id: 'w2', startTime: '07:00', receivableId: 'r2' })],
    };
    await renderWithProviders(<AgendaScreen />);
    await swipeOpen('w1');
    expect(actionsHidden('w1')).toBe(false);
    await swipeOpen('w2');
    expect(actionsHidden('w1')).toBe(true);
    expect(actionsHidden('w2')).toBe(false);

    await act(async () => {
      await fireEvent.press(screen.getByTestId('agenda-work-w1'));
    });
    expect(router.push).not.toHaveBeenCalled();
    expect(actionsHidden('w2')).toBe(true);
    await act(async () => {
      await fireEvent.press(screen.getByTestId('agenda-work-w1'));
    });
    expect(router.push).toHaveBeenCalledWith({ pathname: '/work/[id]', params: { id: 'w1' } });
  });

  it('leitor de tela tem as mesmas ações no card', async () => {
    mockMonth = { isPending: false, isError: false, isSuccess: true, data: [work({})] };
    await renderWithProviders(<AgendaScreen />);
    const card = screen.getByTestId('agenda-work-w1');
    expect(card.props.accessibilityActions).toEqual([
      { name: 'received', label: 'Marcar como recebido' },
      { name: 'delete', label: 'Excluir trabalho' },
    ]);
    await act(async () => {
      await fireEvent(card, 'accessibilityAction', { nativeEvent: { actionName: 'received' } });
    });
    expect(mockConfirm).toHaveBeenCalledWith('r1');
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

  it('Marcar como recebido fica acima de Editar, confirma no servidor e mostra o check', async () => {
    mockDetail = { isPending: false, isError: false, isSuccess: true, data: work({}) };
    await renderWithProviders(<WorkDetailScreen workId="w1" />);
    expect(screen.getByTestId('work-detail-receive')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Marcar como recebido' })).toBeTruthy();
    await act(async () => {
      await fireEvent.press(screen.getByTestId('work-detail-receive'));
    });
    expect(mockConfirm).toHaveBeenCalledWith('r1');
    expect(screen.getByRole('button', { name: 'Recebido' })).toBeTruthy();
    // A vibração sai do botão ao ficar verde, uma vez só.
    expect(Haptics.notificationAsync).toHaveBeenCalledTimes(1);
    expect(Haptics.notificationAsync).toHaveBeenCalledWith('success');
  });

  it('recebido (ou sem Recebível) não oferece marcar', async () => {
    mockDetail = {
      isPending: false,
      isError: false,
      isSuccess: true,
      data: work({ receiptStatus: 'received' }),
    };
    const view = await renderWithProviders(<WorkDetailScreen workId="w1" />);
    expect(screen.queryByTestId('work-detail-receive')).toBeNull();
    expect(screen.getByTestId('work-detail-edit')).toBeTruthy();
    await view.unmount();

    mockDetail = {
      isPending: false,
      isError: false,
      isSuccess: true,
      data: work({ receivableId: null, receiptStatus: null }),
    };
    await renderWithProviders(<WorkDetailScreen workId="w1" />);
    expect(screen.queryByTestId('work-detail-receive')).toBeNull();
  });

  it('falha ao marcar mostra erro com nova tentativa', async () => {
    mockConfirmFails = true;
    mockDetail = { isPending: false, isError: false, isSuccess: true, data: work({}) };
    await renderWithProviders(<WorkDetailScreen workId="w1" />);
    await act(async () => {
      await fireEvent.press(screen.getByTestId('work-detail-receive'));
    });
    expect(screen.getByTestId('mutation-error-retry')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Marcar como recebido' })).toBeTruthy();
    expect(Haptics.notificationAsync).toHaveBeenCalledWith('error');
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

describe('recorrência no detalhe (Agenda 15 · 8.5)', () => {
  beforeEach(() => {
    mockPremium = false;
    mockStop.mockClear();
  });

  const occurrence = () =>
    work({
      workDate: '2026-09-14',
      seriesId: 's1',
      seriesFrequency: 'weekly',
      seriesActive: true,
    });

  it('trabalho avulso não mostra recorrência', async () => {
    mockDetail = { isPending: false, isError: false, isSuccess: true, data: work({}) };
    await renderWithProviders(<WorkDetailScreen workId="w1" />);
    expect(screen.queryByTestId('work-detail-repeat')).toBeNull();
  });

  it('Premium vê a frequência, a próxima data e para de repetir com confirmação', async () => {
    mockPremium = true;
    mockDetail = { isPending: false, isError: false, isSuccess: true, data: occurrence() };
    await renderWithProviders(<WorkDetailScreen workId="w1" />);
    expect(screen.getByText('Este trabalho se repete')).toBeTruthy();
    expect(screen.getByText('Toda semana · próximo em 21 SET')).toBeTruthy();

    await act(async () => {
      await fireEvent.press(screen.getByTestId('work-detail-manage'));
    });
    expect(screen.getByText('Parar de repetir?')).toBeTruthy();
    expect(mockStop).not.toHaveBeenCalled();
    await act(async () => {
      await fireEvent.press(screen.getByTestId('work-series-stop'));
    });
    expect(mockStop).toHaveBeenCalledWith('s1');
  });

  it('sem Premium a recorrência aparece, mas sem Gerenciar', async () => {
    mockDetail = { isPending: false, isError: false, isSuccess: true, data: occurrence() };
    await renderWithProviders(<WorkDetailScreen workId="w1" />);
    expect(screen.getByText('Este trabalho se repete')).toBeTruthy();
    expect(screen.queryByTestId('work-detail-manage')).toBeNull();
  });

  it('série parada não aparece como recorrente', async () => {
    mockPremium = true;
    mockDetail = {
      isPending: false,
      isError: false,
      isSuccess: true,
      data: { ...occurrence(), seriesActive: false },
    };
    await renderWithProviders(<WorkDetailScreen workId="w1" />);
    expect(screen.queryByTestId('work-detail-repeat')).toBeNull();
  });

  it('excluir um recorrente pergunta: só este dia (padrão) ou este e os próximos', async () => {
    mockDetail = { isPending: false, isError: false, isSuccess: true, data: occurrence() };
    await renderWithProviders(<WorkDetailScreen workId="w1" />);
    await act(async () => {
      await fireEvent.press(screen.getByTestId('work-detail-delete'));
    });
    expect(screen.getByText('Excluir trabalho recorrente?')).toBeTruthy();
    expect(screen.getByTestId('work-delete-scope-one').props.accessibilityState).toMatchObject({
      checked: true,
    });
    await act(async () => {
      await fireEvent.press(screen.getByTestId('work-delete-confirm'));
    });
    expect(mockDelete).toHaveBeenCalledWith('w1', 'delete-key');
    expect(mockDeleteForward).not.toHaveBeenCalled();
  });

  it('"Este e os próximos" encerra a série a partir deste dia', async () => {
    mockDelete.mockClear();
    mockDeleteForward.mockClear();
    mockDetail = { isPending: false, isError: false, isSuccess: true, data: occurrence() };
    await renderWithProviders(<WorkDetailScreen workId="w1" />);
    await act(async () => {
      await fireEvent.press(screen.getByTestId('work-detail-delete'));
    });
    await act(async () => {
      await fireEvent.press(screen.getByTestId('work-delete-scope-forward'));
    });
    expect(screen.getByText(/A partir de 14 SET, a recorrência termina/)).toBeTruthy();
    expect(screen.getByTestId('work-delete-confirm').props.accessibilityLabel).toBe(
      'Excluir este e os próximos',
    );
    await act(async () => {
      await fireEvent.press(screen.getByTestId('work-delete-confirm'));
    });
    expect(mockDeleteForward).toHaveBeenCalledWith('w1');
    expect(mockDelete).not.toHaveBeenCalled();
    expect(router.back).toHaveBeenCalled();
  });

  it('trabalho avulso continua com a confirmação simples', async () => {
    mockDetail = { isPending: false, isError: false, isSuccess: true, data: work({}) };
    await renderWithProviders(<WorkDetailScreen workId="w1" />);
    await act(async () => {
      await fireEvent.press(screen.getByTestId('work-detail-delete'));
    });
    expect(screen.getByText('Excluir este trabalho?')).toBeTruthy();
    expect(screen.queryByTestId('work-delete-scope-forward')).toBeNull();
  });
});
