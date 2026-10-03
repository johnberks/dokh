import '@/i18n';
import { act, fireEvent, screen } from '@testing-library/react-native';
import { router } from 'expo-router';
import { type PanGesture, State } from 'react-native-gesture-handler';
import { fireGestureHandler, getByGestureTestId } from 'react-native-gesture-handler/jest-utils';
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

describe('abertura guiada pelo dedo (Onboarding v2)', () => {
  async function openIntro() {
    await renderWithProviders(<OnboardingIntroScreen />);
    await act(async () => {
      await fireEvent(screen.getByTestId('intro-stage'), 'layout', {
        nativeEvent: { layout: { width: 320, height: 300 } },
      });
      await fireEvent(screen.getByTestId('onboarding-intro-organize'), 'layout', {
        nativeEvent: { layout: { width: 329, height: 56 } },
      });
    });
  }

  function drag(translationX: number) {
    fireGestureHandler<PanGesture>(getByGestureTestId('intro-drag'), [
      { state: State.BEGAN, translationX: 0 },
      { state: State.ACTIVE, translationX: translationX / 2 },
      { state: State.ACTIVE, translationX },
      { state: State.END, translationX },
    ]);
  }

  it('começa com as peças soltas e um trilho para arrastar, sem botão de avançar', async () => {
    await openIntro();
    expect(screen.getByText('Seu trabalho acontece em vários lugares.')).toBeTruthy();
    expect(screen.getByText('Arraste para organizar')).toBeTruthy();
    expect(screen.getByText('Hospital São Lucas')).toBeTruthy();
    expect(screen.queryByTestId('onboarding-intro-cta')).toBeNull();
  });

  it('arrasto curto devolve as peças; arrasto até o fim organiza e libera o próximo passo', async () => {
    await openIntro();
    await act(async () => {
      drag(80);
    });
    expect(screen.queryByTestId('onboarding-intro-cta')).toBeNull();

    await act(async () => {
      drag(400);
    });
    await act(async () => {});
    expect(await screen.findByTestId('onboarding-intro-cta')).toBeTruthy();
    await press('onboarding-intro-cta');
    expect(mockedPush).toHaveBeenCalledWith('/name');
  });

  it('leitor de tela: a ação do trilho organiza sozinha', async () => {
    await openIntro();
    await act(async () => {
      await fireEvent(screen.getByTestId('onboarding-intro-organize'), 'accessibilityAction', {
        nativeEvent: { actionName: 'activate' },
      });
    });
    // A organização automática dura ~1,5 s (mesmo movimento do arrasto, sem o dedo).
    expect(await screen.findByTestId('onboarding-intro-cta', {}, { timeout: 4000 })).toBeTruthy();
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
