import '@/i18n';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';
import {
  acceptEmailLink,
  sendRecoveryEmail,
  signInWithEmail,
  signUpWithEmail,
  updatePassword,
} from './email-auth';
import RecoverPasswordScreen from './screens/RecoverPasswordScreen';
import ResetPasswordScreen from './screens/ResetPasswordScreen';
import SignInScreen from './screens/SignInScreen';
import SignUpScreen from './screens/SignUpScreen';

let mockLinkUrl: string | null = null;

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), replace: jest.fn() },
}));
jest.mock('expo-linking', () => ({
  createURL: (path: string) => `dokh://${path}`,
  useLinkingURL: () => mockLinkUrl,
}));
jest.mock('expo-blur', () => {
  const { View } = require('react-native');
  return { BlurView: View, BlurTargetView: View };
});
jest.mock('./email-auth', () => ({
  ...jest.requireActual('./email-auth'),
  signInWithEmail: jest.fn(),
  signUpWithEmail: jest.fn(),
  sendRecoveryEmail: jest.fn(),
  acceptEmailLink: jest.fn(),
  updatePassword: jest.fn(),
}));

const mockedSignIn = jest.mocked(signInWithEmail);
const mockedSignUp = jest.mocked(signUpWithEmail);
const mockedRecover = jest.mocked(sendRecoveryEmail);
const mockedAccept = jest.mocked(acceptEmailLink);
const mockedUpdate = jest.mocked(updatePassword);

beforeEach(() => {
  jest.clearAllMocks();
  mockLinkUrl = null;
});

