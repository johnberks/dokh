import 'react-native-url-polyfill/auto';
import type { AuthClient } from './session';

export type AuthAction = 'signIn' | 'signUp' | 'recover' | 'reset';

/** Never surface raw Auth errors: they may contain an address or other PII. */
export function authErrorMessage(error: unknown, action: AuthAction): string {
  const code =
    error && typeof error === 'object' && 'code' in error && typeof error.code === 'string'
      ? error.code
      : null;
  if (code === 'invalid_credentials') return 'E-mail ou senha incorretos.';
  if (code === 'email_not_confirmed') return 'Confirme seu e-mail antes de entrar.';
  if (code === 'user_already_exists' || code === 'email_exists')
    return 'Não foi possível criar a conta. Tente entrar ou recuperar sua senha.';
  if (code === 'weak_password') return 'Escolha uma senha mais forte.';
  if (code === 'over_email_send_rate_limit' || code === 'over_request_rate_limit')
    return 'Muitas tentativas. Aguarde um pouco e tente novamente.';
  if (code === 'otp_expired' || code === 'otp_disabled')
    return 'Este link expirou. Solicite outro e-mail.';
  if (action === 'recover') return 'Não foi possível enviar o e-mail. Tente novamente.';
  if (action === 'reset') return 'Não foi possível atualizar a senha. Tente novamente.';
  return 'Não foi possível continuar. Tente novamente.';
}

export async function signInWithEmail(client: AuthClient, email: string, password: string) {
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signUpWithEmail(
  client: AuthClient,
  email: string,
  password: string,
  emailRedirectTo: string,
) {
  const { data, error } = await client.auth.signUp({
    email,
    password,
    options: { emailRedirectTo },
  });
  if (error) throw error;
  return data;
}

export async function sendRecoveryEmail(client: AuthClient, email: string, redirectTo: string) {
  const { error } = await client.auth.resetPasswordForEmail(email, { redirectTo });
  if (error) throw error;
}

export async function updatePassword(client: AuthClient, password: string) {
  const { error } = await client.auth.updateUser({ password });
  if (error) throw error;
}

/** Compare the exact app route, excluding the private fragment returned by Auth. */
export function matchesAuthRedirect(url: string, expectedUrl: string) {
  const route = (value: string) => value.split(/[?#]/, 1)[0].replace(/\/$/, '');
  return route(url) === route(expectedUrl);
}

/** Supabase's default mobile email template returns an implicit-flow fragment. */
export async function acceptEmailLink(
  client: AuthClient,
  url: string,
  allowedTypes: readonly string[],
) {
  const fragment = url.split('#', 2)[1] ?? '';
  const params = new URLSearchParams(fragment);
  if (params.get('error_code') || params.get('error')) throw new Error('recovery_link_invalid');
  if (!allowedTypes.includes(params.get('type') ?? '')) throw new Error('recovery_link_invalid');
  const accessToken = params.get('access_token');
  const refreshToken = params.get('refresh_token');
  if (!accessToken || !refreshToken) throw new Error('recovery_link_invalid');
  const { error } = await client.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });
  if (error) throw error;
}
