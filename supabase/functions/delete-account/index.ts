// 4.6 — Exclusão de conta. Idempotente: repetir a chamada depois de uma falha parcial conclui
// o que faltou e, com a conta já apagada, apenas confirma. Logs nunca levam e-mail, nome ou IDs.
import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2';
import { importPKCS8, SignJWT } from 'npm:jose@5';

const PRIVATE_BUCKETS = ['avatars', 'imports'] as const;
const PAGE = 100;

const cors = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': 'authorization, x-client-info, apikey, content-type',
};

function json(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'content-type': 'application/json' },
  });
}

function log(event: string, detail: Record<string, string | number | boolean> = {}) {
  console.log(JSON.stringify({ fn: 'delete-account', event, ...detail }));
}

function subjectOf(jwt: string): string | undefined {
  try {
    const payload = JSON.parse(atob(jwt.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return typeof payload.sub === 'string' ? payload.sub : undefined;
  } catch {
    return undefined;
  }
}

/** Storage primeiro: com o usuário apagado, não haveria mais dono para listar os arquivos. */
async function purgeStorage(admin: SupabaseClient, userId: string) {
  let removed = 0;
  for (const bucket of PRIVATE_BUCKETS) {
    for (;;) {
      const { data, error } = await admin.storage.from(bucket).list(userId, { limit: PAGE });
      if (error) throw new Error(`storage_list_failed:${bucket}`);
      const paths = (data ?? []).map((file) => `${userId}/${file.name}`);
      if (paths.length === 0) break;
      const { error: removeError } = await admin.storage.from(bucket).remove(paths);
      if (removeError) throw new Error(`storage_remove_failed:${bucket}`);
      removed += paths.length;
    }
  }
  return removed;
}

/**
 * A Apple exige revogar o acesso de quem entrou com ela. O app manda um `authorizationCode`
 * recém-emitido; sem as chaves configuradas (ambiente local), a revogação é pulada e registrada.
 */
async function revokeApple(code: string): Promise<'revoked' | 'skipped' | 'failed'> {
  const teamId = Deno.env.get('APPLE_TEAM_ID');
  const keyId = Deno.env.get('APPLE_KEY_ID');
  const privateKey = Deno.env.get('APPLE_PRIVATE_KEY');
  const clientId = Deno.env.get('APPLE_CLIENT_ID') ?? 'br.com.dokh.app';
  if (!teamId || !keyId || !privateKey) return 'skipped';
  try {
    const key = await importPKCS8(privateKey.replace(/\\n/g, '\n'), 'ES256');
    const clientSecret = await new SignJWT({})
      .setProtectedHeader({ alg: 'ES256', kid: keyId })
      .setIssuer(teamId)
      .setIssuedAt()
      .setExpirationTime('5m')
      .setAudience('https://appleid.apple.com')
      .setSubject(clientId)
      .sign(key);
    const form = (fields: Record<string, string>) => ({
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret, ...fields }),
    });
    const tokenResponse = await fetch(
      'https://appleid.apple.com/auth/token',
      form({ grant_type: 'authorization_code', code }),
    );
    if (!tokenResponse.ok) return 'failed';
    const tokens = (await tokenResponse.json()) as {
      refresh_token?: string;
      access_token?: string;
    };
    const token = tokens.refresh_token ?? tokens.access_token;
    if (!token) return 'failed';
    const revokeResponse = await fetch(
      'https://appleid.apple.com/auth/revoke',
      form({
        token,
        token_type_hint: tokens.refresh_token ? 'refresh_token' : 'access_token',
      }),
    );
    return revokeResponse.ok ? 'revoked' : 'failed';
  } catch {
    return 'failed';
  }
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (request.method !== 'POST') return json(405, { error: 'method_not_allowed' });

  const jwt = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (!jwt) return json(401, { error: 'unauthorized' });

  const url = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !serviceKey) {
    log('misconfigured');
    return json(500, { error: 'server_error' });
  }
  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // A assinatura do JWT prova quem pede, mesmo que a conta já tenha sido apagada numa
  // tentativa anterior: o Auth valida a assinatura antes de procurar o usuário, e esse caso
  // volta como `user_not_found`. É isso que torna a repetição segura.
  const { data: claims, error: claimsError } = await admin.auth.getClaims(jwt);
  let userId: string | undefined;
  let alreadyDeleted = false;
  if (!claimsError && claims?.claims.role === 'authenticated') {
    userId = claims.claims.sub;
  } else if (claimsError && 'code' in claimsError && claimsError.code === 'user_not_found') {
    userId = subjectOf(jwt);
    alreadyDeleted = true;
  }
  if (!userId) return json(401, { error: 'unauthorized' });

  let appleCode: string | null = null;
  try {
    const body = (await request.json()) as { appleAuthorizationCode?: unknown };
    if (typeof body.appleAuthorizationCode === 'string') appleCode = body.appleAuthorizationCode;
  } catch {
    // Corpo vazio é válido: contas de e-mail não mandam nada.
  }

  try {
    const removedFiles = await purgeStorage(admin, userId);
    const apple = appleCode ? await revokeApple(appleCode) : 'not_apple';

    if (!alreadyDeleted) {
      // Todas as tabelas de domínio referenciam auth.users com ON DELETE CASCADE; apagar o
      // usuário também invalida os refresh tokens, encerrando as sessões em todos os aparelhos.
      const { error: deleteError } = await admin.auth.admin.deleteUser(userId);
      if (deleteError && deleteError.status !== 404) throw new Error('user_delete_failed');
      alreadyDeleted = deleteError?.status === 404;
    }

    log('deleted', { removedFiles, apple, alreadyDeleted });
    return json(200, { deleted: true });
  } catch (error) {
    log('failed', { reason: error instanceof Error ? error.message : 'unknown' });
    return json(500, { error: 'server_error' });
  }
});
