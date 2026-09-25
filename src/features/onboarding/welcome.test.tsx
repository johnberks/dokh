import '@/i18n';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { router } from 'expo-router';
import { legalUrls } from '@/config/legal';
import { accountPreviewMetrics } from '@/theme/tokens';
import { useReducedMotion } from '@/theme/useReducedMotion';
import { SPLASH_DURATION } from './BrandSplash';
import { WelcomeScreen } from './screens/WelcomeScreen';

jest.mock('expo-router', () => ({ router: { push: jest.fn(), replace: jest.fn() } }));
jest.mock('expo-linking', () => ({
  createURL: (path: string) => `dokh://${path}`,
  openURL: jest.fn(),
}));
jest.mock('@/theme/useReducedMotion', () => ({ useReducedMotion: jest.fn(() => false) }));

const mockedPush = jest.mocked(router.push);
const mockedReducedMotion = jest.mocked(useReducedMotion);

async function renderAccountScreen() {
  const view = await render(<WelcomeScreen />);
  await act(async () => {
    jest.advanceTimersByTime(SPLASH_DURATION);
  });
  return view;
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
  mockedReducedMotion.mockReturnValue(false);
  legalUrls.terms = null;
  legalUrls.privacy = null;
});
afterEach(() => jest.useRealTimers());

describe('splash 00B', () => {
  it('dura entre 1 e 2 segundos e entrega a tela sozinho', async () => {
    await render(<WelcomeScreen />);
    expect(screen.getByTestId('intro-splash')).toBeTruthy();
    expect(SPLASH_DURATION).toBeGreaterThanOrEqual(1000);
    expect(SPLASH_DURATION).toBeLessThanOrEqual(2000);

    await act(async () => {
      jest.advanceTimersByTime(SPLASH_DURATION - 1);
    });
    expect(screen.queryByTestId('welcome-account')).toBeNull();

    await act(async () => {
      jest.advanceTimersByTime(1);
    });
    expect(screen.getByTestId('welcome-account')).toBeTruthy();
  });

  it('mantém o mesmo tempo com reduzir movimento ligado', async () => {
    mockedReducedMotion.mockReturnValue(true);
    await render(<WelcomeScreen />);
    await act(async () => {
      jest.advanceTimersByTime(SPLASH_DURATION);
    });
    expect(screen.getByTestId('welcome-account')).toBeTruthy();
  });
});

