import '@/i18n';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { router } from 'expo-router';
import { useProfileDraft } from '@/features/onboarding/profile-draft';
import { SocialChoices } from './AuthVisuals';
import { isAppleSignInAvailable, signInWithApple } from './apple-auth';
import { isGoogleSignInAvailable, signInWithGoogle } from './google-auth';

jest.mock('expo-router', () => ({ router: { replace: jest.fn() } }));
jest.mock('@/data/supabase-client', () => ({ supabase: {} }));
jest.mock('./apple-auth', () => ({
  isAppleSignInAvailable: jest.fn(async () => true),
  signInWithApple: jest.fn(),
}));
jest.mock('./google-auth', () => ({
  isGoogleSignInAvailable: jest.fn(() => false),
  signInWithGoogle: jest.fn(),
}));

const mockedSignIn = jest.mocked(signInWithApple);
const mockedAvailable = jest.mocked(isAppleSignInAvailable);
const mockedGoogleAvailable = jest.mocked(isGoogleSignInAvailable);
const mockedGoogle = jest.mocked(signInWithGoogle);

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
  mockedGoogleAvailable.mockReturnValue(false);
  useProfileDraft.getState().reset();
});

test('Apple habilitado entra e leva ao roteador, com o primeiro nome no rascunho', async () => {
  mockedSignIn.mockResolvedValue({ status: 'signedIn', givenName: 'Ana' });
  await pressApple();

  expect(router.replace).toHaveBeenCalledWith('/');
  expect(useProfileDraft.getState().displayName).toBe('Ana');
  // Sem os client IDs do ambiente, o Google fica indisponível.
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

test('Google configurado entra e leva ao roteador, com o primeiro nome no rascunho', async () => {
  mockedGoogleAvailable.mockReturnValue(true);
  mockedGoogle.mockResolvedValue({ status: 'signedIn', givenName: 'Bia' });
  await render(<SocialChoices />);
  await act(async () => {
    await fireEvent.press(screen.getByTestId('social-google'));
  });
  expect(mockedGoogle).toHaveBeenCalled();
  expect(router.replace).toHaveBeenCalledWith('/');
  expect(useProfileDraft.getState().displayName).toBe('Bia');
});

test('Google cancelado fica na tela; falha mostra a mensagem do Google', async () => {
  mockedGoogleAvailable.mockReturnValue(true);
  mockedGoogle.mockResolvedValueOnce({ status: 'cancelled' });
  await render(<SocialChoices />);
  await act(async () => {
    await fireEvent.press(screen.getByTestId('social-google'));
  });
  expect(router.replace).not.toHaveBeenCalled();

  mockedGoogle.mockRejectedValueOnce(new Error('network'));
  await act(async () => {
    await fireEvent.press(screen.getByTestId('social-google'));
  });
  expect(screen.getByText('Não foi possível entrar com o Google. Tente novamente.')).toBeTruthy();
});
