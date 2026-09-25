import '@/i18n';
import { act, fireEvent, screen } from '@testing-library/react-native';
import { router } from 'expo-router';
import { renderWithProviders } from '@/test/render';
import { saveOnboardingProfile } from './profile-data';
import {
  DEFAULT_RESIDENCY_AMOUNT,
  DEFAULT_RESIDENCY_PAYMENT_DAY,
  useProfileDraft,
} from './profile-draft';
import { NameScreen } from './screens/NameScreen';
import { ProfileReadyScreen } from './screens/ProfileReadyScreen';
import { ResidencyIncomeScreen } from './screens/ResidencyIncomeScreen';
import { ResidencyScreen } from './screens/ResidencyScreen';

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn() },
}));
jest.mock('@/features/auth/AuthSessionProvider', () => ({
  // O provider real continua montado por AppProviders; só a leitura da sessão é falsa.
  AuthSessionProvider: ({ children }: { children: React.ReactNode }) => children,
  useAuthSession: () => ({ status: 'signedIn', userId: 'user-1' }),
}));
jest.mock('./profile-data', () => ({
  ...jest.requireActual('./profile-data'),
  saveOnboardingProfile: jest.fn(async () => {}),
}));

const dismissKeyboard = jest.spyOn(require('react-native').Keyboard, 'dismiss');
const mockedPush = jest.mocked(router.push);
const mockedSave = jest.mocked(saveOnboardingProfile);

beforeEach(() => {
  jest.clearAllMocks();
  useProfileDraft.getState().reset();
});

describe('nome (tela 07)', () => {
  it('não mostra mais a dica de primeiro nome e o botão fica acessível com o teclado', async () => {
    await renderWithProviders(<NameScreen />);
    expect(screen.queryByText(/Só o primeiro nome já basta/)).toBeNull();
    // Um toque só: o botão sobe com o teclado em vez de ficar atrás dele.
    await act(async () => {
      await fireEvent.changeText(screen.getByTestId('name-input'), 'Anna');
      await fireEvent.press(screen.getByTestId('name-cta'));
    });
    expect(mockedPush).toHaveBeenCalledWith('/residency');
  });

  it('exige um nome e guarda sem espaços em volta', async () => {
    await renderWithProviders(<NameScreen />);
    await act(async () => {
      await fireEvent.press(screen.getByTestId('name-cta'));
    });
    expect(mockedPush).not.toHaveBeenCalled();
    expect(screen.getByText('Informe como quer ser chamado.')).toBeTruthy();

    await act(async () => {
      await fireEvent.changeText(screen.getByTestId('name-input'), '  Anna  ');
      await fireEvent.press(screen.getByTestId('name-cta'));
    });
    expect(useProfileDraft.getState().displayName).toBe('Anna');
    expect(mockedPush).toHaveBeenCalledWith('/residency');
  });
});

