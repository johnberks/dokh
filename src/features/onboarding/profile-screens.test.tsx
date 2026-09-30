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
import { ProfessionalStatusScreen } from './screens/ProfessionalStatusScreen';
import { ProfileReadyScreen } from './screens/ProfileReadyScreen';
import { ResidencyIncomeScreen } from './screens/ResidencyIncomeScreen';

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
    expect(mockedPush).toHaveBeenCalledWith('/professional-status');
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
    expect(mockedPush).toHaveBeenCalledWith('/professional-status');
  });
});

describe('situação profissional (tela 09)', () => {
  it('pergunta a situação com três opções e só busca depois de escolher', async () => {
    useProfileDraft.setState({ displayName: 'Anna' });
    await renderWithProviders(<ProfessionalStatusScreen />);
    expect(
      screen.getByRole('header', { name: 'Qual é sua situação profissional hoje?' }),
    ).toBeTruthy();
    expect(
      screen.getByText('Isso ajuda a DOKH a entender melhor sua rotina profissional.'),
    ).toBeTruthy();
    expect(screen.getByText('Em residência')).toBeTruthy();
    expect(screen.getByText('Estou fazendo uma residência médica atualmente.')).toBeTruthy();
    expect(screen.getByText('Generalista')).toBeTruthy();
    expect(screen.getByText('Atuo como médico generalista.')).toBeTruthy();
    expect(screen.getByText('Especialista')).toBeTruthy();
    expect(screen.getByText('Já concluí minha especialização.')).toBeTruthy();
    expect(screen.queryByTestId('status-search')).toBeNull();

    await act(async () => {
      await fireEvent.press(screen.getByTestId('status-resident'));
    });
    expect(screen.getByText('QUAL É A SUA RESIDÊNCIA?')).toBeTruthy();

    await act(async () => {
      await fireEvent.press(screen.getByTestId('status-specialist'));
    });
    expect(screen.getByText('QUAL É SUA ESPECIALIDADE?')).toBeTruthy();

    await act(async () => {
      await fireEvent.press(screen.getByTestId('status-general_practitioner'));
    });
    expect(screen.queryByTestId('status-search')).toBeNull();
  });

  it('rola a tela inteira, sem área interna rolável', async () => {
    await renderWithProviders(<ProfessionalStatusScreen />);
    const scroll = screen.getByTestId('status-scroll');
    // Uma rolagem só, da tela inteira, sem barra lateral e com toque direto nas sugestões.
    expect(scroll.props.showsVerticalScrollIndicator).toBe(false);
    expect(scroll.props.keyboardShouldPersistTaps).toBe('handled');
    expect(scroll.props.bounces).toBe(false);
    expect(screen.getByTestId('status-header')).toBeTruthy();
  });

  it('sugere as residências oficiais ao começar a escrever e esconde a lista ao escolher', async () => {
    await renderWithProviders(<ProfessionalStatusScreen />);
    await act(async () => {
      await fireEvent.press(screen.getByTestId('status-resident'));
      await fireEvent.changeText(screen.getByTestId('status-input'), 'car');
    });
    expect(screen.getByTestId('status-option-Cardiologia')).toBeTruthy();
    expect(screen.getByTestId('status-option-Cardiologia pediátrica')).toBeTruthy();
    expect(screen.getByTestId('status-option-Cirurgia cardiovascular')).toBeTruthy();
    // Poucas sugestões cabem acima do teclado; o restante fica fora da lista.
    expect(screen.getAllByTestId(/^status-option-/).length).toBeLessThanOrEqual(5);

    await act(async () => {
      await fireEvent.press(screen.getByTestId('status-option-Cardiologia'));
    });
    expect(useProfileDraft.getState().specialty).toBe('Cardiologia');
    // O teclado desce e a lista some: não há mais o que decidir.
    expect(dismissKeyboard).toHaveBeenCalled();
    expect(screen.queryByTestId('status-suggestions')).toBeNull();
    expect(screen.queryByTestId('status-option-Cardiologia pediátrica')).toBeNull();
  });

  it('Em residência sem programa escolhido não avança', async () => {
    await renderWithProviders(<ProfessionalStatusScreen />);
    await act(async () => {
      await fireEvent.press(screen.getByTestId('status-resident'));
      await fireEvent.press(screen.getByTestId('status-cta'));
    });
    expect(mockedPush).not.toHaveBeenCalled();
    expect(screen.getByText('Escolha a sua residência para continuar.')).toBeTruthy();
  });

  it('Em residência com programa segue para a bolsa sem gravar ainda', async () => {
    await renderWithProviders(<ProfessionalStatusScreen />);
    await act(async () => {
      await fireEvent.press(screen.getByTestId('status-resident'));
      await fireEvent.changeText(screen.getByTestId('status-input'), 'Clínica');
    });
    await act(async () => {
      await fireEvent.press(screen.getByTestId('status-option-Clínica médica'));
    });
    await act(async () => {
      await fireEvent.press(screen.getByTestId('status-cta'));
    });
    expect(mockedSave).not.toHaveBeenCalled();
    expect(mockedPush).toHaveBeenCalledWith('/residency-income');
  });

  it('Generalista não pede especialidade, grava e vai para a conclusão', async () => {
    useProfileDraft.setState({ displayName: 'Anna' });
    await renderWithProviders(<ProfessionalStatusScreen />);
    await act(async () => {
      await fireEvent.press(screen.getByTestId('status-general_practitioner'));
    });
    expect(screen.queryByTestId('status-search')).toBeNull();

    await act(async () => {
      await fireEvent.press(screen.getByTestId('status-cta'));
    });
    expect(mockedSave).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({ displayName: 'Anna', status: 'general_practitioner' }),
    );
    expect(mockedPush).toHaveBeenCalledWith('/profile-ready');
  });

  it('Especialista exige a especialidade e grava sem bolsa', async () => {
    useProfileDraft.setState({ displayName: 'Anna' });
    await renderWithProviders(<ProfessionalStatusScreen />);
    await act(async () => {
      await fireEvent.press(screen.getByTestId('status-specialist'));
      await fireEvent.press(screen.getByTestId('status-cta'));
    });
    expect(mockedSave).not.toHaveBeenCalled();
    expect(screen.getByText('Escolha a sua especialidade para continuar.')).toBeTruthy();

    await act(async () => {
      await fireEvent.changeText(screen.getByTestId('status-input'), 'cardio');
    });
    await act(async () => {
      await fireEvent.press(screen.getByTestId('status-option-Cardiologia'));
    });
    await act(async () => {
      await fireEvent.press(screen.getByTestId('status-cta'));
    });
    expect(mockedSave).toHaveBeenCalledWith('user-1', {
      displayName: 'Anna',
      status: 'specialist',
      specialty: 'Cardiologia',
      timezone: expect.any(String),
    });
    expect(mockedPush).toHaveBeenCalledWith('/profile-ready');
    expect(mockedPush).not.toHaveBeenCalledWith('/residency-income');
  });

  it('oferece Traumatologia Bucomaxilofacial', async () => {
    await renderWithProviders(<ProfessionalStatusScreen />);
    await act(async () => {
      await fireEvent.press(screen.getByTestId('status-resident'));
      await fireEvent.changeText(screen.getByTestId('status-input'), 'bucomaxilo');
    });
    await act(async () => {
      await fireEvent.press(screen.getByTestId('status-option-Traumatologia Bucomaxilofacial'));
    });
    expect(useProfileDraft.getState().specialty).toBe('Traumatologia Bucomaxilofacial');
  });

  it('escolher Outra usa o texto digitado', async () => {
    await renderWithProviders(<ProfessionalStatusScreen />);
    await act(async () => {
      await fireEvent.press(screen.getByTestId('status-resident'));
      await fireEvent.changeText(screen.getByTestId('status-input'), '  Programa novo  ');
      await fireEvent.press(screen.getByTestId('status-option-other'));
    });
    expect(useProfileDraft.getState().specialty).toBe('Programa novo');
  });
});

