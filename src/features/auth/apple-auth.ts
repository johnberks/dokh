import * as AppleAuthentication from 'expo-apple-authentication';
import { CryptoDigestAlgorithm, digestStringAsync, randomUUID } from 'expo-crypto';
import { Platform } from 'react-native';
import type { AuthClient } from './session';

export type AppleSignInResult =
  | { status: 'signedIn'; givenName: string | null }
  | { status: 'cancelled' };

/** Só o iOS tem o login nativo; em Android/web o botão continua indisponível. */
export async function isAppleSignInAvailable(): Promise<boolean> {
  if (Platform.OS !== 'ios') return false;
  try {
    return await AppleAuthentication.isAvailableAsync();
  } catch {
    return false;
  }
}

function isCancellation(error: unknown) {
  return (
    error != null &&
    typeof error === 'object' &&
    'code' in error &&
    (error.code === 'ERR_REQUEST_CANCELED' || error.code === 'ERR_CANCELED')
  );
}

/**
 * Login nativo da Apple trocado por uma sessão Supabase (4.3). A Apple recebe o SHA-256 do
 * nonce e o Supabase o nonce original, para que o token não possa ser reaproveitado.
 * O nome só vem no primeiro login: guardamos nos metadados da conta para não perdê-lo.
 */
export async function signInWithApple(client: AuthClient): Promise<AppleSignInResult> {
  const nonce = randomUUID();
  const hashedNonce = await digestStringAsync(CryptoDigestAlgorithm.SHA256, nonce);

  let credential: AppleAuthentication.AppleAuthenticationCredential;
  try {
    credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
      nonce: hashedNonce,
    });
  } catch (error) {
    if (isCancellation(error)) return { status: 'cancelled' };
    throw error;
  }
  if (!credential.identityToken) throw new Error('apple_missing_identity_token');

  const { error } = await client.auth.signInWithIdToken({
    provider: 'apple',
    token: credential.identityToken,
    nonce,
  });
  if (error) throw error;

  const givenName = credential.fullName?.givenName?.trim() || null;
  const familyName = credential.fullName?.familyName?.trim() || null;
  if (givenName) {
    const fullName = [givenName, familyName].filter(Boolean).join(' ');
    // Sem o nome a conta continua válida: o onboarding pergunta de novo.
    await client.auth
      .updateUser({ data: { given_name: givenName, full_name: fullName } })
      .catch(() => undefined);
  }
  return { status: 'signedIn', givenName };
}
