import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

// 4.6 — exercises the real Edge Function against local Supabase: data, Storage and Auth are
// removed, the session stops working and a repeated call is harmless. Needs
// `npx supabase functions serve` (or a `supabase start` that already knew the function).
const status = execFileSync('node_modules/.bin/supabase', ['status', '-o', 'env'], {
  encoding: 'utf8',
  env: { ...process.env, SUPABASE_TELEMETRY_DISABLED: '1' },
});
const localEnv = Object.fromEntries(
  status
    .trim()
    .split('\n')
    .map((line) => {
      const separator = line.indexOf('=');
      return [
        line.slice(0, separator),
        line
          .slice(separator + 1)
          .trim()
          .replace(/^"|"$/g, ''),
      ];
    }),
);
const { API_URL: apiUrl, ANON_KEY: anonKey, SERVICE_ROLE_KEY: serviceKey } = localEnv;
assert.ok(apiUrl && anonKey && serviceKey, 'Supabase local must be running');

const admin = createClient(apiUrl, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const OWNED_TABLES = [
  'device_push_tokens',
  'import_issues',
  'imports',
  'notification_preferences',
  'profiles',
  'receivables',
  'residencies',
  'subscription_entitlements',
  'work_entries',
  'work_locations',
  'work_preferences',
  'work_series',
];

function ownedRows(userId) {
  const counts = OWNED_TABLES.map(
    (table) => `(select count(*) from public.${table} where user_id = '${userId}')`,
  ).join(' + ');
  const sql = `select ${counts} + (select count(*) from storage.objects where (storage.foldername(name))[1] = '${userId}') + (select count(*) from auth.users where id = '${userId}')`;
  return Number(
    execFileSync('docker', ['exec', 'supabase_db_dokh', 'psql', '-U', 'postgres', '-Atc', sql], {
      encoding: 'utf8',
    }).trim(),
  );
}

async function deleteAccount(token, body) {
  const response = await fetch(new URL('/functions/v1/delete-account', apiUrl), {
    method: 'POST',
    headers: {
      apikey: anonKey,
      authorization: `Bearer ${token}`,
      'content-type': 'application/json',
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return { status: response.status, body: await response.json().catch(() => null) };
}

let userId;
let strangerId;
try {
  // A second account proves the function only touches the caller's data.
  const stranger = await admin.auth.admin.createUser({
    email: `delete-stranger-${randomUUID()}@example.invalid`,
    password: randomUUID(),
    email_confirm: true,
  });
  assert.ifError(stranger.error);
  strangerId = stranger.data.user.id;
  const strangerLocation = await admin.from('work_locations').insert({
    user_id: strangerId,
    name: 'Outro hospital',
    color_token: 'sage',
  });
  assert.ifError(strangerLocation.error);
  const strangerBefore = ownedRows(strangerId);

  const email = `delete-account-${randomUUID()}@example.invalid`;
  const password = randomUUID();
  const created = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  assert.ifError(created.error);
  userId = created.data.user.id;

  const client = createClient(apiUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const signedIn = await client.auth.signInWithPassword({ email, password });
  assert.ifError(signedIn.error);
  const token = signedIn.data.session.access_token;

  const profile = await client.from('profiles').insert({
    id: userId,
    display_name: 'Teste',
    professional_status: 'general_practitioner',
    timezone: 'America/Sao_Paulo',
  });
  assert.ifError(profile.error);
  // Locations are written through RPCs in the app; the fixture uses the service role.
  const location = await admin
    .from('work_locations')
    .insert({ user_id: userId, name: 'Hospital', color_token: 'sage' });
  assert.ifError(location.error);
  const upload = await client.storage
    .from('avatars')
    .upload(
      `${userId}/${randomUUID()}.png`,
      new Blob([new Uint8Array([137, 80, 78, 71])], { type: 'image/png' }),
      {
        contentType: 'image/png',
      },
    );
  assert.ifError(upload.error);
  assert.ok(ownedRows(userId) >= 4, 'fixture must own auth, profile, location and a file');

  assert.equal((await deleteAccount(anonKey)).status, 401, 'anon key is not a user');
  assert.equal((await deleteAccount('not-a-jwt')).status, 401, 'garbage token is rejected');

  const first = await deleteAccount(token);
  assert.deepEqual(first, { status: 200, body: { deleted: true } });
  assert.equal(ownedRows(userId), 0, 'no data, file or auth user may remain');

  // Refresh tokens died with the user: the session cannot be renewed.
  const refreshed = await client.auth.refreshSession({
    refresh_token: signedIn.data.session.refresh_token,
  });
  assert.ok(refreshed.error, 'refresh after deletion must fail');

  const repeated = await deleteAccount(token);
  assert.deepEqual(repeated, { status: 200, body: { deleted: true } }, 'repeat is idempotent');

  assert.equal(ownedRows(strangerId), strangerBefore, "another account's data is untouched");
  userId = undefined;
  console.log('4.6 delete-account: data, Storage, Auth, session and idempotency passed.');
} finally {
  if (userId) await admin.auth.admin.deleteUser(userId);
  if (strangerId) await admin.auth.admin.deleteUser(strangerId);
}
