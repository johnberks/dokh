import '@/i18n';
import { act, fireEvent, screen } from '@testing-library/react-native';
import { router } from 'expo-router';
import { renderWithProviders } from '@/test/render';
import { readResidencyNextEntries } from './onboarding-summary';
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
jest.mock('./onboarding-summary', () => ({
  ...jest.requireActual('./onboarding-summary'),
  readResidencyNextEntries: jest.fn(async () => []),
}));
jest.mock('./profile-data', () => ({
  ...jest.requireActual('./profile-data'),
  saveOnboardingProfile: jest.fn(async () => {}),
}));

const dismissKeyboard = jest.spyOn(require('react-native').Keyboard, 'dismiss');
const mockedPush = jest.mocked(router.push);
const mockedSave = jest.mocked(saveOnboardingProfile);
const mockedNextEntries = jest.mocked(readResidencyNextEntries);

beforeEach(() => {
  jest.clearAllMocks();
  useProfileDraft.getState().reset();
});

describe('campos centralizados e teclado (Onboarding v2)', () => {
  it('nome: rótulo e valor centralizados, dentro da tela com teclado tratado', async () => {
    await renderWithProviders(<NameScreen />);
    expect(screen.getByTestId('name-input')).toHaveStyle({ textAlign: 'center' });
    expect(screen.getByText('NOME')).toHaveStyle({ textAlign: 'center' });
  });

  it('bolsa: a peça da residência se monta enquanto a pessoa responde (7.7)', async () => {
    useProfileDraft.setState({
      status: 'resident',
      specialty: 'Clínica Médica',
      monthlyAmount: '',
      paymentDay: null,
    });
    await renderWithProviders(<ResidencyIncomeScreen />);
    expect(screen.getByTestId('residency-piece')).toBeTruthy();
    expect(screen.queryByTestId('residency-piece-amount')).toBeNull();
    await act(async () => {
      await fireEvent.changeText(screen.getByTestId('income-amount-input'), '4.106');
    });
    expect(screen.getByTestId('residency-piece-amount')).toHaveTextContent(/4\.106/);
    await act(async () => {
      await fireEvent.press(screen.getByTestId('income-day-5'));
    });
    expect(screen.getByTestId('residency-piece-day')).toHaveTextContent('todo dia 05');
  });

  it('bolsa: valor centralizado', async () => {
    useProfileDraft.setState({ status: 'resident', specialty: 'Clínica Médica' });
    await renderWithProviders(<ResidencyIncomeScreen />);
    expect(screen.getByTestId('income-amount-input')).toHaveStyle({ minWidth: 48 });
    expect(screen.getByText('Quanto você recebe por mês?')).toHaveStyle({ textAlign: 'center' });
  });
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
    expect(mockedPush).toHaveBeenCalledWith('/focus');
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
    expect(mockedPush).toHaveBeenCalledWith('/focus');
  });
});

