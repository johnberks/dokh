import type { AuthClient } from '@/features/auth/session';
import { deleteAccount } from './delete-account';

function fakeClient(invokeError: unknown = null) {
  const invoke = jest.fn(async () => ({ data: { deleted: true }, error: invokeError }));
  const signOut = jest.fn(async () => ({ error: null }));
  const client = { functions: { invoke }, auth: { signOut } } as unknown as AuthClient;
  return { client, invoke, signOut };
}

test('e-mail: chama a função sem código e esquece a sessão local', async () => {
  const { client, invoke, signOut } = fakeClient();
  await deleteAccount(client);
  expect(invoke).toHaveBeenCalledWith('delete-account', { body: {} });
  expect(signOut).toHaveBeenCalledWith({ scope: 'local' });
});

test('Apple: envia o código para revogar o acesso', async () => {
  const { client, invoke } = fakeClient();
  await deleteAccount(client, 'apple-code');
  expect(invoke).toHaveBeenCalledWith('delete-account', {
    body: { appleAuthorizationCode: 'apple-code' },
  });
});

test('falha no servidor mantém a sessão para tentar de novo', async () => {
  const failure = new Error('server_error');
  const { client, signOut } = fakeClient(failure);
  await expect(deleteAccount(client)).rejects.toBe(failure);
  expect(signOut).not.toHaveBeenCalled();
});
