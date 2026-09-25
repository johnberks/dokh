import '@/i18n';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { router } from 'expo-router';
import { legalUrls } from '@/config/legal';
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
  it('usa o título aprovado e o subtítulo do HTML, sem carrossel nem Pular', async () => {
    await renderAccountScreen();
    expect(
      screen.getByRole('header', {
        name: 'Organize sua rotina e suas finanças em um só lugar.',
      }),
    ).toBeTruthy();
    expect(screen.getByText('Leva menos de um minuto.')).toBeTruthy();
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

  it('termos e privacidade só viram link quando a URL existir (P04)', async () => {
    await renderAccountScreen();
    expect(screen.queryByRole('link', { name: 'Termos de Uso' })).toBeNull();
    expect(screen.getByText('Termos de Uso')).toBeTruthy();

    legalUrls.terms = 'https://dokh.app/termos';
    await renderAccountScreen();
    expect(screen.getByRole('link', { name: 'Termos de Uso' })).toBeTruthy();
  });
});
