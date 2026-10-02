import '@/i18n';
import { act, fireEvent, screen } from '@testing-library/react-native';
import { router } from 'expo-router';
import { createWorkLocation, listWorkLocations } from '@/features/locations/locations-data';
import { useProfileDraft } from '@/features/onboarding/profile-draft';
import { renderWithProviders } from '@/test/render';
import { FirstWorkFlow } from './first-work/FirstWorkFlow';
import { confirmReceivableReceived, createWorkWithReceivable } from './work-data';
import { useWorkDraft } from './work-draft';
import { addDaysToLocalDate, todayInTimezone } from './work-schedule';

const TODAY = todayInTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone);
// O calendário abre no mês atual: o dia escolhido nos testes precisa estar nele.
const DAY_IN_MONTH = `${TODAY.slice(0, 7)}-12`;

const mockSetOptions = jest.fn();
jest.mock('expo-router', () => ({
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn() },
  useNavigation: () => ({ setOptions: mockSetOptions }),
}));
jest.mock('@/features/auth/AuthSessionProvider', () => ({
  AuthSessionProvider: ({ children }: { children: React.ReactNode }) => children,
  useAuthSession: () => ({ status: 'signedIn', userId: 'user-1' }),
}));
jest.mock('@/features/locations/locations-data', () => ({
  ...jest.requireActual('@/features/locations/locations-data'),
  listWorkLocations: jest.fn(async () => []),
  createWorkLocation: jest.fn(async () => ({
    id: 'loc-1',
    name: 'Hospital São Lucas',
    city: null,
    colorToken: 'sage',
    colorSource: 'automatic' as const,
    archivedAt: null,
  })),
}));
jest.mock('./work-data', () => ({
  ...jest.requireActual('./work-data'),
  createWorkWithReceivable: jest.fn(async () => ({ workId: 'w1', receivableId: 'r1' })),
  confirmReceivableReceived: jest.fn(async () => ({ receivableId: 'r1', receivedAt: 'x' })),
  newIdempotencyKey: () => 'key-1',
}));

const mockedCreateWork = jest.mocked(createWorkWithReceivable);
const mockedConfirm = jest.mocked(confirmReceivableReceived);
const mockedCreateLocation = jest.mocked(createWorkLocation);
const mockedListLocations = jest.mocked(listWorkLocations);

beforeEach(() => {
  jest.clearAllMocks();
  useWorkDraft.getState().reset();
  useProfileDraft.getState().reset();
  mockedListLocations.mockResolvedValue([]);
});

async function press(testID: string) {
  await act(async () => {
    await fireEvent.press(screen.getByTestId(testID));
  });
}

describe('primeiro trabalho numa rota só, com a peça no topo (7.7)', () => {
  it('a peça começa vazia e ganha cada encaixe conforme as respostas', async () => {
    await renderWithProviders(<FirstWorkFlow />);
    expect(screen.getByText('Tipo')).toBeTruthy();
    expect(screen.getByText('Local')).toBeTruthy();
    expect(screen.getByText('Entrada')).toBeTruthy();

    await press('work-type-shift');
    expect(screen.getByTestId('work-piece-type')).toHaveTextContent('PLANTÃO');
    await press('work-type-cta');
    expect(screen.getByTestId('first-work-place')).toBeTruthy();

    // O local entra na peça enquanto se digita.
    await act(async () => {
      await fireEvent.changeText(screen.getByTestId('work-place-input'), 'Hospital São Lucas');
    });
    expect(screen.getByTestId('work-piece-place')).toHaveTextContent('Hospital São Lucas');
  });

  it('voltar retorna à etapa anterior sem perder nada; na primeira, sai do fluxo', async () => {
    useWorkDraft.setState({ type: 'shift', locationName: 'Hospital São Lucas' });
    await renderWithProviders(<FirstWorkFlow initialStep="when" />);
    // Fora da primeira etapa o gesto de voltar do iOS fica desligado.
    expect(mockSetOptions).toHaveBeenLastCalledWith({ gestureEnabled: false });

    await press('first-work-header-back');
    expect(screen.getByTestId('first-work-place')).toBeTruthy();
    expect(screen.getByTestId('work-place-input').props.value).toBe('Hospital São Lucas');
    await press('first-work-header-back');
    expect(screen.getByTestId('first-work-type')).toBeTruthy();
    expect(mockSetOptions).toHaveBeenLastCalledWith({ gestureEnabled: true });
    await press('first-work-header-back');
    expect(router.back).toHaveBeenCalled();
  });
});

