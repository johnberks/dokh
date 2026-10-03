import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { Platform } from 'react-native';
import type { PublicEnv } from '@/config/env.schema';
import { googleClientIds, isGoogleSignInAvailable, signInWithGoogle } from './google-auth';
import type { AuthClient } from './session';

const base = {
  EXPO_PUBLIC_APP_ENV: 'local',
  EXPO_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:54321',
  EXPO_PUBLIC_SUPABASE_ANON_KEY: 'anon',
} as PublicEnv;
const env = {
  ...base,
  EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID: 'web-123.apps.googleusercontent.com',
  EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID: 'ios-456.apps.googleusercontent.com',
} as PublicEnv;

const signIn = jest.mocked(GoogleSignin.signIn);
const signInWithIdToken = jest.fn(async () => ({ data: {}, error: null }));
const client = { auth: { signInWithIdToken } } as unknown as AuthClient;

beforeEach(() => {
  jest.clearAllMocks();
  signInWithIdToken.mockResolvedValue({ data: {}, error: null });
});

describe('Entrar com Google (4.4)', () => {
  it('sem os client IDs do ambiente, fica indisponível; no iPhone exige também o do iOS', () => {
    expect(isGoogleSignInAvailable(base)).toBe(false);
    expect(
      googleClientIds({ ...base, EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID: 'web' } as PublicEnv),
    ).toBeNull();
    expect(isGoogleSignInAvailable(env)).toBe(true);
  });

  it('no Android basta o web client', () => {
    const os = jest.replaceProperty(Platform, 'OS', 'android');
    expect(
      googleClientIds({ ...base, EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID: 'web' } as PublicEnv),
    ).toEqual({ webClientId: 'web', iosClientId: undefined });
    os.restore();
  });

  it('troca o ID token do Google por uma sessão Supabase e devolve o primeiro nome', async () => {
    signIn.mockResolvedValue({
      type: 'success',
      data: {
        idToken: 'google-id-token',
        serverAuthCode: null,
        scopes: [],
        user: {
          id: '1',
          email: 'ana@example.com',
          name: 'Ana Souza',
          givenName: ' Ana ',
          familyName: 'Souza',
          photo: null,
        },
      },
    });
    await expect(signInWithGoogle(client, env)).resolves.toEqual({
      status: 'signedIn',
      givenName: 'Ana',
    });
    expect(GoogleSignin.configure).toHaveBeenCalledWith({
      webClientId: 'web-123.apps.googleusercontent.com',
      iosClientId: 'ios-456.apps.googleusercontent.com',
    });
    expect(signInWithIdToken).toHaveBeenCalledWith({
      provider: 'google',
      token: 'google-id-token',
    });
    // A conta do Google não fica presa ao aparelho.
    expect(GoogleSignin.signOut).toHaveBeenCalled();
  });

  it('cancelar (resposta ou código) não é erro e não chama o Supabase', async () => {
    signIn.mockResolvedValueOnce({ type: 'cancelled', data: null });
    await expect(signInWithGoogle(client, env)).resolves.toEqual({ status: 'cancelled' });
    signIn.mockRejectedValueOnce(Object.assign(new Error('x'), { code: 'SIGN_IN_CANCELLED' }));
    await expect(signInWithGoogle(client, env)).resolves.toEqual({ status: 'cancelled' });
    expect(signInWithIdToken).not.toHaveBeenCalled();
  });

  it('sem ID token, ou com erro do Supabase, falha', async () => {
    const success = (idToken: string | null) => ({
      type: 'success' as const,
      data: {
        idToken,
        serverAuthCode: null,
        scopes: [],
        user: {
          id: '1',
          email: 'a@b.c',
          name: null,
          givenName: null,
          familyName: null,
          photo: null,
        },
      },
    });
    signIn.mockResolvedValueOnce(success(null));
    await expect(signInWithGoogle(client, env)).rejects.toThrow('google_missing_id_token');

    signIn.mockResolvedValueOnce(success('token'));
    signInWithIdToken.mockResolvedValueOnce({ data: {}, error: new Error('invalid') } as never);
    await expect(signInWithGoogle(client, env)).rejects.toThrow('invalid');
  });

  it('sem configuração, nem tenta abrir o Google', async () => {
    await expect(signInWithGoogle(client, base)).rejects.toThrow('google_not_configured');
    expect(signIn).not.toHaveBeenCalled();
  });
});