describe('situação profissional (tela 09)', () => {
  it('ordem: Generalista, Em residência, Especialista', async () => {
    await renderWithProviders(<ProfessionalStatusScreen />);
    const labels = screen.getAllByRole('radio').map((radio) => radio.props.accessibilityLabel);
    expect(labels).toEqual(['Generalista', 'Em residência', 'Especialista']);
  });

  it('tocar na busca já mostra as mais procuradas, sem tela vazia', async () => {
    useProfileDraft.setState({ status: 'specialist', specialty: '' });
    await renderWithProviders(<ProfessionalStatusScreen />);
    await act(async () => {
      await fireEvent(screen.getByTestId('status-input'), 'focus');
    });
    expect(screen.getByText('MAIS PROCURADAS')).toBeTruthy();
    expect(screen.getByTestId('status-option-Clínica médica')).toBeTruthy();
    // "Outra" só faz sentido com um nome digitado.
    expect(screen.queryByTestId('status-option-other')).toBeNull();
  });

  it('ao digitar, a busca assume a tela: título, opções e botão saem da frente', async () => {
    useProfileDraft.setState({ status: 'specialist', specialty: '' });
    await renderWithProviders(<ProfessionalStatusScreen />);
    await act(async () => {
      await fireEvent(screen.getByTestId('status-input'), 'focus');
      await fireEvent.changeText(screen.getByTestId('status-input'), 'card');
    });
    expect(
      screen.queryByRole('header', { name: 'Qual é sua situação profissional hoje?' }),
    ).toBeNull();
    expect(screen.queryByTestId('status-general_practitioner')).toBeNull();
    expect(screen.queryByTestId('status-cta')).toBeNull();
    expect(screen.getByTestId('status-suggestions')).toBeTruthy();
    // Título e campo fixos no topo; só a lista rola (pedido do usuário, 2026-10-02).
    expect(screen.getByRole('header', { name: 'Qual é a sua especialidade?' })).toBeTruthy();
    expect(screen.getByTestId('status-suggestions-scroll')).toBeTruthy();
    expect(screen.getByTestId('status-scroll').props.scrollEnabled).toBe(false);

    await act(async () => {
      await fireEvent(screen.getByTestId('status-input'), 'blur');
    });
    expect(screen.getByTestId('status-cta')).toBeTruthy();
    expect(screen.getByTestId('status-general_practitioner')).toBeTruthy();
  });

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
    useProfileDraft.setState({ displayName: 'Anna', focus: 'receivables' });
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
      // O foco escolhido na tela anterior vai junto com a situação (7.7).
      focus: 'receivables',
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

describe('tela 12: payoff do residente e ponte para o primeiro trabalho (7.7)', () => {
  const resident = {
    status: 'resident' as const,
    specialty: 'Clínica Médica',
    monthlyAmount: '3.654,42',
    paymentDay: 5,
  };

  it('residente vê a peça da residência e as próximas entradas reais da bolsa', async () => {
    mockedNextEntries.mockResolvedValue([
      { expectedOn: '2026-10-05', amountCents: 365442n },
      { expectedOn: '2026-11-05', amountCents: 365442n },
      { expectedOn: '2026-12-05', amountCents: 365442n },
    ]);
    useProfileDraft.setState(resident);
    await renderWithProviders(<ProfileReadyScreen />);
    expect(screen.getByLabelText('Sua DOKH está começando a tomar forma.')).toBeTruthy();
    expect(screen.getByTestId('profile-ready-residency')).toBeTruthy();
    expect(screen.getByText('Clínica Médica')).toBeTruthy();
    expect(screen.getByText('todo dia 05')).toBeTruthy();
    expect(await screen.findByTestId('profile-ready-entries')).toBeTruthy();
    expect(screen.getByText('05 OUT')).toBeTruthy();
    expect(screen.getByText('05 DEZ')).toBeTruthy();
    expect(mockedNextEntries).toHaveBeenCalledWith('user-1', expect.any(String));
    expect(
      screen.getByText('Você também faz plantões, atendimentos ou procedimentos?'),
    ).toBeTruthy();

    await act(async () => {
      await fireEvent.press(screen.getByTestId('profile-ready-cta'));
    });
    expect(mockedPush).toHaveBeenCalledWith('/first-work');
  });

  it('residente pode concluir sem trabalho: "Ainda não" leva à conclusão', async () => {
    useProfileDraft.setState(resident);
    await renderWithProviders(<ProfileReadyScreen />);
    await act(async () => {
      await fireEvent.press(screen.getByTestId('profile-ready-skip'));
    });
    expect(mockedPush).toHaveBeenCalledWith('/first-work-done');
  });

  it('sem entradas geradas ainda, a linha do tempo não aparece (nada inventado)', async () => {
    mockedNextEntries.mockResolvedValue([]);
    useProfileDraft.setState(resident);
    await renderWithProviders(<ProfileReadyScreen />);
    await act(async () => {});
    expect(screen.queryByTestId('profile-ready-entries')).toBeNull();
  });

  it('generalista vê a ponte: peça vazia com os encaixes e texto do foco, sem "Ainda não"', async () => {
    useProfileDraft.setState({ status: 'general_practitioner', focus: 'receivables' });
    await renderWithProviders(<ProfileReadyScreen />);
    expect(
      screen.getByLabelText('Vamos adicionar um trabalho para montar sua primeira visão.'),
    ).toBeTruthy();
    expect(screen.getByTestId('profile-ready-piece')).toBeTruthy();
    expect(screen.getByText('Tipo')).toBeTruthy();
    expect(screen.getByText('Entrada')).toBeTruthy();
    expect(screen.getByText('A DOKH já mostra quando esse valor deve entrar.')).toBeTruthy();
    expect(
      screen.getByText('Pode ser um trabalho que você já fez ou que ainda vai fazer.'),
    ).toBeTruthy();
    expect(screen.queryByTestId('profile-ready-skip')).toBeNull();
    expect(screen.queryByTestId('profile-ready-residency')).toBeNull();
    expect(mockedNextEntries).not.toHaveBeenCalled();

    await act(async () => {
      await fireEvent.press(screen.getByTestId('profile-ready-cta'));
    });
    expect(mockedPush).toHaveBeenCalledWith('/first-work');
  });

  it('especialista também vai pela ponte, sem bolsa', async () => {
    useProfileDraft.setState({ status: 'specialist', specialty: 'Cardiologia', focus: 'work' });
    await renderWithProviders(<ProfileReadyScreen />);
    expect(screen.getByText('Onde, quando e quanto: tudo começa por ele.')).toBeTruthy();
    expect(screen.queryByText(/todo dia/)).toBeNull();
  });
});