describe('tipo', () => {
  it('exige um tipo e não oferece Residência', async () => {
    await renderWithProviders(<FirstWorkFlow />);
    expect(screen.queryByText(/Residência/)).toBeNull();
    await press('work-type-cta');
    expect(screen.getByText('Escolha um tipo para continuar.')).toBeTruthy();
    expect(screen.queryByTestId('first-work-place')).toBeNull();
  });

  it('avisa quem tem residência que ali entram os trabalhos além dela', async () => {
    useProfileDraft.setState({ status: 'resident' });
    await renderWithProviders(<FirstWorkFlow />);
    expect(screen.getByText(/Sua residência já está cadastrada/)).toBeTruthy();
  });
});

describe('local', () => {
  it('exige o nome, guarda sem espaços em volta e o título acompanha o tipo', async () => {
    useWorkDraft.setState({ type: 'appointment' });
    await renderWithProviders(<FirstWorkFlow initialStep="place" />);
    expect(screen.getByRole('header', { name: 'Onde acontece esse atendimento?' })).toBeTruthy();

    await press('work-place-cta');
    expect(screen.getByText('Informe onde o trabalho acontece.')).toBeTruthy();

    await act(async () => {
      await fireEvent.changeText(screen.getByTestId('work-place-input'), '  Hospital São Lucas  ');
    });
    await press('work-place-cta');
    expect(useWorkDraft.getState().locationName).toBe('Hospital São Lucas');
    expect(screen.getByTestId('first-work-when')).toBeTruthy();
  });
});

describe('data do trabalho', () => {
  it('título curto e Plantão exige data, horário e duração', async () => {
    useWorkDraft.setState({ type: 'shift' });
    await renderWithProviders(<FirstWorkFlow initialStep="when" />);
    expect(screen.getByRole('header', { name: 'Data do trabalho' })).toBeTruthy();
    await press('work-when-cta');
    expect(screen.getByText('Escolha a data do trabalho.')).toBeTruthy();

    await press(`work-when-calendar-${DAY_IN_MONTH}`);
    expect(screen.getByTestId('work-piece-date')).toBeTruthy();
    await press('work-when-cta');
    expect(screen.getByText('Plantão precisa de horário de início e duração.')).toBeTruthy();

    // Tocar no campo abre o seletor nativo numa folha.
    await press('work-start-field');
    expect(screen.getByTestId('work-start-sheet-panel')).toBeTruthy();
    await press('work-duration-12');
    expect(useWorkDraft.getState().durationMinutes).toBe(720);
    await press('work-when-cta');
    expect(screen.queryByTestId('first-work-amount')).toBeNull();

    // O horário só é gravado ao confirmar na folha.
    await press('work-start-field');
    expect(useWorkDraft.getState().startTime).toBeNull();
    await press('work-start-confirm');
    expect(useWorkDraft.getState().startTime).toBe('19:00');
    expect(screen.getByText(/Termina às 07:00 do dia seguinte/)).toBeTruthy();
    await press('work-when-cta');
    expect(screen.getByTestId('first-work-amount')).toBeTruthy();
  });

  it('Procedimento e Atendimento não exigem horário', async () => {
    useWorkDraft.setState({ type: 'procedure' });
    await renderWithProviders(<FirstWorkFlow initialStep="when" />);
    expect(screen.getByTestId('work-when-add-schedule')).toBeTruthy();
    await press(`work-when-calendar-${DAY_IN_MONTH}`);
    await press('work-when-cta');
    expect(screen.getByTestId('first-work-amount')).toBeTruthy();
  });
});

