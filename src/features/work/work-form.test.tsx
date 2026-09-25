import '@/i18n';
import { act, fireEvent, screen, waitFor } from '@testing-library/react-native';
import { createWorkLocation, listWorkLocations } from '@/features/locations/locations-data';
import { deviceTimezone } from '@/features/onboarding/profile-data';
import { renderWithProviders } from '@/test/render';
import { NewWorkFlow } from './form/NewWorkFlow';
import { canSaveWork } from './form/WorkForm';
import { listMonthWorkDots } from './month-work-dots';
import { createWorkWithReceivable } from './work-data';
import { useNewWorkDraft } from './work-draft';
import { addDaysToLocalDate, todayInTimezone } from './work-schedule';

jest.mock('@/features/auth/AuthSessionProvider', () => ({
  AuthSessionProvider: ({ children }: { children: React.ReactNode }) => children,
  useAuthSession: () => ({ status: 'signedIn', userId: 'user-1' }),
}));
let mockLocations: unknown[] = [];
jest.mock('@/features/locations/locations-data', () => ({
  ...jest.requireActual('@/features/locations/locations-data'),
  // O hook chama a lista de dentro do próprio módulo; o campo recebe os Locais por ele.
  useWorkLocations: () => ({ data: mockLocations }),
  listWorkLocations: jest.fn(async () => mockLocations),
  createWorkLocation: jest.fn(async () => ({
    id: 'loc-new',
    name: 'Clínica Nova',
    city: null,
    colorToken: 'sage',
    colorSource: 'automatic' as const,
    archivedAt: null,
  })),
}));
jest.mock('./work-data', () => ({
  ...jest.requireActual('./work-data'),
  createWorkWithReceivable: jest.fn(async () => ({ workId: 'w1', receivableId: 'r1' })),
  newIdempotencyKey: () => 'key-1',
}));
let mockTemplates: unknown[] = [];
jest.mock('./work-templates', () => ({
  ...jest.requireActual('./work-templates'),
  useWorkTemplates: () => ({ isPending: false, data: mockTemplates }),
}));
jest.mock('./month-work-dots', () => ({
  ...jest.requireActual('./month-work-dots'),
  listMonthWorkDots: jest.fn(async () => ({})),
}));

const mockedList = jest.mocked(listWorkLocations);
const mockedCreateLocation = jest.mocked(createWorkLocation);
const mockedCreateWork = jest.mocked(createWorkWithReceivable);
const mockedDots = jest.mocked(listMonthWorkDots);

const hospital = {
  id: 'loc-hsl',
  name: 'Hospital São Lucas',
  city: null,
  colorToken: 'bronze',
  colorSource: 'automatic' as const,
  archivedAt: null,
};

// O calendário abre no mês de hoje; o dia 12 desse mês sempre existe.
const today = todayInTimezone(deviceTimezone());
const workDate = `${today.slice(0, 7)}-12`;

beforeEach(() => {
  jest.clearAllMocks();
  mockLocations = [];
  mockTemplates = [];
  mockedList.mockImplementation(async () => mockLocations as never);
  mockedDots.mockResolvedValue({});
});

async function press(testID: string) {
  await act(async () => {
    await fireEvent.press(screen.getByTestId(testID));
  });
}

/** Sem histórico, o `+` abre direto na escolha do tipo. */
async function openForm(type: 'shift' | 'procedure' = 'shift') {
  const onClose = jest.fn();
  await renderWithProviders(<NewWorkFlow onClose={onClose} />);
  expect(screen.getByTestId('new-work-type-step')).toBeTruthy();
  expect(screen.getByRole('header', { name: 'O que você quer adicionar?' })).toBeTruthy();
  await act(async () => {
    await fireEvent.press(
      screen.getByRole('button', { name: type === 'shift' ? 'Plantão' : 'Procedimento' }),
    );
  });
  expect(screen.getByRole('header', { name: 'Novo trabalho' })).toBeTruthy();
  return { onClose };
}

async function pickDate() {
  await press('work-date-field');
  await press(`work-date-calendar-${workDate}`);
  await press('work-date-confirm');
}

