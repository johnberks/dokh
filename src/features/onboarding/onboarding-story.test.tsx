import '@/i18n';
import { act, fireEvent, screen } from '@testing-library/react-native';
import { router } from 'expo-router';
import { renderWithProviders } from '@/test/render';
import { useReducedMotion } from '@/theme/useReducedMotion';
import { useProfileDraft } from './profile-draft';
import { FocusScreen } from './screens/FocusScreen';
import { NameScreen } from './screens/NameScreen';
import { OnboardingIntroScreen } from './screens/OnboardingIntroScreen';
import { ProfessionalStatusScreen } from './screens/ProfessionalStatusScreen';

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn() },
}));
jest.mock('@/features/auth/AuthSessionProvider', () => ({
  AuthSessionProvider: ({ children }: { children: React.ReactNode }) => children,
  useAuthSession: () => ({ status: 'signedIn', userId: 'user-1' }),
}));
jest.mock('@/theme/useReducedMotion', () => ({ useReducedMotion: jest.fn(() => false) }));

const mockedPush = jest.mocked(router.push);
const mockedReduced = jest.mocked(useReducedMotion);

beforeEach(() => {
  jest.clearAllMocks();
  mockedReduced.mockReturnValue(false);
  useProfileDraft.getState().reset();
});

async function press(testID: string) {
  await act(async () => {
    await fireEvent.press(screen.getByTestId(testID));
  });
}

describe('abertura narrativa (Onboarding v2)', () => {
  it('três batidas por toque: fragmentação, dinheiro em outra data, organização', async () => {
    await renderWithProviders(<OnboardingIntroScreen />);
    // A tela inteira é tocável; o cenário só existe depois de medido.
    await act(async () => {
      await fireEvent(screen.getByTestId('intro-stage'), 'layout', {
        nativeEvent: { layout: { width: 320, height: 300 } },
      });
    });
    expect(
      screen.getByRole('header', { name: 'Seu trabalho acontece em vários lugares.' }),
    ).toBeTruthy();
    expect(screen.getByText('Hospital São Lucas')).toBeTruthy();

    await press('onboarding-intro-cta');
    expect(
      screen.getByRole('header', { name: 'E o dinheiro nem sempre entra quando você trabalha.' }),
    ).toBeTruthy();
    expect(screen.getByText('D30')).toBeTruthy();

    await press('onboarding-intro');
    expect(
      screen.getByRole('header', { name: 'A DOKH conecta seus trabalhos aos seus recebimentos.' }),
    ).toBeTruthy();
    expect(mockedPush).not.toHaveBeenCalled();

    await press('onboarding-intro-cta');
    expect(mockedPush).toHaveBeenCalledWith('/name');
  });

  it('com Reduzir movimento as três frases aparecem juntas e o botão já leva ao nome', async () => {
    mockedReduced.mockReturnValue(true);
    await renderWithProviders(<OnboardingIntroScreen />);
    expect(screen.getByText('Seu trabalho acontece em vários lugares.')).toBeTruthy();
    expect(screen.getByText('E o dinheiro nem sempre entra quando você trabalha.')).toBeTruthy();
    expect(
      screen.getByRole('header', { name: 'A DOKH conecta seus trabalhos aos seus recebimentos.' }),
    ).toBeTruthy();
    await press('onboarding-intro-cta');
    expect(mockedPush).toHaveBeenCalledWith('/name');
  });
});

describe('campos de uma linha não cortam o texto (iOS)', () => {
  it('nome usa só família e peso da tipografia, sem lineHeight', async () => {
    await renderWithProviders(<NameScreen />);
    const style = Object.assign({}, ...[screen.getByTestId('name-input').props.style].flat(3));
    expect(style.lineHeight).toBeUndefined();
    expect(style.textAlign).toBe('center');
  });
});

describe('moldura da DOKH (tela de nome)', () => {
  it('nasce vazia e ganha o nome enquanto se digita', async () => {
    await renderWithProviders(<NameScreen />);
    expect(screen.getByTestId('dokh-frame-label')).toHaveTextContent('Sua DOKH');
    await act(async () => {
      await fireEvent.changeText(screen.getByTestId('name-input'), 'João');
    });
    expect(screen.getByTestId('dokh-frame-label')).toHaveTextContent('DOKH de João');
  });
});

describe('foco (Onboarding v2)', () => {
  it('pergunta com o nome, exige uma escolha e abre a mini-sequência da opção', async () => {
    useProfileDraft.setState({ displayName: 'João' });
    await renderWithProviders(<FocusScreen />);
    expect(
      screen.getByRole('header', { name: 'João, o que você mais quer organizar com a DOKH?' }),
    ).toBeTruthy();

    await press('focus-cta');
    expect(screen.getByText('Escolha por onde a DOKH começa.')).toBeTruthy();
    expect(mockedPush).not.toHaveBeenCalled();

    await press('focus-receivables');
    expect(useProfileDraft.getState().focus).toBe('receivables');
    expect(screen.getByTestId('focus-receivables-sequence')).toBeTruthy();
    expect(screen.getByText('Entrada prevista')).toBeTruthy();
    expect(
      screen.getByText('Vamos conectar seus trabalhos às datas em que o dinheiro deve entrar.'),
    ).toBeTruthy();
    expect(screen.queryByTestId('focus-work-sequence')).toBeNull();

    await press('focus-cta');
    expect(mockedPush).toHaveBeenCalledWith('/professional-status');
  });

  it('o foco muda o subtítulo da situação profissional', async () => {
    useProfileDraft.setState({ focus: 'earnings' });
    await renderWithProviders(<ProfessionalStatusScreen />);
    expect(screen.getByText('Assim a DOKH entende de onde vem sua renda.')).toBeTruthy();
  });
});