describe('valor', () => {
  it('exige o valor; a peça mostra o valor enquanto se digita', async () => {
    useWorkDraft.setState({ type: 'shift', workDate: '2026-09-12' });
    await renderWithProviders(<FirstWorkFlow initialStep="amount" />);
    await press('work-amount-cta');
    expect(screen.getByText('Informe quanto você recebe.')).toBeTruthy();
    expect(screen.queryByTestId('first-work-expected')).toBeNull();

    await act(async () => {
      await fireEvent.changeText(screen.getByLabelText('Valor do trabalho'), '1.500');
    });
    expect(screen.getByTestId('work-piece-amount')).toHaveTextContent(/1\.500/);
    await press('work-amount-cta');
    expect(screen.getByTestId('first-work-expected')).toBeTruthy();
  });
});

describe('entrada prevista', () => {
  const ready = {
    type: 'shift' as const,
    locationName: 'Hospital São Lucas',
    workDate: addDaysToLocalDate(TODAY, 3),
    startTime: '19:00',
    durationMinutes: 720,
    amount: '1.200',
  };

  it('exige um estado conhecido de previsão', async () => {
    useWorkDraft.setState(ready);
    await renderWithProviders(<FirstWorkFlow initialStep="expected" />);
    await press('work-expected-cta');
    expect(mockedCreateWork).not.toHaveBeenCalled();
    expect(screen.getByText('Escolha uma data ou marque que ainda não sabe.')).toBeTruthy();
  });

  it('30 dias: a ligação mostra trabalho → +30 dias → entrada, e grava', async () => {
    useWorkDraft.setState(ready);
    await renderWithProviders(<FirstWorkFlow initialStep="expected" />);
    const entry = addDaysToLocalDate(ready.workDate, 30);
    await press('work-expected-30');
    expect(useWorkDraft.getState().expected).toEqual({ kind: 'date', date: entry });
    expect(screen.getByTestId('work-money-link-term')).toHaveTextContent('+30 dias');
    expect(screen.getByTestId('work-piece-entry')).toHaveTextContent(/Entrada prevista/);

    await press('work-expected-cta');
    expect(mockedCreateLocation).toHaveBeenCalled();
    expect(mockedCreateWork).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'shift',
        locationId: 'loc-1',
        workDate: ready.workDate,
        startTime: '19:00',
        durationMinutes: 720,
        amountCents: 120000n,
        expectedOn: entry,
      }),
      'key-1',
    );
    // `replace`: sem voltar para o fluxo e gravar de novo.
    expect(router.replace).toHaveBeenCalledWith({
      pathname: '/first-work-done',
      params: { workId: 'w1' },
    });
  });

  it('sem previsão grava data nula e a peça mostra "Entrada a definir"', async () => {
    useWorkDraft.setState(ready);
    await renderWithProviders(<FirstWorkFlow initialStep="expected" />);
    await press('work-expected-unknown');
    expect(screen.getByText(/sem previsão/)).toBeTruthy();
    expect(screen.getByTestId('work-piece-entry')).toHaveTextContent('Entrada a definir');
    await press('work-expected-cta');
    expect(mockedCreateWork.mock.calls[0][0]).toMatchObject({ expectedOn: null });
  });

  it('Outra data abre o calendário nativo e grava só a data confirmada', async () => {
    useWorkDraft.setState({ ...ready, workDate: '2026-09-12' });
    await renderWithProviders(<FirstWorkFlow initialStep="expected" />);
    await press('work-expected-other');
    expect(screen.getByTestId('work-expected-sheet-panel')).toBeTruthy();
    await act(async () => {
      await fireEvent(
        screen.getByTestId('work-expected-picker'),
        'valueChange',
        { type: 'set', nativeEvent: {} },
        new Date(2026, 10, 20, 12),
      );
    });
    expect(useWorkDraft.getState().expected).toBeNull();
    await press('work-expected-confirm');
    expect(useWorkDraft.getState().expected).toEqual({ kind: 'date', date: '2026-11-20' });
    expect(screen.getByTestId('work-expected-other').props.accessibilityState).toMatchObject({
      selected: true,
    });
  });

  it('reaproveita Local existente pelo nome, sem criar duplicado', async () => {
    mockedListLocations.mockResolvedValue([
      {
        id: 'loc-existente',
        name: 'hospital são lucas',
        city: null,
        colorToken: 'sage',
        colorSource: 'automatic',
        archivedAt: null,
      },
    ]);
    useWorkDraft.setState({ ...ready, expected: { kind: 'unknown' } });
    await renderWithProviders(<FirstWorkFlow initialStep="expected" />);
    await press('work-expected-cta');
    expect(mockedCreateLocation).not.toHaveBeenCalled();
    expect(mockedCreateWork.mock.calls[0][0]).toMatchObject({ locationId: 'loc-existente' });
  });

  it('erro do servidor mantém o rascunho e reusa a chave de idempotência', async () => {
    mockedCreateWork.mockRejectedValueOnce(new Error('network'));
    useWorkDraft.setState({ ...ready, expected: { kind: 'unknown' } });
    await renderWithProviders(<FirstWorkFlow initialStep="expected" />);
    await press('work-expected-cta');
    expect(router.replace).not.toHaveBeenCalled();
    expect(useWorkDraft.getState().amount).toBe('1.200');
    await press('work-expected-cta');
    expect(mockedCreateWork).toHaveBeenCalledTimes(2);
    expect(mockedCreateWork.mock.calls[0][1]).toBe(mockedCreateWork.mock.calls[1][1]);
  });
});