describe('regra de salvar', () => {
  const base = {
    type: 'shift',
    locationName: 'HSL',
    workDate: '2026-09-12',
    startTime: '19:00',
    durationMinutes: 720,
    amount: '1.200',
  };

  it('Plantão exige local, data, valor, início e duração', () => {
    expect(canSaveWork(base)).toBe(true);
    expect(canSaveWork({ ...base, startTime: null })).toBe(false);
    expect(canSaveWork({ ...base, durationMinutes: null })).toBe(false);
    expect(canSaveWork({ ...base, locationName: '  ' })).toBe(false);
    expect(canSaveWork({ ...base, amount: '0' })).toBe(false);
    expect(canSaveWork({ ...base, workDate: null })).toBe(false);
  });

  it('Procedimento e Atendimento dispensam horário e duração', () => {
    expect(
      canSaveWork({ ...base, type: 'procedure', startTime: null, durationMinutes: null }),
    ).toBe(true);
  });
});

describe('fluxo do + (Agenda 06–10)', () => {
  it('cria um Plantão com Local novo, término no dia seguinte e sem previsão', async () => {
    const { onClose } = await openForm('shift');
    expect(screen.getByTestId('work-save').props.accessibilityState).toMatchObject({
      disabled: true,
    });

    await act(async () => {
      await fireEvent.changeText(screen.getByTestId('work-location-input'), 'Clínica Nova');
    });
    await pickDate();
    expect(useNewWorkDraft.getState().workDate).toBe(workDate);

    await press('work-start-field');
    await press('work-start-confirm');
    await press('work-duration-12');
    expect(screen.getByTestId('work-form-end').props.children).toMatch(/Termina às 07:00 · 13 /);

    await act(async () => {
      await fireEvent.changeText(screen.getByLabelText('QUANTO VOCÊ VAI RECEBER?'), '1.200');
    });
    expect(screen.getByTestId('work-save').props.accessibilityState).toMatchObject({
      disabled: false,
    });

    await press('work-save');
    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(mockedCreateLocation).toHaveBeenCalledWith({ name: 'Clínica Nova' }, []);
    expect(mockedCreateWork).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'shift',
        locationId: 'loc-new',
        workDate,
        startTime: '19:00',
        durationMinutes: 720,
        amountCents: 120000n,
        expectedOn: null,
      }),
      'key-1',
    );
  });

  it('reaproveita Local sugerido e grava a previsão D60 calculada da data', async () => {
    mockLocations = [hospital];
    await openForm('procedure');

    const input = screen.getByTestId('work-location-input');
    await act(async () => {
      await fireEvent(input, 'focus');
      await fireEvent.changeText(input, 'são');
    });
    await press('work-location-suggestion-loc-hsl');
    expect(useNewWorkDraft.getState().locationName).toBe('Hospital São Lucas');

    await pickDate();
    await press('work-expected-field');
    expect(screen.getByText(/Contando a partir de 12 /)).toBeTruthy();
    await press('work-payment-60');
    await press('work-payment-confirm');
    const expected = addDaysToLocalDate(workDate, 60);
    expect(useNewWorkDraft.getState().expected).toEqual({ kind: 'date', date: expected });
    expect(screen.getByTestId('work-expected-field').props.accessibilityValue.text).toMatch(
      /^Em 60 dias · /,
    );

    await act(async () => {
      await fireEvent.changeText(screen.getByLabelText('QUANTO VOCÊ VAI RECEBER?'), '800');
    });
    // Procedimento salva sem horário.
    await press('work-save');
    await waitFor(() => expect(mockedCreateWork).toHaveBeenCalled());
    expect(mockedCreateLocation).not.toHaveBeenCalled();
    expect(mockedCreateWork.mock.calls[0][0]).toMatchObject({
      type: 'procedure',
      locationId: 'loc-hsl',
      startTime: null,
      durationMinutes: null,
      expectedOn: expected,
    });
  });

  it('Outro abre o stepper e grava a duração em horas', async () => {
    await openForm('shift');
    await press('work-duration-other');
    expect(screen.getByTestId('work-duration-value').props.children).toBe('8');
    await press('work-duration-plus');
    await press('work-duration-confirm');
    expect(useNewWorkDraft.getState().durationMinutes).toBe(540);
    expect(screen.getByRole('button', { name: 'Outro' }).props.accessibilityState).toMatchObject({
      selected: true,
    });
  });

  it('a previsão só abre depois da data e "Ainda não sei" grava sem data', async () => {
    await openForm('shift');
    expect(screen.getByTestId('work-expected-field').props.accessibilityState).toMatchObject({
      disabled: true,
    });
    await pickDate();
    await press('work-expected-field');
    await press('work-payment-unknown');
    await press('work-payment-confirm');
    expect(useNewWorkDraft.getState().expected).toEqual({ kind: 'unknown' });
    expect(screen.getByTestId('work-expected-field').props.accessibilityValue).toEqual({
      text: 'Ainda não sei',
    });
  });

  it('voltar do formulário descarta o rascunho e fechar sai do fluxo', async () => {
    const { onClose } = await openForm('shift');
    await act(async () => {
      await fireEvent.changeText(screen.getByTestId('work-location-input'), 'X');
    });
    await press('navigation-back');
    expect(screen.getByTestId('new-work-type-step')).toBeTruthy();
    expect(useNewWorkDraft.getState().locationName).toBe('');
    await press('navigation-close');
    expect(onClose).toHaveBeenCalled();
  });

  it('com histórico mostra "Usar novamente"; o template preenche tudo e pergunta a data', async () => {
    mockLocations = [hospital];
    mockTemplates = [
      {
        key: 'k1',
        type: 'shift',
        locationId: 'loc-hsl',
        locationName: 'Hospital São Lucas',
        colorToken: 'bronze',
        startTime: '19:00',
        durationMinutes: 720,
        amountCents: 120000n,
        payment: { kind: 'term', days: 30 },
      },
    ];
    const onClose = jest.fn();
    await renderWithProviders(<NewWorkFlow onClose={onClose} />);
    expect(screen.getByText('USAR NOVAMENTE')).toBeTruthy();
    expect(screen.getByText(/^Plantão · 12h · R\$\s?1\.200$/)).toBeTruthy();
    expect(screen.getByTestId('new-work-create')).toBeTruthy();

    await press('work-template-loc-hsl');
    // Abre direto na data; o resto veio do template.
    expect(screen.getByTestId('work-date-sheet-panel')).toBeTruthy();
    expect(useNewWorkDraft.getState()).toMatchObject({
      type: 'shift',
      locationName: 'Hospital São Lucas',
      startTime: '19:00',
      durationMinutes: 720,
      amount: '1.200',
      workDate: null,
    });
    await press(`work-date-calendar-${workDate}`);
    await press('work-date-confirm');
    // O prazo de 30 dias do último trabalho é reaplicado sobre a nova data.
    expect(useNewWorkDraft.getState().expected).toEqual({
      kind: 'date',
      date: addDaysToLocalDate(workDate, 30),
    });

    await press('work-save');
    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(mockedCreateLocation).not.toHaveBeenCalled();
    expect(mockedCreateWork.mock.calls[0][0]).toMatchObject({
      locationId: 'loc-hsl',
      workDate,
      amountCents: 120000n,
      expectedOn: addDaysToLocalDate(workDate, 30),
    });
  });

  it('com histórico, "Criar novo trabalho" abre a folha de tipo', async () => {
    mockTemplates = [
      {
        key: 'k1',
        type: 'procedure',
        locationId: 'loc-hsl',
        locationName: 'Hospital São Lucas',
        colorToken: 'bronze',
        startTime: null,
        durationMinutes: null,
        amountCents: 80000n,
        payment: null,
      },
    ];
    await renderWithProviders(<NewWorkFlow onClose={jest.fn()} />);
    await press('new-work-create');
    expect(screen.getByTestId('new-work-type-sheet-panel')).toBeTruthy();
    await act(async () => {
      await fireEvent.press(screen.getByRole('button', { name: 'Atendimento' }));
    });
    expect(useNewWorkDraft.getState().type).toBe('appointment');
    expect(screen.getByRole('header', { name: 'Novo trabalho' })).toBeTruthy();
  });
});
