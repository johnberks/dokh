import '@/i18n';
import { act, fireEvent, screen } from '@testing-library/react-native';
import { router } from 'expo-router';
import { useKeyboardVisible } from '@/components/useKeyboardVisible';
import { createWorkLocation, listWorkLocations } from '@/features/locations/locations-data';
import { useProfileDraft } from '@/features/onboarding/profile-draft';
import { renderWithProviders } from '@/test/render';
import { WorkAmountScreen } from './screens/WorkAmountScreen';
import { WorkPlaceScreen } from './screens/WorkPlaceScreen';
import { WorkTypeScreen } from './screens/WorkTypeScreen';
import { WorkWhenScreen } from './screens/WorkWhenScreen';
import { confirmReceivableReceived, createWorkWithReceivable } from './work-data';
import { useWorkDraft } from './work-draft';
import { todayInTimezone } from './work-schedule';

// O calendário abre no mês atual: o dia escolhido nos testes precisa estar nele.
const DAY_IN_MONTH = `${todayInTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone).slice(0, 7)}-12`;

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn() },
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

jest.mock('@/components/useKeyboardVisible', () => ({ useKeyboardVisible: jest.fn(() => false) }));

const mockedPush = jest.mocked(router.push);
const mockedKeyboardVisible = jest.mocked(useKeyboardVisible);
const mockedCreateWork = jest.mocked(createWorkWithReceivable);
const mockedConfirm = jest.mocked(confirmReceivableReceived);
const mockedCreateLocation = jest.mocked(createWorkLocation);
const mockedListLocations = jest.mocked(listWorkLocations);

beforeEach(() => {
  jest.clearAllMocks();
  useWorkDraft.getState().reset();
  useProfileDraft.getState().reset();
  mockedListLocations.mockResolvedValue([]);
  mockedKeyboardVisible.mockReturnValue(false);
});

describe('tipo do primeiro Trabalho (TELA 06)', () => {
  it('exige um tipo e não oferece Residência', async () => {
    await renderWithProviders(<WorkTypeScreen />);
    expect(screen.queryByText(/Residência/)).toBeNull();
    await act(async () => {
      await fireEvent.press(screen.getByTestId('work-type-cta'));
    });
    expect(mockedPush).not.toHaveBeenCalled();
    expect(screen.getByText('Escolha um tipo para continuar.')).toBeTruthy();

    await act(async () => {
      await fireEvent.press(screen.getByTestId('work-type-shift'));
      await fireEvent.press(screen.getByTestId('work-type-cta'));
    });
    expect(useWorkDraft.getState().type).toBe('shift');
    expect(mockedPush).toHaveBeenCalledWith('/work-place');
  });

  it('avisa quem tem residência que ali entram os trabalhos além dela', async () => {
    useProfileDraft.setState({ status: 'resident' });
    await renderWithProviders(<WorkTypeScreen />);
    expect(screen.getByText(/Sua residência já está cadastrada/)).toBeTruthy();
  });
});

describe('local (tela 19)', () => {
  it('exige o nome e guarda sem espaços em volta', async () => {
    useWorkDraft.setState({ type: 'shift' });
    await renderWithProviders(<WorkPlaceScreen />);
    expect(screen.getByRole('header', { name: 'Onde acontece esse plantão?' })).toBeTruthy();
    expect(screen.getByTestId('work-chip-shift')).toBeTruthy();

    await act(async () => {
      await fireEvent.press(screen.getByTestId('work-place-cta'));
    });
    expect(mockedPush).not.toHaveBeenCalled();
    expect(screen.getByText('Informe onde o trabalho acontece.')).toBeTruthy();

    await act(async () => {
      await fireEvent.changeText(screen.getByTestId('work-place-input'), '  Hospital São Lucas  ');
      await fireEvent.press(screen.getByTestId('work-place-cta'));
    });
    expect(useWorkDraft.getState().locationName).toBe('Hospital São Lucas');
    expect(mockedPush).toHaveBeenCalledWith('/work-when');
  });

  it('o título acompanha o tipo escolhido', async () => {
    useWorkDraft.setState({ type: 'appointment' });
    await renderWithProviders(<WorkPlaceScreen />);
    expect(screen.getByRole('header', { name: 'Onde acontece esse atendimento?' })).toBeTruthy();
  });
});