describe('trabalho no passado (7.7)', () => {
  const workDate = `${Number(TODAY.slice(0, 4)) - 1}-${TODAY.slice(5, 7)}-10`;
  const pastWork = {
    type: 'shift' as const,
    locationName: 'Hospital São Lucas',
    workDate,
    startTime: '19:00',
    durationMinutes: 720,
    amount: '1.500',
  };

  it('cada prazo mostra a data calculada a partir do trabalho', async () => {
    useWorkDraft.setState({ ...pastWork, workDate: '2026-09-12' });
    await renderWithProviders(<FirstWorkFlow initialStep="expected" />);
    expect(screen.getByTestId('work-expected-30-date')).toHaveTextContent('12 OUT');
    expect(screen.getByTestId('work-expected-60-date')).toHaveTextContent('11 NOV');
    expect(screen.getByTestId('work-expected-90-date')).toHaveTextContent('11 DEZ');
  });

  it('data vencida pergunta se recebeu, começando em "Ainda não"', async () => {
    useWorkDraft.setState(pastWork);
    await renderWithProviders(<FirstWorkFlow initialStep="expected" />);
    expect(screen.queryByTestId('work-received')).toBeNull();
    await press('work-expected-30');
    expect(screen.getByTestId('work-received-no').props.accessibilityState).toMatchObject({
      checked: true,
    });
    expect(screen.getByTestId('work-piece-entry')).toHaveTextContent(/Aguardando confirmação/);
    expect(screen.getByTestId('work-money-link-entry')).toBeTruthy();
  });

  it('"Já recebi" grava o trabalho e confirma o recebimento na data prevista', async () => {
    useWorkDraft.setState(pastWork);
    await renderWithProviders(<FirstWorkFlow initialStep="expected" />);
    await press('work-expected-30');
    await press('work-received-yes');
    expect(screen.getByTestId('work-piece-entry')).toHaveTextContent(/Recebido/);
    const expected = useWorkDraft.getState().expected;
    const date = expected?.kind === 'date' ? expected.date : '';
    await press('work-expected-cta');
    expect(mockedCreateWork.mock.calls[0][0]).toMatchObject({ workDate, expectedOn: date });
    expect(mockedConfirm).toHaveBeenCalledWith('r1', date);
  });

  it('"Ainda não recebi" grava sem confirmar', async () => {
    useWorkDraft.setState(pastWork);
    await renderWithProviders(<FirstWorkFlow initialStep="expected" />);
    await press('work-expected-30');
    await press('work-expected-cta');
    expect(mockedCreateWork).toHaveBeenCalled();
    expect(mockedConfirm).not.toHaveBeenCalled();
  });
});
