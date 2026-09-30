import type { AuthClient } from '@/features/auth/session';

/**
 * Exclusão de conta (4.6). A Edge Function `delete-account` apaga arquivos, dados e o usuário
 * (sessões revogadas em todos os aparelhos); depois a sessão local é descartada. Repetir após
 * uma falha é seguro: a função é idempotente.
 */
export async function deleteAccount(client: AuthClient, appleAuthorizationCode?: string) {
  const { error } = await client.functions.invoke('delete-account', {
    body: appleAuthorizationCode ? { appleAuthorizationCode } : {},
  });
  if (error) throw error;
  // A conta já não existe no servidor: só falta esquecer a sessão neste aparelho.
  await client.auth.signOut({ scope: 'local' });
}