describe('quando acontece (tela 20)', () => {
  it('Plantão exige data, horário e duração', async () => {
    useWorkDraft.setState({ type: 'shift' });
    await renderWithProviders(<WorkWhenScreen />);
    await act(async () => {
      await fireEvent.press(screen.getByTestId('work-when-cta'));
    });
    expect(screen.getByText('Escolha a data do trabalho.')).toBeTruthy();
    expect(mockedPush).not.toHaveBeenCalled();

    await act(async () => {
      await fireEvent.press(screen.getByTestId(`work-when-calendar-${DAY_IN_MONTH}`));
    });
    await act(async () => {
      await fireEvent.press(screen.getByTestId('work-when-cta'));
    });
    expect(screen.getByText('Plantão precisa de horário de início e duração.')).toBeTruthy();

    // Tocar no campo abre o seletor nativo numa folha, fora do caminho do botão Continuar.
    await act(async () => {
      await fireEvent.press(screen.getByTestId('work-start-field'));
    });
    expect(screen.getByTestId('work-start-sheet-panel')).toBeTruthy();
    expect(screen.getByTestId('work-start-picker')).toBeTruthy();

    await act(async () => {
      await fireEvent.press(screen.getByTestId('work-duration-12'));
    });
    expect(useWorkDraft.getState().durationMinutes).toBe(720);

    // Só a duração não basta: falta o horário de início.
    await act(async () => {
      await fireEvent.press(screen.getByTestId('work-when-cta'));
    });
    expect(mockedPush).not.toHaveBeenCalled();

    // O horário só é gravado ao confirmar na folha.
    await act(async () => {
      await fireEvent.press(screen.getByTestId('work-start-field'));
    });
    expect(useWorkDraft.getState().startTime).toBeNull();
    await act(async () => {
      await fireEvent.press(screen.getByTestId('work-start-confirm'));
    });
    expect(useWorkDraft.getState().startTime).toBe('19:00');
    await act(async () => {
      await fireEvent.press(screen.getByTestId('work-when-cta'));
    });
    expect(mockedPush).toHaveBeenCalledWith('/work-amount');
    expect(screen.getByText(/Termina às 07:00 do dia seguinte/)).toBeTruthy();
  });

  it('Procedimento e Atendimento não exigem horário', async () => {
    useWorkDraft.setState({ type: 'procedure' });
    await renderWithProviders(<WorkWhenScreen />);
    expect(screen.getByTestId('work-when-add-schedule')).toBeTruthy();

    await act(async () => {
      await fireEvent.press(screen.getByTestId(`work-when-calendar-${DAY_IN_MONTH}`));
    });
    await act(async () => {
      await fireEvent.press(screen.getByTestId('work-when-cta'));
    });
    expect(mockedPush).toHaveBeenCalledWith('/work-amount');
  });
});

