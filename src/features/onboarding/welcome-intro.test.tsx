import '@/i18n';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { router } from 'expo-router';
import { useReducedMotion } from '@/theme/useReducedMotion';
import { useIntroState } from './intro-state';
import { WelcomeIntroScreen } from './screens/WelcomeIntroScreen';
import { pageAfterSwipe, SWIPE_THRESHOLD } from './swipe';

jest.mock('expo-router', () => ({ router: { push: jest.fn(), replace: jest.fn() } }));
jest.mock('@/theme/useReducedMotion', () => ({ useReducedMotion: jest.fn(() => false) }));

const mockedReplace = jest.mocked(router.replace);
const mockedReducedMotion = jest.mocked(useReducedMotion);

/** O splash roda antes do carrossel; avançar o relógio entrega a primeira tela. */
async function renderCarousel() {
  const view = await render(<WelcomeIntroScreen />);
  await act(async () => {
    jest.runAllTimers();
  });
  return view;
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
  mockedReducedMotion.mockReturnValue(false);
  useIntroState.setState({ seen: false });
});
afterEach(() => jest.useRealTimers());

describe('splash 00B', () => {
  it('mostra símbolo e assinatura e entrega o carrossel sozinho', async () => {
    await render(<WelcomeIntroScreen />);
    expect(screen.getByTestId('intro-splash')).toBeTruthy();
    expect(screen.getAllByLabelText('DOKH').length).toBeGreaterThan(0);
    expect(screen.queryByTestId('intro-carousel')).toBeNull();

    await act(async () => {
      jest.runAllTimers();
    });
    expect(screen.getByTestId('intro-carousel')).toBeTruthy();
  });

  it('também entrega o carrossel com reduzir movimento ligado', async () => {
    mockedReducedMotion.mockReturnValue(true);
    await renderCarousel();
    expect(screen.getByTestId('intro-carousel')).toBeTruthy();
  });
});

describe('carrossel 01–03', () => {
  it('abre no primeiro slide com indicador ativo e Continuar', async () => {
    await renderCarousel();
    expect(
      screen.getByRole('header', {
        name: 'Tudo o que você trabalha.\nTudo o que você ganha.\nEm um só lugar.',
      }),
    ).toBeTruthy();
    expect(screen.getAllByTestId('intro-dot-active')).toHaveLength(1);
    expect(screen.getByLabelText('Apresentação, tela 1 de 3')).toBeTruthy();
    expect(screen.getByTestId('intro-advance').props.accessibilityLabel).toBe('Continuar');
  });

  it('Continuar percorre os três slides e o último leva à criação de conta', async () => {
    await renderCarousel();
    await act(async () => {
      await fireEvent.press(screen.getByTestId('intro-advance'));
    });
    expect(screen.getByLabelText('Apresentação, tela 2 de 3')).toBeTruthy();

    await act(async () => {
      await fireEvent.press(screen.getByTestId('intro-advance'));
    });
    expect(screen.getByLabelText('Apresentação, tela 3 de 3')).toBeTruthy();
    expect(screen.getByTestId('intro-advance').props.accessibilityLabel).toBe('Começar');
    expect(mockedReplace).not.toHaveBeenCalled();

    await act(async () => {
      await fireEvent.press(screen.getByTestId('intro-advance'));
    });
    expect(mockedReplace).toHaveBeenCalledWith('/sign-up');
    expect(useIntroState.getState().seen).toBe(true);
  });

  it('Pular vai direto para a criação de conta a partir de qualquer slide', async () => {
    await renderCarousel();
    await act(async () => {
      await fireEvent.press(screen.getByTestId('intro-skip'));
    });
    expect(mockedReplace).toHaveBeenCalledWith('/sign-up');
    expect(useIntroState.getState().seen).toBe(true);
  });

  it('só o slide visível fica acessível ao leitor de tela', async () => {
    await renderCarousel();
    expect(
      screen.getByLabelText(/Exemplo: calendário de setembro com plantão no dia 12/),
    ).toBeTruthy();
    expect(screen.queryByLabelText(/Exemplo: R\$ 8.450 a receber/)).toBeNull();
  });

  it('não apresenta formulário nem altera dados', async () => {
    await renderCarousel();
    expect(screen.queryAllByRole('textbox')).toHaveLength(0);
    expect(screen.queryByLabelText('Entrar')).toBeNull();
  });
});

describe('swipe horizontal', () => {
  const TOTAL = 3;

  it('avança ao arrastar para a esquerda e volta ao arrastar para a direita', () => {
    expect(pageAfterSwipe(0, -SWIPE_THRESHOLD, TOTAL)).toBe(1);
    expect(pageAfterSwipe(1, SWIPE_THRESHOLD, TOTAL)).toBe(0);
  });

  it('ignora arrasto curto', () => {
    expect(pageAfterSwipe(1, -(SWIPE_THRESHOLD - 1), TOTAL)).toBe(1);
    expect(pageAfterSwipe(1, SWIPE_THRESHOLD - 1, TOTAL)).toBe(1);
  });

  it('não dá a volta nos extremos', () => {
    expect(pageAfterSwipe(0, 200, TOTAL)).toBe(0);
    expect(pageAfterSwipe(TOTAL - 1, -200, TOTAL)).toBe(TOTAL - 1);
  });
});