describe('telas de e-mail', () => {
  it('mantém o campo de 54 px e dá altura suficiente ao texto editável', async () => {
    await render(<SignInScreen />);
    for (const label of ['E-mail', 'Senha']) {
      const input = screen.getByLabelText(label);
      expect(input.parent).toHaveStyle({ height: 54 });
      expect(input).toHaveStyle({ height: 28, paddingVertical: 2, fontSize: 15, lineHeight: 24 });
    }
    await fireEvent.changeText(screen.getByLabelText('E-mail'), 'gypq@example.invalid');
    expect(screen.getByLabelText('E-mail').props.value).toBe('gypq@example.invalid');
  });

  it('valida os campos antes de enviar o login', async () => {
    await render(<SignInScreen />);
    await fireEvent.press(screen.getByRole('button', { name: 'Entrar' }));
    expect(await screen.findByText('Informe um e-mail válido.')).toBeTruthy();
    expect(screen.getByText('A senha precisa ter pelo menos 6 caracteres.')).toBeTruthy();
    expect(mockedSignIn).not.toHaveBeenCalled();
  });

  it('entra com dados válidos e navega somente após resposta do servidor', async () => {
    mockedSignIn.mockResolvedValue({ user: { id: 'user-id' }, session: {} } as never);
    await render(<SignInScreen />);
    await fireEvent.changeText(screen.getByLabelText('E-mail'), 'valid@example.invalid');
    await fireEvent.changeText(screen.getByLabelText('Senha'), 'password');
    await fireEvent.press(screen.getByRole('button', { name: 'Entrar' }));
    await waitFor(() =>
      expect(mockedSignIn).toHaveBeenCalledWith(
        expect.anything(),
        'valid@example.invalid',
        'password',
      ),
    );
    await waitFor(() => expect(router.replace).toHaveBeenCalledWith('/'));
  });

  it('preserva o rascunho e sanitiza falha de login', async () => {
    mockedSignIn.mockRejectedValue({
      code: 'invalid_credentials',
      message: 'valid@example.invalid',
    });
    await render(<SignInScreen />);
    await fireEvent.changeText(screen.getByLabelText('E-mail'), 'valid@example.invalid');
    await fireEvent.changeText(screen.getByLabelText('Senha'), 'password');
    await fireEvent.press(screen.getByRole('button', { name: 'Entrar' }));
    expect(await screen.findByText('E-mail ou senha incorretos.')).toBeTruthy();
    expect(screen.getByLabelText('E-mail').props.value).toBe('valid@example.invalid');
    expect(router.replace).not.toHaveBeenCalled();
  });

  it('cadastro sem sessão orienta confirmação por e-mail', async () => {
    mockedSignUp.mockResolvedValue({ user: { id: 'user-id' }, session: null } as never);
    await render(<SignUpScreen />);
    await fireEvent.changeText(screen.getByLabelText('E-mail'), 'valid@example.invalid');
    await fireEvent.changeText(screen.getByLabelText('Senha'), 'password');
    await fireEvent.press(screen.getByRole('button', { name: 'Criar conta com e-mail' }));
    expect(
      await screen.findByText('Confira seu e-mail para confirmar a conta antes de entrar.'),
    ).toBeTruthy();
    expect(router.replace).not.toHaveBeenCalled();
  });

  it('mostra e oculta a senha no cadastro sem alterar o rascunho', async () => {
    await render(<SignUpScreen />);
    await fireEvent.changeText(screen.getByLabelText('Senha'), 'test-password');
    expect(screen.getByLabelText('Senha').props.secureTextEntry).toBe(true);
    await fireEvent.press(screen.getByRole('button', { name: 'Mostrar senha' }));
    expect(screen.getByLabelText('Senha').props.secureTextEntry).toBe(false);
    expect(screen.getByLabelText('Senha').props.value).toBe('test-password');
    await fireEvent.press(screen.getByRole('button', { name: 'Ocultar senha' }));
    expect(screen.getByLabelText('Senha').props.secureTextEntry).toBe(true);
  });

  it('explica falha de conexão no cadastro e preserva os campos', async () => {
    mockedSignUp.mockRejectedValue({ name: 'AuthRetryableFetchError', status: 0 });
    await render(<SignUpScreen />);
    await fireEvent.changeText(screen.getByLabelText('E-mail'), 'valid@example.invalid');
    await fireEvent.changeText(screen.getByLabelText('Senha'), 'test-password');
    await fireEvent.press(screen.getByRole('button', { name: 'Criar conta com e-mail' }));
    expect(
      await screen.findByText(
        'Não foi possível conectar ao servidor. Verifique a rede e tente novamente.',
      ),
    ).toBeTruthy();
    expect(screen.getByLabelText('Senha').props.value).toBe('test-password');
    expect(router.replace).not.toHaveBeenCalled();
  });

  it('recuperação envia link sem revelar se a conta existe', async () => {
    mockedRecover.mockResolvedValue(undefined);
    await render(<RecoverPasswordScreen />);
    await fireEvent.changeText(screen.getByLabelText('E-mail'), 'valid@example.invalid');
    await fireEvent.press(screen.getByRole('button', { name: 'Enviar link' }));
    expect(
      await screen.findByText(
        'Se houver uma conta com este e-mail, você receberá um link de recuperação.',
      ),
    ).toBeTruthy();
    expect(mockedRecover).toHaveBeenCalledWith(
      expect.anything(),
      'valid@example.invalid',
      'dokh://reset-password',
    );
  });

  it('link válido habilita a troca de senha e preserva rascunho quando falha', async () => {
    mockLinkUrl = 'dokh://reset-password#access_token=abc&refresh_token=def&type=recovery';
    mockedAccept.mockResolvedValue(undefined);
    mockedUpdate.mockRejectedValue({ code: 'unknown', message: 'secret' });
    await render(<ResetPasswordScreen />);
    await waitFor(() => expect(screen.getByLabelText('Senha')).toBeTruthy());
    await fireEvent.changeText(screen.getByLabelText('Senha'), 'new-password');
    await fireEvent.press(screen.getByRole('button', { name: 'Salvar nova senha' }));
    expect(
      await screen.findByText('Não foi possível atualizar a senha. Tente novamente.'),
    ).toBeTruthy();
    expect(screen.getByLabelText('Senha').props.value).toBe('new-password');
    expect(router.replace).not.toHaveBeenCalled();
  });

  it('link inválido não exibe campo de nova senha', async () => {
    await render(<ResetPasswordScreen />);
    expect(screen.queryByLabelText('Senha')).toBeNull();
    expect(
      screen.getByText('Este link é inválido ou expirou. Solicite outro e-mail.'),
    ).toBeTruthy();
  });
});