describe('valor e previsão (tela 22)', () => {
  const ready = {
    type: 'shift' as const,
    locationName: 'Hospital São Lucas',
    workDate: '2026-09-12',
    startTime: '19:00',
    durationMinutes: 720,
  };

  it('exige valor e um estado conhecido de previsão', async () => {
    useWorkDraft.setState(ready);
    await renderWithProviders(<WorkAmountScreen />);
    await act(async () => {
      await fireEvent.press(screen.getByTestId('work-amount-cta'));
    });
    expect(mockedCreateWork).not.toHaveBeenCalled();
    expect(screen.getByText('Informe quanto você recebe.')).toBeTruthy();
    expect(screen.getByText('Escolha uma data ou marque que ainda não sabe.')).toBeTruthy();
  });

  it('prazo de 30 dias calcula a data a partir do trabalho e grava', async () => {
    useWorkDraft.setState(ready);
    await renderWithProviders(<WorkAmountScreen />);
    await act(async () => {
      await fireEvent.changeText(screen.getByLabelText('Valor do trabalho'), '1.200');
      await fireEvent.press(screen.getByTestId('work-expected-30'));
    });
    expect(useWorkDraft.getState().expected).toEqual({ kind: 'date', date: '2026-10-12' });

    await act(async () => {
      await fireEvent.press(screen.getByTestId('work-amount-cta'));
    });
    expect(mockedCreateLocation).toHaveBeenCalled();
    expect(mockedCreateWork).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'shift',
        locationId: 'loc-1',
        workDate: '2026-09-12',
        startTime: '19:00',
        durationMinutes: 720,
        amountCents: 120000n,
        expectedOn: '2026-10-12',
      }),
      'key-1',
    );
    // `replace`: sem voltar para a tela de valor e gravar de novo.
    expect(router.replace).toHaveBeenCalledWith({
      pathname: '/first-work-done',
      params: { workId: 'w1' },
    });
  });

  it('sem previsão grava data nula e explica o que acontece', async () => {
    useWorkDraft.setState(ready);
    await renderWithProviders(<WorkAmountScreen />);
    await act(async () => {
      await fireEvent.changeText(screen.getByLabelText('Valor do trabalho'), '1.200');
      await fireEvent.press(screen.getByTestId('work-expected-unknown'));
    });
    expect(screen.getByText(/sem previsão/)).toBeTruthy();

    await act(async () => {
      await fireEvent.press(screen.getByTestId('work-amount-cta'));
    });
    expect(mockedCreateWork.mock.calls[0][0]).toMatchObject({ expectedOn: null });
  });

  it('Outra data abre o calendário nativo e grava a data confirmada', async () => {
    useWorkDraft.setState(ready);
    await renderWithProviders(<WorkAmountScreen />);
    await act(async () => {
      await fireEvent.press(screen.getByTestId('work-expected-other'));
    });
    expect(screen.getByTestId('work-expected-sheet-panel')).toBeTruthy();

    await act(async () => {
      await fireEvent(
        screen.getByTestId('work-expected-picker'),
        'valueChange',
        { type: 'set', nativeEvent: {} },
        new Date(2026, 10, 20, 12),
      );
    });
    // Girar o calendário não grava nada; só a confirmação.
    expect(useWorkDraft.getState().expected).toBeNull();
    await act(async () => {
      await fireEvent.press(screen.getByTestId('work-expected-confirm'));
    });
    expect(useWorkDraft.getState().expected).toEqual({ kind: 'date', date: '2026-11-20' });
    expect(screen.getByText('20 DE NOV. DE 2026')).toBeTruthy();
    expect(screen.getByTestId('work-expected-other').props.accessibilityState).toMatchObject({
      selected: true,
    });
  });

  it('com o teclado aberto mostra só o valor e o botão apenas baixa o teclado', async () => {
    mockedKeyboardVisible.mockReturnValue(true);
    useWorkDraft.setState(ready);
    await renderWithProviders(<WorkAmountScreen />);
    expect(screen.queryByTestId('work-expected')).toBeNull();
    expect(screen.getByText('Continuar')).toBeTruthy();
    await act(async () => {
      await fireEvent.press(screen.getByTestId('work-amount-cta'));
    });
    expect(mockedCreateWork).not.toHaveBeenCalled();
    expect(screen.queryByText('Informe quanto você recebe.')).toBeNull();
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
    useWorkDraft.setState({ ...ready, amount: '1.200', expected: { kind: 'unknown' } });
    await renderWithProviders(<WorkAmountScreen />);
    await act(async () => {
      await fireEvent.press(screen.getByTestId('work-amount-cta'));
    });
    expect(mockedCreateLocation).not.toHaveBeenCalled();
    expect(mockedCreateWork.mock.calls[0][0]).toMatchObject({ locationId: 'loc-existente' });
  });

  it('erro do servidor mantém o rascunho e reusa a chave de idempotência', async () => {
    mockedCreateWork.mockRejectedValueOnce(new Error('network'));
    useWorkDraft.setState({ ...ready, amount: '1.200', expected: { kind: 'unknown' } });
    await renderWithProviders(<WorkAmountScreen />);
    await act(async () => {
      await fireEvent.press(screen.getByTestId('work-amount-cta'));
    });
    expect(mockedPush).not.toHaveBeenCalled();
    expect(useWorkDraft.getState().amount).toBe('1.200');

    await act(async () => {
      await fireEvent.press(screen.getByTestId('work-amount-cta'));
    });
    expect(mockedCreateWork).toHaveBeenCalledTimes(2);
    expect(mockedCreateWork.mock.calls[0][1]).toBe(mockedCreateWork.mock.calls[1][1]);
  });
});

