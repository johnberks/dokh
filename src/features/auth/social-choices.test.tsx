import '@/i18n';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { router } from 'expo-router';
import { useProfileDraft } from '@/features/onboarding/profile-draft';
import { SocialChoices } from './AuthVisuals';
import { isAppleSignInAvailable, signInWithApple } from './apple-auth';

jest.mock('expo-router', () => ({ router: { replace: jest.fn() } }));
jest.mock('@/data/supabase-client', () => ({ supabase: {} }));
jest.mock('./apple-auth', () => ({
  isAppleSignInAvailable: jest.fn(async () => true),
  signInWithApple: jest.fn(),
}));

const mockedSignIn = jest.mocked(signInWithApple);
const mockedAvailable = jest.mocked(isAppleSignInAvailable);

async function pressApple() {
  await render(<SocialChoices />);
  const apple = await screen.findByTestId('social-apple');
  await act(async () => {
    await fireEvent.press(apple);
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  mockedAvailable.mockResolvedValue(true);
  useProfileDraft.getState().reset();
});

test('Apple habilitado entra e leva ao roteador, com o primeiro nome no rascunho', async () => {
  mockedSignIn.mockResolvedValue({ status: 'signedIn', givenName: 'Ana' });
  await pressApple();

  expect(router.replace).toHaveBeenCalledWith('/');
  expect(useProfileDraft.getState().displayName).toBe('Ana');
  // Google segue indisponível até 4.4.
  const google = screen.getByRole('button', { name: 'Continuar com Google' });
  expect(google.props.accessibilityState).toMatchObject({ disabled: true });
});

test('fechar a folha da Apple não navega nem mostra erro', async () => {
  mockedSignIn.mockResolvedValue({ status: 'cancelled' });
  await pressApple();

  expect(router.replace).not.toHaveBeenCalled();
  expect(screen.queryByText(/Não foi possível/)).toBeNull();
});

test('falha no login mostra mensagem sem detalhes técnicos', async () => {
  mockedSignIn.mockRejectedValue({ code: 'bad_jwt', message: 'token for ana@x.com invalid' });
  await pressApple();

  expect(router.replace).not.toHaveBeenCalled();
  expect(screen.getByText('Não foi possível entrar com a Apple. Tente novamente.')).toBeTruthy();
  expect(screen.queryByText(/ana@x.com/)).toBeNull();
});
