import '@/i18n';
import { act, fireEvent, screen, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';
import { createWorkLocation } from '@/features/locations/locations-data';
import { updateWorkWithReceivable } from '@/features/work/work-data';
import { useEditWorkDraft } from '@/features/work/work-draft';
import { renderWithProviders } from '@/test/render';
import type { AgendaWork } from './agenda-data';
import { EditWorkScreen, editDraftFromWork } from './EditWorkScreen';

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn() },
}));
jest.mock('@/features/auth/AuthSessionProvider', () => ({
  AuthSessionProvider: ({ children }: { children: React.ReactNode }) => children,
  useAuthSession: () => ({ status: 'signedIn', userId: 'user-1' }),
}));
const mockLocations = [
  {
    id: 'loc-ubs',
    name: 'Ubs Xpto',
    city: null,
    colorToken: 'sage',
    colorSource: 'automatic' as const,
    archivedAt: null,
  },
];
jest.mock('@/features/locations/locations-data', () => ({
  ...jest.requireActual('@/features/locations/locations-data'),
  useWorkLocations: () => ({ data: mockLocations }),
  listWorkLocations: jest.fn(async () => mockLocations),
  createWorkLocation: jest.fn(),
}));
jest.mock('@/features/work/work-data', () => ({
  ...jest.requireActual('@/features/work/work-data'),
  updateWorkWithReceivable: jest.fn(async () => ({ workId: 'w1', receivableId: 'r1' })),
  newIdempotencyKey: () => 'edit-key',
}));
jest.mock('@/features/work/month-work-dots', () => ({
  ...jest.requireActual('@/features/work/month-work-dots'),
  listMonthWorkDots: jest.fn(async () => ({})),
}));

let mockWork: AgendaWork | null = null;
jest.mock('./agenda-data', () => ({
  ...jest.requireActual('./agenda-data'),
  useAgendaWork: () => ({
    isPending: false,
    isError: false,
    isSuccess: true,
    data: mockWork,
    refetch: jest.fn(),
    isFetching: false,
  }),
}));

const shift: AgendaWork = {
  id: 'w1',
  workDate: '2026-09-28',
  startTime: '19:00',
  durationMinutes: 720,
  type: 'shift',
  description: null,
  locationName: 'Ubs Xpto',
  colorToken: 'sage',
  amountCents: 120000n,
  expectedOn: '2026-10-28',
  receiptStatus: 'scheduled',
};

beforeEach(() => {
  jest.clearAllMocks();
  mockWork = shift;
  useEditWorkDraft.getState().reset();
});

describe('editar trabalho (Agenda 16)', () => {
  it('preenche tudo a partir do que está gravado', () => {
    expect(editDraftFromWork(shift)).toEqual({
      type: 'shift',
      locationName: 'Ubs Xpto',
      workDate: '2026-09-28',
      startTime: '19:00',
      durationMinutes: 720,
      amount: '1.200',
      expected: { kind: 'date', date: '2026-10-28' },
      idempotencyKey: null,
      plannedTermDays: null,
      description: null,
    });
    expect(
      editDraftFromWork({ ...shift, expectedOn: null, description: 'Cirurgia' }),
    ).toMatchObject({ expected: { kind: 'unknown' }, description: 'Cirurgia' });
  });

  it('mostra o formulário preenchido e grava a alteração pela atualização', async () => {
    await renderWithProviders(<EditWorkScreen workId="w1" />);
    expect(screen.getByRole('header', { name: 'Editar trabalho' })).toBeTruthy();
    expect(screen.getByTestId('work-location-input').props.value).toBe('Ubs Xpto');
    expect(screen.getByTestId('work-expected-field').props.accessibilityValue.text).toMatch(
      /^Em 30 dias · 28 OUT$/,
    );
    expect(screen.getByRole('button', { name: 'Salvar alterações' })).toBeTruthy();

    await act(async () => {
      await fireEvent.changeText(screen.getByLabelText('QUANTO VOCÊ VAI RECEBER?'), '1.500');
    });
    await act(async () => {
      await fireEvent.press(screen.getByTestId('work-save'));
    });
    await waitFor(() => expect(router.back).toHaveBeenCalled());
    expect(createWorkLocation).not.toHaveBeenCalled();
    expect(updateWorkWithReceivable).toHaveBeenCalledWith(
      'w1',
      expect.objectContaining({
        type: 'shift',
        locationId: 'loc-ubs',
        workDate: '2026-09-28',
        startTime: '19:00',
        durationMinutes: 720,
        amountCents: 150000n,
        expectedOn: '2026-10-28',
        description: null,
      }),
      'edit-key',
    );
  });

  it('trabalho que não existe mais não abre o formulário', async () => {
    mockWork = null;
    await renderWithProviders(<EditWorkScreen workId="w1" />);
    expect(screen.getByText('Este trabalho não está mais disponível.')).toBeTruthy();
    expect(screen.queryByTestId('work-form')).toBeNull();
  });
});