describe('bolsa da residência (TELA 04)', () => {
  it('já vem com a bolsa padrão e o dia 05, ambos editáveis', async () => {
    useProfileDraft.setState({ status: 'resident', specialty: 'Cardiologia' });
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

  it('não tem rolagem: a tela inteira cabe', async () => {
    useProfileDraft.setState({ status: 'resident', specialty: 'Cardiologia' });
    await renderWithProviders(<ResidencyIncomeScreen />);
    expect(screen.queryByTestId('income-scroll')).toBeNull();
    expect(screen.getByTestId('income-header')).toBeTruthy();
    expect(screen.getByTestId('income-cta')).toBeTruthy();
  });

  it('valor apagado bloqueia a gravação', async () => {
    useProfileDraft.setState({
      displayName: 'Anna',
      status: 'resident',
      specialty: 'Cardiologia',
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
        status: 'resident',
        specialty: 'Cardiologia',
        monthlyAmountCents: 365442n,
        paymentDay: 5,
      }),
    );
    expect(mockedPush).toHaveBeenCalledWith('/profile-ready');
  });

  it('dia fora dos atalhos recolhe a grade e vira uma das opções', async () => {
    useProfileDraft.setState({ status: 'resident', specialty: 'Pediatria' });
    await renderWithProviders(<ResidencyIncomeScreen />);
    expect(screen.queryByTestId('income-day-all')).toBeNull();

    await act(async () => {
      await fireEvent.press(screen.getByTestId('income-day-other'));
    });
    expect(screen.getByTestId('income-day-all')).toBeTruthy();

    await act(async () => {
      await fireEvent.press(screen.getByTestId('income-day-all-27'));
    });
    expect(useProfileDraft.getState().paymentDay).toBe(27);
    // A grade fecha e o dia escolhido aparece entre os atalhos, já selecionado.
    expect(screen.queryByTestId('income-day-all')).toBeNull();
    expect(screen.getByTestId('income-day-27').props.accessibilityState).toMatchObject({
      checked: true,
    });
  });
});

describe('conclusão do perfil (tela 12)', () => {
  it('residente vê "Residente de X" com a bolsa e vai ao primeiro trabalho, sem Pular', async () => {
    useProfileDraft.setState({
      status: 'resident',
      specialty: 'Clínica Médica',
      monthlyAmount: '3.654,42',
      paymentDay: 5,
    });
    await renderWithProviders(<ProfileReadyScreen />);
    expect(screen.getByTestId('profile-ready-residency')).toBeTruthy();
    expect(screen.getByText('Residente de Clínica Médica')).toBeTruthy();
    expect(screen.getByText(/3\.654,42/)).toBeTruthy();
    expect(screen.getByText('todo dia 05')).toBeTruthy();
    expect(screen.queryByText(/Pular/i)).toBeNull();

    await act(async () => {
      await fireEvent.press(screen.getByTestId('profile-ready-cta'));
    });
    expect(mockedPush).toHaveBeenCalledWith('/first-work');
  });

  it('generalista vê Generalista, sem card de residência', async () => {
    useProfileDraft.setState({ status: 'general_practitioner' });
    await renderWithProviders(<ProfileReadyScreen />);
    expect(screen.getByTestId('profile-ready-status')).toBeTruthy();
    expect(screen.getByText('Generalista')).toBeTruthy();
    expect(screen.queryByTestId('profile-ready-residency')).toBeNull();
    expect(
      screen.getByRole('header', { name: 'Agora vamos entender como seu trabalho vira renda.' }),
    ).toBeTruthy();
    expect(screen.queryByText(/Pular/i)).toBeNull();
  });

  it('generalista vê o que a DOKH vai acompanhar, para o card não ficar vazio', async () => {
    useProfileDraft.setState({ status: 'general_practitioner' });
    await renderWithProviders(<ProfileReadyScreen />);
    expect(screen.getByTestId('profile-ready-track')).toBeTruthy();
    expect(screen.getByText('A DOKH VAI ACOMPANHAR')).toBeTruthy();
    expect(screen.getByText('Plantões, procedimentos e atendimentos')).toBeTruthy();
    expect(screen.getByText('Quando cada pagamento deve entrar')).toBeTruthy();
    expect(screen.getByText('Quanto seu trabalho rende no mês')).toBeTruthy();
  });

  it('residente mantém só o card da bolsa, sem a lista', async () => {
    useProfileDraft.setState({ status: 'resident', specialty: 'Pediatria', paymentDay: 5 });
    await renderWithProviders(<ProfileReadyScreen />);
    expect(screen.queryByTestId('profile-ready-track')).toBeNull();
  });

  it('especialista vê "Especialista em X", sem card de residência nem bolsa', async () => {
    useProfileDraft.setState({ status: 'specialist', specialty: 'Cardiologia' });
    await renderWithProviders(<ProfileReadyScreen />);
    expect(screen.getByText('Especialista em Cardiologia')).toBeTruthy();
    expect(screen.queryByTestId('profile-ready-residency')).toBeNull();
    expect(screen.queryByText(/todo dia/)).toBeNull();
  });
});
