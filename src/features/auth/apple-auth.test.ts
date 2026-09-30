import * as AppleAuthentication from 'expo-apple-authentication';
import { Platform } from 'react-native';
import { isAppleSignInAvailable, signInWithApple } from './apple-auth';
import type { AuthClient } from './session';

jest.mock('expo-crypto', () => ({
  CryptoDigestAlgorithm: { SHA256: 'SHA-256' },
  randomUUID: () => 'raw-nonce',
  digestStringAsync: jest.fn(async (_algorithm: string, value: string) => `sha256(${value})`),
}));

const signInAsync = AppleAuthentication.signInAsync as jest.Mock;
const isAvailableAsync = AppleAuthentication.isAvailableAsync as jest.Mock;

function fakeClient(signInError: unknown = null) {
  const signInWithIdToken = jest.fn(async () => ({ data: {}, error: signInError }));
  const updateUser = jest.fn(async () => ({ data: {}, error: null }));
  const client = { auth: { signInWithIdToken, updateUser } } as unknown as AuthClient;
  return { client, signInWithIdToken, updateUser };
}

function credential(fullName: Partial<AppleAuthentication.AppleAuthenticationFullName> | null) {
  return {
    user: 'apple-user',
    identityToken: 'id-token',
    authorizationCode: 'code',
    email: null,
    realUserStatus: 1,
    state: null,
    fullName: fullName && {
      namePrefix: null,
      givenName: null,
      middleName: null,
      familyName: null,
      nameSuffix: null,
      nickname: null,
      ...fullName,
    },
  };
}

beforeEach(() => {
  signInAsync.mockReset();
  isAvailableAsync.mockReset();
});

test('sends the hashed nonce to Apple and the raw nonce to Supabase', async () => {
  signInAsync.mockResolvedValue(credential({ givenName: 'Ana', familyName: 'Souza' }));
  const { client, signInWithIdToken, updateUser } = fakeClient();

  await expect(signInWithApple(client)).resolves.toEqual({ status: 'signedIn', givenName: 'Ana' });

  expect(signInAsync).toHaveBeenCalledWith(expect.objectContaining({ nonce: 'sha256(raw-nonce)' }));
  expect(signInWithIdToken).toHaveBeenCalledWith({
    provider: 'apple',
    token: 'id-token',
    nonce: 'raw-nonce',
  });
  expect(updateUser).toHaveBeenCalledWith({
    data: { given_name: 'Ana', full_name: 'Ana Souza' },
  });
});

test('later sign-ins without a name keep the account metadata untouched', async () => {
  signInAsync.mockResolvedValue(credential(null));
  const { client, updateUser } = fakeClient();

  await expect(signInWithApple(client)).resolves.toEqual({ status: 'signedIn', givenName: null });
  expect(updateUser).not.toHaveBeenCalled();
});

test('closing the Apple sheet is a cancellation, not an error', async () => {
  signInAsync.mockRejectedValue(
    Object.assign(new Error('canceled'), { code: 'ERR_REQUEST_CANCELED' }),
  );
  const { client, signInWithIdToken } = fakeClient();

  await expect(signInWithApple(client)).resolves.toEqual({ status: 'cancelled' });
  expect(signInWithIdToken).not.toHaveBeenCalled();
});

test('a rejected token surfaces the Supabase error', async () => {
  signInAsync.mockResolvedValue(credential(null));
  const rejection = { code: 'bad_jwt' };
  const { client } = fakeClient(rejection);

  await expect(signInWithApple(client)).rejects.toBe(rejection);
});

test('Apple sign-in is offered only on iOS devices that support it', async () => {
  isAvailableAsync.mockResolvedValue(true);
  const original = Platform.OS;
  Object.defineProperty(Platform, 'OS', { value: 'android', configurable: true });
  await expect(isAppleSignInAvailable()).resolves.toBe(false);
  Object.defineProperty(Platform, 'OS', { value: 'ios', configurable: true });
  await expect(isAppleSignInAvailable()).resolves.toBe(true);
  Object.defineProperty(Platform, 'OS', { value: original, configurable: true });
});