describe('tela 04 — criar conta', () => {
  it('usa o título aprovado, sem subtítulo, carrossel ou Pular', async () => {
    await renderAccountScreen();
    expect(
      screen.getByRole('header', {
        name: 'Organize sua rotina e suas finanças em um só lugar.',
      }),
    ).toBeTruthy();
    expect(screen.queryByText(/Leva menos de um minuto/)).toBeNull();
    expect(screen.queryByText('Pular')).toBeNull();
    expect(screen.queryByText('Continuar')).toBeNull();
    expect(screen.queryByText('Começar')).toBeNull();
  });

  it('e-mail leva ao cadastro e Entrar leva ao login', async () => {
    await renderAccountScreen();
    await act(async () => {
      await fireEvent.press(screen.getByRole('button', { name: 'Continuar com e-mail' }));
    });
    expect(mockedPush).toHaveBeenCalledWith('/sign-up');

    await act(async () => {
      await fireEvent.press(screen.getByTestId('welcome-sign-in'));
    });
    expect(mockedPush).toHaveBeenCalledWith('/sign-in');
  });

  it('Apple e Google aparecem desabilitados até 4.3/4.4', async () => {
    await renderAccountScreen();
    for (const name of ['Continuar com Apple', 'Continuar com Google']) {
      const button = screen.getByRole('button', { name });
      expect(button.props.accessibilityState).toMatchObject({ disabled: true });
    }
  });

  it('prévia mostra os três cartões em camadas e é resumida ao leitor de tela', async () => {
    await renderAccountScreen();
    // Os cartões ficam fora do leitor de tela: ele ouve só o resumo da prévia.
    const hidden = { includeHiddenElements: true };
    expect(screen.getByTestId('preview-shift', hidden)).toBeTruthy();
    expect(screen.getByTestId('preview-receivable', hidden)).toBeTruthy();
    expect(screen.getByTestId('preview-earnings', hidden)).toBeTruthy();
    expect(screen.getByLabelText(/Prévia do produto/)).toBeTruthy();
    // Conteúdo interno fica oculto: nada de números soltos fora de contexto.
    expect(screen.queryByText('R$ 8.450')).toBeNull();
  });

  it('cada cartão tem uma elevação diferente, criando profundidade', async () => {
    await renderAccountScreen();
    const elevation = (testID: string) => {
      const style = screen.getByTestId(testID, { includeHiddenElements: true }).props.style;
      const flat = Array.isArray(style) ? Object.assign({}, ...style.flat(2)) : style;
      return { opacity: flat.shadowOpacity as number, radius: flat.shadowRadius as number };
    };
    const shift = elevation('preview-shift');
    const receivable = elevation('preview-receivable');
    const earnings = elevation('preview-earnings');
    expect(shift.opacity).toBeLessThan(receivable.opacity);
    expect(receivable.radius).toBeLessThan(earnings.radius);
  });

  it('a tela é estática: a prévia encolhe para caber em vez de rolar ou cobrir os botões', async () => {
    await renderAccountScreen();
    const hidden = { includeHiddenElements: true };
    const earningsHeight = 120;
    const needed = accountPreviewMetrics.earningsTop + earningsHeight;

    await act(async () => {
      fireEvent(screen.getByTestId('preview-earnings', hidden), 'layout', {
        nativeEvent: { layout: { x: 0, y: 0, width: 214, height: earningsHeight } },
      });
      fireEvent(screen.getByTestId('account-preview', hidden), 'layout', {
        nativeEvent: { layout: { x: 0, y: 0, width: 326, height: needed / 2 } },
      });
    });

    const cards = screen.getByTestId('account-preview-cards', hidden).props.style;
    const flat = Array.isArray(cards) ? Object.assign({}, ...cards.flat(2)) : cards;
    expect(flat.height).toBe(needed);
    expect(flat.transform[0].scale).toBeCloseTo(0.5, 2);
  });

  it('sobrando espaço, a prévia fica no tamanho do design', async () => {
    await renderAccountScreen();
    const hidden = { includeHiddenElements: true };
    await act(async () => {
      fireEvent(screen.getByTestId('preview-earnings', hidden), 'layout', {
        nativeEvent: { layout: { x: 0, y: 0, width: 214, height: 120 } },
      });
      fireEvent(screen.getByTestId('account-preview', hidden), 'layout', {
        nativeEvent: { layout: { x: 0, y: 0, width: 326, height: 400 } },
      });
    });
    const cards = screen.getByTestId('account-preview-cards', hidden).props.style;
    const flat = Array.isArray(cards) ? Object.assign({}, ...cards.flat(2)) : cards;
    expect(flat.transform[0].scale).toBe(1);
  });

  it('texto legal mantém fonte e tamanho; só o trecho de link fica em negrito', async () => {
    await renderAccountScreen();
    const sentence = screen.getByText(/Ao continuar, você concorda/);
    const paragraph = Array.isArray(sentence.props.style)
      ? Object.assign({}, ...sentence.props.style.flat(2))
      : sentence.props.style;
    for (const label of ['Termos de Uso', 'Política de Privacidade']) {
      const part = screen.getByText(label);
      const style = Array.isArray(part.props.style)
        ? Object.assign({}, ...part.props.style.flat(2))
        : part.props.style;
      expect(style.fontSize).toBe(paragraph.fontSize);
      expect(style.lineHeight).toBe(paragraph.lineHeight);
      expect(style.color).toBe(paragraph.color);
      expect(style.fontWeight).toBe('600');
      expect(style.textDecorationLine).toBeUndefined();
    }
  });

  it('termos e privacidade só viram link quando a URL existir (P04)', async () => {
    await renderAccountScreen();
    expect(screen.queryByRole('link', { name: 'Termos de Uso' })).toBeNull();
    expect(screen.getByText('Termos de Uso')).toBeTruthy();

    legalUrls.terms = 'https://dokh.app/termos';
    await renderAccountScreen();
    expect(screen.getByRole('link', { name: 'Termos de Uso' })).toBeTruthy();
  });
});