describe('residência (tela 09)', () => {
  it('só mostra a busca depois de responder Sim', async () => {
    useProfileDraft.setState({ displayName: 'Anna' });
    await renderWithProviders(<ResidencyScreen />);
    expect(screen.getByRole('header', { name: /Anna, você está fazendo residência/ })).toBeTruthy();
    expect(screen.queryByTestId('residency-search')).toBeNull();

    await act(async () => {
      await fireEvent.press(screen.getByTestId('residency-yes'));
    });
    expect(screen.getByTestId('residency-search')).toBeTruthy();
    expect(screen.queryByTestId('residency-generalist')).toBeNull();
  });

  it('rola a tela inteira, sem área interna rolável', async () => {
    await renderWithProviders(<ResidencyScreen />);
    const scroll = screen.getByTestId('residency-scroll');
    // Uma rolagem só, da tela inteira, sem barra lateral e com toque direto nas sugestões.
    expect(scroll.props.showsVerticalScrollIndicator).toBe(false);
    expect(scroll.props.keyboardShouldPersistTaps).toBe('handled');
    expect(scroll.props.bounces).toBe(false);
    expect(screen.getByTestId('residency-header')).toBeTruthy();
  });

  it('sugere as residências oficiais ao começar a escrever e marca a escolhida', async () => {
    await renderWithProviders(<ResidencyScreen />);
    await act(async () => {
      await fireEvent.press(screen.getByTestId('residency-yes'));
      await fireEvent.changeText(screen.getByTestId('residency-input'), 'car');
    });
    expect(screen.getByTestId('residency-option-Cardiologia')).toBeTruthy();
    expect(screen.getByTestId('residency-option-Cardiologia pediátrica')).toBeTruthy();
    expect(screen.getByTestId('residency-option-Cirurgia cardiovascular')).toBeTruthy();
    // Poucas sugestões cabem acima do teclado; o restante fica fora da lista.
    expect(screen.getAllByTestId(/^residency-option-/).length).toBeLessThanOrEqual(5);

    await act(async () => {
      await fireEvent.press(screen.getByTestId('residency-option-Cardiologia'));
    });
    expect(useProfileDraft.getState().residencyProgram).toBe('Cardiologia');
    expect(screen.getByText('SELECIONADA')).toBeTruthy();
    // O teclado desce para liberar o botão Continuar.
    expect(dismissKeyboard).toHaveBeenCalled();
  });

  it('Sim sem residência escolhida não avança', async () => {
    await renderWithProviders(<ResidencyScreen />);
    await act(async () => {
      await fireEvent.press(screen.getByTestId('residency-yes'));
      await fireEvent.press(screen.getByTestId('residency-cta'));
    });
    expect(mockedPush).not.toHaveBeenCalled();
    expect(screen.getByText('Escolha a sua residência para continuar.')).toBeTruthy();
  });

  it('Não mostra a etiqueta Generalista, grava e vai para a conclusão', async () => {
    useProfileDraft.setState({ displayName: 'Anna' });
    await renderWithProviders(<ResidencyScreen />);
    await act(async () => {
      await fireEvent.press(screen.getByTestId('residency-no'));
    });
    expect(screen.getByTestId('residency-generalist')).toBeTruthy();
    expect(screen.getByText('GENERALISTA')).toBeTruthy();
    expect(screen.queryByTestId('residency-search')).toBeNull();

    await act(async () => {
      await fireEvent.press(screen.getByTestId('residency-cta'));
    });
    expect(mockedSave).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({ displayName: 'Anna', isResident: false }),
    );
    expect(mockedPush).toHaveBeenCalledWith('/profile-ready');
  });

  it('oferece Traumatologia Bucomaxilofacial', async () => {
    await renderWithProviders(<ResidencyScreen />);
    await act(async () => {
      await fireEvent.press(screen.getByTestId('residency-yes'));
      await fireEvent.changeText(screen.getByTestId('residency-input'), 'bucomaxilo');
    });
    await act(async () => {
      await fireEvent.press(screen.getByTestId('residency-option-Traumatologia Bucomaxilofacial'));
    });
    expect(useProfileDraft.getState().residencyProgram).toBe('Traumatologia Bucomaxilofacial');
  });

  it('escolher Outra usa o texto digitado', async () => {
    await renderWithProviders(<ResidencyScreen />);
    await act(async () => {
      await fireEvent.press(screen.getByTestId('residency-yes'));
      await fireEvent.changeText(screen.getByTestId('residency-input'), '  Programa novo  ');
      await fireEvent.press(screen.getByTestId('residency-option-other'));
    });
    expect(useProfileDraft.getState().residencyProgram).toBe('Programa novo');
  });
});

