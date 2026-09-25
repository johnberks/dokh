import '@/i18n';
import { act, fireEvent, screen, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';
import { onboardingStatusKey } from '@/features/auth/onboarding-status';
import { useWorkDraft } from '@/features/work/work-draft';
import { renderWithProviders } from '@/test/render';
import { completeOnboarding, readOnboardingSummary } from './onboarding-summary';
import { useProfileDraft } from './profile-draft';
import { OnboardingDoneScreen } from './screens/OnboardingDoneScreen';

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn() },
}));
jest.mock('@/features/auth/AuthSessionProvider', () => ({
  AuthSessionProvider: ({ children }: { children: React.ReactNode }) => children,
  useAuthSession: () => ({ status: 'signedIn', userId: 'user-1' }),
}));
jest.mock('./onboarding-summary', () => ({
  ...jest.requireActual('./onboarding-summary'),
  readOnboardingSummary: jest.fn(),
  completeOnboarding: jest.fn(async () => {}),
}));

const mockedRead = jest.mocked(readOnboardingSummary);
const mockedComplete = jest.mocked(completeOnboarding);
const mockedReplace = jest.mocked(router.replace);

const residency = { specialty: 'Cardiologia', monthlyAmountCents: 365442n, paymentDay: 5 };
const shift = {
  type: 'shift' as const,
  locationName: 'Hospital São Lucas',
  workDate: `${new Date().getFullYear()}-09-12`,
  startTime: '19:00',
  durationMinutes: 720,
  amountCents: 120000n,
  expectedOn: `${new Date().getFullYear()}-09-20`,
};

beforeEach(() => {
  jest.clearAllMocks();
  mockedComplete.mockResolvedValue(undefined);
});

/** Espera o resumo e a marcação de conclusão assentarem antes das asserções. */
async function renderDone() {
  const result = await renderWithProviders(<OnboardingDoneScreen workId="work-1" />);
  await waitFor(() => expect(screen.queryByTestId('onboarding-done-loading')).toBeNull());
  await waitFor(() => expect(mockedComplete).toHaveBeenCalled());
  await act(async () => {});
  return result;
}

describe('conclusão dinâmica (TELA 10)', () => {
  it('com residência e trabalho mostra os dois itens, total combinado e data de entrada', async () => {
    mockedRead.mockResolvedValue({ residency, work: shift });
    await renderDone();
    expect(screen.getByText(/4\.854,42/)).toBeTruthy();
    expect(screen.getByText('de 2 entradas que você acabou de organizar')).toBeTruthy();
    expect(screen.getByTestId('onboarding-done-residency')).toBeTruthy();
    expect(screen.getByText('todo dia 05')).toBeTruthy();
    expect(screen.getByText('12 SET · 19:00 · 12h')).toBeTruthy();
    expect(screen.getByText(/1\.200$/)).toBeTruthy();
    expect(screen.getByText('20 SET')).toBeTruthy();
  });

  it('sem residência, sem horário e sem previsão: só o trabalho, sem placeholders', async () => {
    mockedRead.mockResolvedValue({
      residency: null,
      work: {
        ...shift,
        type: 'procedure',
        startTime: null,
        durationMinutes: null,
        expectedOn: null,
      },
    });
    await renderDone();
    expect(screen.queryByTestId('onboarding-done-residency')).toBeNull();
    expect(screen.getByText('de 1 entrada que você acabou de organizar')).toBeTruthy();
    expect(screen.getByText('PROCEDIMENTO')).toBeTruthy();
    expect(screen.getByTestId('onboarding-done-work-meta').props.children).toBe('12 SET');
    expect(screen.getByText('Sem previsão de entrada')).toBeTruthy();
    expect(screen.queryByTestId('onboarding-done-expected')).toBeNull();
  });

  it('marca o onboarding ao abrir e só vai para o início pelo botão', async () => {
    mockedRead.mockResolvedValue({ residency: null, work: shift });
    useWorkDraft.setState({ locationName: 'Hospital São Lucas' });
    useProfileDraft.setState({ displayName: 'Anna' });
    const { queryClient } = await renderDone();
    expect(mockedComplete).toHaveBeenCalledTimes(1);
    expect(mockedReplace).not.toHaveBeenCalled();

    await act(async () => {
      await fireEvent.press(screen.getByTestId('onboarding-done-cta'));
    });
    await waitFor(() => expect(mockedReplace).toHaveBeenCalledWith('/'));
    expect(queryClient.getQueryData(onboardingStatusKey('user-1'))).toBe(true);
    expect(mockedComplete).toHaveBeenCalledTimes(1);
    // Rascunhos não sobrevivem ao onboarding.
    expect(useWorkDraft.getState().locationName).toBe('');
    expect(useProfileDraft.getState().displayName).toBe('');
  });

  it('se marcar falhar, avisa e o botão tenta de novo antes de sair', async () => {
    mockedRead.mockResolvedValue({ residency: null, work: shift });
    mockedComplete.mockRejectedValueOnce(new Error('network'));
    await renderDone();
    expect(await screen.findByTestId('onboarding-done-complete-error')).toBeTruthy();

    await act(async () => {
      await fireEvent.press(screen.getByTestId('onboarding-done-cta'));
    });
    await waitFor(() => expect(mockedReplace).toHaveBeenCalledWith('/'));
    expect(mockedComplete).toHaveBeenCalledTimes(2);
  });

  it('erro ao ler o resumo oferece nova tentativa', async () => {
    mockedRead.mockRejectedValueOnce(new Error('network'));
    await renderDone();
    expect(screen.getByText('Não foi possível carregar o resumo agora.')).toBeTruthy();

    mockedRead.mockResolvedValue({ residency: null, work: shift });
    await act(async () => {
      await fireEvent.press(screen.getByTestId('onboarding-done-retry'));
    });
    expect(await screen.findByTestId('onboarding-done-work')).toBeTruthy();
  });
});
