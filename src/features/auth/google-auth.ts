import type { SignInResponse } from '@react-native-google-signin/google-signin';
import { Platform } from 'react-native';
import { getEnv } from '@/config/env';
import type { PublicEnv } from '@/config/env.schema';
import { googleSigninModule } from './google-signin-module';
import type { AuthClient } from './session';

export type GoogleSignInResult =
  | { status: 'signedIn'; givenName: string | null }
  | { status: 'cancelled' };

type GoogleIds = { webClientId: string; iosClientId: string | undefined };

/**
 * Client IDs OAuth públicos. O web client define a audiência do ID token que o Supabase aceita;
 * o iOS também exige o próprio client (e o URL scheme dele no build, `app.config.ts`).
 */
export function googleClientIds(env: PublicEnv = getEnv()): GoogleIds | null {
  const webClientId = env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
  const iosClientId = env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
  if (!webClientId) return null;
  if (Platform.OS === 'ios' && !iosClientId) return null;
  return { webClientId, iosClientId };
}

/** Sem os client IDs do ambiente (ou num build sem o módulo nativo), o botão fica indisponível. */
export function isGoogleSignInAvailable(env: PublicEnv = getEnv()): boolean {
  return Platform.OS !== 'web' && googleClientIds(env) !== null && googleSigninModule() !== null;
}

let configuredFor: string | null = null;

function configure(
  GoogleSignin: NonNullable<ReturnType<typeof googleSigninModule>>['GoogleSignin'],
  ids: GoogleIds,
) {
  const key = `${ids.webClientId}|${ids.iosClientId ?? ''}`;
  if (configuredFor === key) return;
  GoogleSignin.configure({ webClientId: ids.webClientId, iosClientId: ids.iosClientId });
  configuredFor = key;
}

/**
 * Login nativo do Google trocado por uma sessão Supabase (4.4), como o da Apple: o Google
 * entrega o ID token e o Supabase confere a audiência (web e iOS client IDs) e cria ou reaproveita
 * a conta. A sessão do Google não fica presa ao aparelho: o próximo login escolhe a conta de novo.
 */
export async function signInWithGoogle(
  client: AuthClient,
  env: PublicEnv = getEnv(),
): Promise<GoogleSignInResult> {
  const ids = googleClientIds(env);
  const google = googleSigninModule();
  if (!ids || !google) throw new Error('google_not_configured');
  const { GoogleSignin, isCancelledResponse, isErrorWithCode, statusCodes } = google;
  configure(GoogleSignin, ids);

  let response: SignInResponse;
  try {
    if (Platform.OS === 'android') {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    }
    response = await GoogleSignin.signIn();
  } catch (error) {
    if (
      isErrorWithCode(error) &&
      (error.code === statusCodes.SIGN_IN_CANCELLED || error.code === statusCodes.IN_PROGRESS)
    ) {
      return { status: 'cancelled' };
    }
    throw error;
  }
  if (isCancelledResponse(response)) return { status: 'cancelled' };

  const { idToken, user } = response.data;
  void GoogleSignin.signOut().catch(() => undefined);
  if (!idToken) throw new Error('google_missing_id_token');

  const { error } = await client.auth.signInWithIdToken({ provider: 'google', token: idToken });
  if (error) throw error;
  return { status: 'signedIn', givenName: user.givenName?.trim() || null };
}