describe('bolsa da residência (TELA 04)', () => {
  it('já vem com a bolsa padrão e o dia 05, ambos editáveis', async () => {
    useProfileDraft.setState({ isResident: true, residencyProgram: 'Cardiologia' });
    await renderWithProviders(<ResidencyIncomeScreen />);
    expect(screen.getByLabelText('Bolsa mensal').props.value).toBe(DEFAULT_RESIDENCY_AMOUNT);
    expect(DEFAULT_RESIDENCY_PAYMENT_DAY).toBe(5);
    // O dia aparece na caixa grande e marcado entre os atalhos.
    expect(screen.getAllByText('05').length).toBeGreaterThanOrEqual(2);
    expect(screen.getByTestId('income-day-5').props.accessibilityState).toMatchObject({
      checked: true,
    });

    await act(async () => {
      await fireEvent.changeText(screen.getByLabelText('Bolsa mensal'), '4.000,00');
    });
    expect(useProfileDraft.getState().monthlyAmount).toBe('4.000,00');
  });

  it('a tela rola como um todo, sem área interna rolável', async () => {
    useProfileDraft.setState({ isResident: true, residencyProgram: 'Cardiologia' });
    await renderWithProviders(<ResidencyIncomeScreen />);
    const scroll = screen.getByTestId('income-scroll');
    expect(scroll.props.showsVerticalScrollIndicator).toBe(false);
    expect(scroll.props.bounces).toBe(false);
    expect(screen.getByTestId('income-header')).toBeTruthy();
  });

  it('valor apagado bloqueia a gravação', async () => {
    useProfileDraft.setState({
      displayName: 'Anna',
      isResident: true,
      residencyProgram: 'Cardiologia',
    });
    await renderWithProviders(<ResidencyIncomeScreen />);
    await act(async () => {
      await fireEvent.changeText(screen.getByLabelText('Bolsa mensal'), '');
      await fireEvent.press(screen.getByTestId('income-cta'));
    });
    expect(mockedSave).not.toHaveBeenCalled();
    expect(screen.getByText('Informe o valor da bolsa.')).toBeTruthy();

    await act(async () => {
      await fireEvent.changeText(screen.getByLabelText('Bolsa mensal'), '3.654,42');
      await fireEvent.press(screen.getByTestId('income-cta'));
    });
    expect(mockedSave).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({
        isResident: true,
        residencyProgram: 'Cardiologia',
        monthlyAmountCents: 365442n,
        paymentDay: 5,
      }),
    );
    expect(mockedPush).toHaveBeenCalledWith('/profile-ready');
  });

  it('permite escolher qualquer dia do mês em Outro', async () => {
    useProfileDraft.setState({ isResident: true, residencyProgram: 'Pediatria' });
    await renderWithProviders(<ResidencyIncomeScreen />);
    expect(screen.queryByTestId('income-day-all')).toBeNull();
    await act(async () => {
      await fireEvent.press(screen.getByTestId('income-day-other'));
    });
    await act(async () => {
      await fireEvent.press(screen.getByTestId('income-day-28'));
    });
    expect(useProfileDraft.getState().paymentDay).toBe(28);
  });
});

describe('conclusão do perfil (tela 12)', () => {
  it('mostra a residência cadastrada e leva ao primeiro trabalho, sem Pular', async () => {
    useProfileDraft.setState({
      isResident: true,
      residencyProgram: 'Cardiologia',
      monthlyAmount: '3.654,42',
      paymentDay: 5,
    });
    await renderWithProviders(<ProfileReadyScreen />);
    expect(screen.getByTestId('profile-ready-residency')).toBeTruthy();
    expect(screen.getByText('Cardiologia')).toBeTruthy();
    expect(screen.getByText(/3\.654,42/)).toBeTruthy();
    expect(screen.getByText('todo dia 05')).toBeTruthy();
    expect(screen.queryByText(/Pular/i)).toBeNull();

    await act(async () => {
      await fireEvent.press(screen.getByTestId('profile-ready-cta'));
    });
    expect(mockedPush).toHaveBeenCalledWith('/first-work');
  });

  it('sem residência mostra Generalista e o convite do primeiro trabalho', async () => {
    useProfileDraft.setState({ isResident: false });
    await renderWithProviders(<ProfileReadyScreen />);
    expect(screen.getByTestId('profile-ready-generalist')).toBeTruthy();
    expect(screen.getByText('GENERALISTA')).toBeTruthy();
    expect(screen.queryByTestId('profile-ready-residency')).toBeNull();
    expect(
      screen.getByRole('header', { name: 'Agora vamos entender como seu trabalho vira renda.' }),
    ).toBeTruthy();
    expect(screen.queryByText(/Pular/i)).toBeNull();
  });
});
