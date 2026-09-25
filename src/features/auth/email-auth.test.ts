import {
  acceptEmailLink,
  authErrorMessage,
  matchesAuthRedirect,
  sendRecoveryEmail,
  signInWithEmail,
  signUpWithEmail,
  updatePassword,
} from './email-auth';
import {
  recoverySchema,
  resetPasswordSchema,
  signInSchema,
  signUpSchema,
} from './email-auth.schema';
import type { AuthClient } from './session';

function clientWith(auth: Record<string, jest.Mock>) {
  return { auth } as unknown as AuthClient;
}

describe('formulários de e-mail', () => {
  it('rejeita e-mail e senha inválidos antes do envio', () => {
    expect(signInSchema.safeParse({ email: 'inválido', password: '12345' }).success).toBe(false);
    expect(
      signUpSchema.safeParse({ email: 'valid@example.invalid', password: '123456' }).success,
    ).toBe(true);
    expect(recoverySchema.safeParse({ email: '' }).success).toBe(false);
    expect(resetPasswordSchema.safeParse({ password: '12345' }).success).toBe(false);
  });

  it('usa as operações Supabase de cadastro, entrada, recuperação e troca de senha', async () => {
    const signInWithPassword = jest.fn(async () => ({
      data: { session: { user: { id: 'id' } } },
      error: null,
    }));
    const signUp = jest.fn(async () => ({ data: { session: null }, error: null }));
    const resetPasswordForEmail = jest.fn(async () => ({ error: null }));
    const updateUser = jest.fn(async () => ({ error: null }));
    const client = clientWith({ signInWithPassword, signUp, resetPasswordForEmail, updateUser });

    await signInWithEmail(client, 'valid@example.invalid', 'password');
    await signUpWithEmail(client, 'valid@example.invalid', 'password', 'dokh://auth-callback');
    await sendRecoveryEmail(client, 'valid@example.invalid', 'dokh://reset-password');
    await updatePassword(client, 'new-password');

    expect(signInWithPassword).toHaveBeenCalledWith({
      email: 'valid@example.invalid',
      password: 'password',
    });
    expect(signUp).toHaveBeenCalledWith({
      email: 'valid@example.invalid',
      password: 'password',
      options: { emailRedirectTo: 'dokh://auth-callback' },
    });
    expect(resetPasswordForEmail).toHaveBeenCalledWith('valid@example.invalid', {
      redirectTo: 'dokh://reset-password',
    });
    expect(updateUser).toHaveBeenCalledWith({ password: 'new-password' });
  });

  it('aceita apenas links de recuperação com dois tokens válidos', async () => {
    const setSession = jest.fn(async () => ({ error: null }));
    const client = clientWith({ setSession });
    await acceptEmailLink(
      client,
      'dokh://reset-password#access_token=abc&refresh_token=def&type=recovery',
      ['recovery'],
    );
    expect(setSession).toHaveBeenCalledWith({ access_token: 'abc', refresh_token: 'def' });
    await expect(
      acceptEmailLink(client, 'dokh://reset-password#access_token=abc&type=recovery', ['recovery']),
    ).rejects.toThrow();
    await expect(
      acceptEmailLink(
        client,
        'dokh://reset-password#access_token=abc&refresh_token=def&type=signup',
        ['recovery'],
      ),
    ).rejects.toThrow();
    await expect(
      acceptEmailLink(client, 'dokh://reset-password#error_code=otp_expired', ['recovery']),
    ).rejects.toThrow();
    expect(setSession).toHaveBeenCalledTimes(1);
  });

  it('reconhece as rotas de retorno no esquema nativo', () => {
    expect(
      matchesAuthRedirect('dokh://reset-password#type=recovery', 'dokh://reset-password'),
    ).toBe(true);
    expect(
      matchesAuthRedirect(
        'exp://192.0.2.1:8081/--/reset-password#type=recovery',
        'exp://192.0.2.1:8081/--/reset-password',
      ),
    ).toBe(true);
    expect(matchesAuthRedirect('dokh://sign-in#type=recovery', 'dokh://reset-password')).toBe(
      false,
    );
  });

  it('não expõe mensagens brutas com e-mail ou token', () => {
    const raw = { code: 'unknown', message: 'valid@example.invalid access_token=SECRET' };
    expect(authErrorMessage(raw, 'signIn')).not.toMatch(/example|SECRET|access_token/);
    expect(authErrorMessage({ code: 'invalid_credentials' }, 'signIn')).toBe(
      'E-mail ou senha incorretos.',
    );
    expect(authErrorMessage({ code: 'over_email_send_rate_limit' }, 'recover')).toMatch(/Aguarde/);
    expect(
      authErrorMessage(
        { name: 'AuthRetryableFetchError', status: 0, message: raw.message },
        'signUp',
      ),
    ).toBe('Não foi possível conectar ao servidor. Verifique a rede e tente novamente.');
    expect(authErrorMessage({ code: 'signup_disabled' }, 'signUp')).toBe(
      'O cadastro por e-mail está indisponível no momento.',
    );
  });
});