describe('trabalho no passado (7.7)', () => {
  // Plantão de dois meses atrás: o D30 já passou, o D90 pode não ter passado.
  const past = todayInTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone);
  const workDate = `${Number(past.slice(0, 4)) - 1}-${past.slice(5, 7)}-10`;
  const pastWork = {
    type: 'shift' as const,
    locationName: 'Hospital São Lucas',
    workDate,
    startTime: '19:00',
    durationMinutes: 720,
  };

  it('cada prazo mostra a data calculada a partir do trabalho', async () => {
    useWorkDraft.setState({ ...pastWork, workDate: '2026-09-12' });
    await renderWithProviders(<WorkAmountScreen />);
    expect(screen.getByTestId('work-expected-30-date')).toHaveTextContent('12 OUT');
    expect(screen.getByTestId('work-expected-60-date')).toHaveTextContent('11 NOV');
    expect(screen.getByTestId('work-expected-90-date')).toHaveTextContent('11 DEZ');
  });

  it('data prevista já vencida pergunta se recebeu, começando em "Ainda não"', async () => {
    useWorkDraft.setState(pastWork);
    await renderWithProviders(<WorkAmountScreen />);
    expect(screen.queryByTestId('work-received')).toBeNull();
    await act(async () => {
      await fireEvent.press(screen.getByTestId('work-expected-30'));
    });
    expect(screen.getByText(/já passou/)).toBeTruthy();
    expect(screen.getByTestId('work-received-no').props.accessibilityState).toMatchObject({
      checked: true,
    });
    expect(screen.getByText('Ele fica aguardando sua confirmação em Finanças.')).toBeTruthy();
  });

  it('"Já recebi" grava o trabalho e confirma o recebimento na data prevista', async () => {
    useWorkDraft.setState({ ...pastWork, amount: '1.500' });
    await renderWithProviders(<WorkAmountScreen />);
    await act(async () => {
      await fireEvent.press(screen.getByTestId('work-expected-30'));
    });
    await act(async () => {
      await fireEvent.press(screen.getByTestId('work-received-yes'));
    });
    const expectedOn = useWorkDraft.getState().expected;
    expect(expectedOn).toMatchObject({ kind: 'date', received: true });

    await act(async () => {
      await fireEvent.press(screen.getByTestId('work-amount-cta'));
    });
    const date = expectedOn?.kind === 'date' ? expectedOn.date : '';
    expect(mockedCreateWork.mock.calls[0][0]).toMatchObject({ workDate, expectedOn: date });
    expect(mockedConfirm).toHaveBeenCalledWith('r1', date);
  });

  it('"Ainda não recebi" grava sem confirmar', async () => {
    useWorkDraft.setState({ ...pastWork, amount: '1.500' });
    await renderWithProviders(<WorkAmountScreen />);
    await act(async () => {
      await fireEvent.press(screen.getByTestId('work-expected-30'));
    });
    await act(async () => {
      await fireEvent.press(screen.getByTestId('work-amount-cta'));
    });
    expect(mockedCreateWork).toHaveBeenCalled();
    expect(mockedConfirm).not.toHaveBeenCalled();
  });

  it('título curto "Data do trabalho" e dias passados sem esmaecer', async () => {
    useWorkDraft.setState({ type: 'shift' });
    await renderWithProviders(<WorkWhenScreen />);
    expect(screen.getByRole('header', { name: 'Data do trabalho' })).toBeTruthy();
  });
});
