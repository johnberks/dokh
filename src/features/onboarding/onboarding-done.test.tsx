import '@/i18n';
import { act, fireEvent, screen, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';
import { onboardingStatusKey } from '@/features/auth/onboarding-status';
import { useWorkDraft } from '@/features/work/work-draft';
import { renderWithProviders } from '@/test/render';
import { completeOnboarding, readOnboardingSummary } from './onboarding-summary';
import { useProfileDraft } from './profile-draft';
import { OnboardingDoneScreen } from './screens/OnboardingDoneScreen';

// O total conta até o valor com animação; aqui o valor final aparece direto.
jest.mock('@/theme/useReducedMotion', () => ({ useReducedMotion: () => true }));

import { useGuideTour } from '@/features/guide/guide-tour';

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

const year = new Date().getFullYear();
const residency = {
  specialty: 'Cardiologia',
  monthlyAmountCents: 365442n,
  paymentDay: 5,
  nextExpectedOn: `${year}-10-05`,
};
const shift = {
  type: 'shift' as const,
  locationName: 'Hospital São Lucas',
  workDate: `${year}-09-12`,
  startTime: '19:00',
  durationMinutes: 720,
  amountCents: 120000n,
  expectedOn: `${year}-10-20`,
  receipt: 'scheduled' as const,
};

beforeEach(() => {
  jest.clearAllMocks();
  mockedComplete.mockResolvedValue(undefined);
  useProfileDraft.getState().reset();
  useWorkDraft.getState().reset();
  useGuideTour.getState().finish();
});

/** Espera o resumo e a marcação de conclusão assentarem antes das asserções. */
async function renderDone(workId: string | null = 'work-1') {
  const result = await renderWithProviders(<OnboardingDoneScreen workId={workId} />);
  await waitFor(() => expect(screen.queryByTestId('onboarding-done-loading')).toBeNull());
  await waitFor(() => expect(mockedComplete).toHaveBeenCalled());
  await act(async () => {});
  return result;
}

describe('primeira visão (TELA 10, Onboarding v2 · Entrega 4)', () => {
  it('"Sua DOKH está pronta, João." com o nome do rascunho', async () => {
    useProfileDraft.setState({ displayName: 'João' });
    mockedRead.mockResolvedValue({ residency, work: shift });
    await renderDone();
    expect(screen.getByLabelText('Sua DOKH está pronta, João.')).toBeTruthy();
    expect(screen.getByText('2 itens organizados')).toBeTruthy();
    expect(screen.getByText('Ver minha DOKH')).toBeTruthy();
  });

  it('bolsa e plantão do mesmo mês: o mês em destaque soma os dois e lista as peças', async () => {
    mockedRead.mockResolvedValue({ residency, work: shift });
    await renderDone();
    expect(screen.getByText('PREVISTO PARA OUTUBRO')).toBeTruthy();
    expect(screen.getByText(/4\.854,42/)).toBeTruthy();
    expect(screen.getAllByTestId('onboarding-done-row')).toHaveLength(2);
    expect(screen.getByText('Residência')).toBeTruthy();
    expect(screen.getByText('05 OUT')).toBeTruthy();
    expect(screen.getByText('20 OUT')).toBeTruthy();
  });

  it('plantão de outro mês fica no mês dele, nunca somado à bolsa', async () => {
    mockedRead.mockResolvedValue({ residency, work: { ...shift, expectedOn: `${year}-11-11` } });
    await renderDone();
    expect(screen.getByText('PREVISTO PARA OUTUBRO')).toBeTruthy();
    expect(screen.getByTestId(`onboarding-done-group-${year}-11`)).toBeTruthy();
    expect(screen.getByText('Novembro')).toBeTruthy();
    expect(screen.queryByText(/4\.854,42/)).toBeNull();
  });

  it('trabalho futuro aparece como próximo; o passado, como realizado', async () => {
    mockedRead.mockResolvedValue({
      residency: null,
      work: { ...shift, workDate: `${year + 1}-01-12` },
    });
    await renderDone();
    expect(screen.getByText('PRÓXIMO TRABALHO')).toBeTruthy();
    expect(screen.getByTestId('onboarding-done-next-work')).toBeTruthy();

    mockedRead.mockResolvedValue({
      residency: null,
      work: { ...shift, workDate: `${year - 1}-09-12`, receipt: 'received' },
    });
    await renderDone('work-2');
    expect(screen.getByText('TRABALHO REALIZADO')).toBeTruthy();
    expect(screen.getAllByText('RECEBIDO').length).toBeGreaterThan(0);
  });

  it('pendente fica em "Aguardando confirmação", fora do previsto', async () => {
    mockedRead.mockResolvedValue({ residency, work: { ...shift, receipt: 'pending' } });
    await renderDone();
    expect(screen.getByText('PREVISTO PARA OUTUBRO')).toBeTruthy();
    // Destaque e linha da bolsa mostram o mesmo valor; o pendente não entra na soma.
    expect(screen.getAllByText(/3\.654,42/).length).toBeGreaterThan(0);
    expect(screen.queryByText(/4\.854,42/)).toBeNull();
    expect(screen.getByTestId('onboarding-done-group-pending')).toBeTruthy();
  });

  it('residente que concluiu sem trabalho vê só a residência, sem bloco de trabalho', async () => {
    mockedRead.mockResolvedValue({ residency, work: null });
    await renderDone(null);
    expect(mockedRead).toHaveBeenCalledWith('user-1', null, expect.any(String));
    expect(screen.getByText('Residência')).toBeTruthy();
    expect(screen.queryByText('PRÓXIMO TRABALHO')).toBeNull();
    expect(screen.queryByText('TRABALHO REALIZADO')).toBeNull();
    expect(screen.getByText('1 item organizado')).toBeTruthy();
  });

  it('sem previsão: "Entrada a definir", sem placeholders de horário', async () => {
    mockedRead.mockResolvedValue({
      residency: null,
      work: {
        ...shift,
        type: 'procedure',
        startTime: null,
        durationMinutes: null,
        expectedOn: null,
        receipt: 'undated',
      },
    });
    await renderDone();
    expect(screen.getByText('SEM PREVISÃO DE ENTRADA')).toBeTruthy();
    expect(screen.getByText('Entrada a definir')).toBeTruthy();
    expect(screen.getByText('PROCEDIMENTO')).toBeTruthy();
    expect(screen.getByTestId('onboarding-done-work-meta').props.children).toBe('12 SET');
  });

  it('a ordem dos blocos segue o foco: Trabalhos começa pelo trabalho', async () => {
    useProfileDraft.setState({ focus: 'work' });
    mockedRead.mockResolvedValue({
      residency: null,
      work: { ...shift, workDate: `${year + 1}-01-12` },
    });
    await renderDone();
    const order = screen
      .getAllByText(/PRÓXIMO TRABALHO|PREVISTO PARA/)
      .map((node) => String(node.props.children));
    expect(order[0]).toBe('PRÓXIMO TRABALHO');
  });

  it('marca o onboarding ao abrir; "Ver minha DOKH" inicia o guia pelo foco', async () => {
    mockedRead.mockResolvedValue({ residency: null, work: shift });
    useWorkDraft.setState({ locationName: 'Hospital São Lucas' });
    useProfileDraft.setState({ displayName: 'Anna', focus: 'receivables' });
    const { queryClient } = await renderDone();
    expect(mockedComplete).toHaveBeenCalledTimes(1);
    expect(mockedReplace).not.toHaveBeenCalled();

    await act(async () => {
      await fireEvent.press(screen.getByTestId('onboarding-done-cta'));
    });
    await waitFor(() => expect(mockedReplace).toHaveBeenCalledWith('/'));
    expect(useGuideTour.getState().step).toBe(0);
    // Recebimentos: o guia começa em Finanças.
    expect(useGuideTour.getState().steps[0].tab).toBe('finances');
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
    expect(await screen.findByTestId('onboarding-done-entries')).toBeTruthy();
  });
});
