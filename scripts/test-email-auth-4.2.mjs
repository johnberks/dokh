import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

// Disposable user and local Mailpit only. Never print an address, password or token.
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
const {
  API_URL: apiUrl,
  ANON_KEY: anonKey,
  SERVICE_ROLE_KEY: serviceKey,
  MAILPIT_URL: mailpitUrl,
} = localEnv;
assert.ok(apiUrl && anonKey && serviceKey && mailpitUrl, 'Supabase local must be running');
const appApiUrl =
  process.env.EXPO_PUBLIC_APP_ENV === 'local' && process.env.EXPO_PUBLIC_SUPABASE_URL
    ? process.env.EXPO_PUBLIC_SUPABASE_URL
    : apiUrl;
assert.match(appApiUrl, /^http:\/\/(?:127\.0\.0\.1|192\.168\.\d+\.\d+):(?:54321|8082)$/);

function client() {
  const values = new Map();
  return createClient(appApiUrl, anonKey, {
    auth: {
      storage: {
        getItem: async (key) => values.get(key) ?? null,
        setItem: async (key, value) => {
          values.set(key, value);
        },
        removeItem: async (key) => {
          values.delete(key);
        },
      },
      persistSession: true,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

const admin = createClient(apiUrl, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function mailLinkFor(email) {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const response = await fetch(
      `${mailpitUrl}/view/latest.txt?query=${encodeURIComponent(`to:${email}`)}`,
    );
    if (response.ok) {
      const body = await response.text();
      const link = body.match(/https?:\/\/[^\s<>"']+\/auth\/v1\/verify[^\s<>"']+/)?.[0];
      if (link) return link;
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error('Local recovery email was not captured');
}

let userId;
try {
  const email = `email-auth-test-${randomUUID()}@example.invalid`;
  const password = randomUUID();
  const newPassword = randomUUID();
  const first = client();

  const created = await first.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: 'dokh://auth-callback' },
  });
  if (created.error) throw new Error('Local signup failed');
  userId = created.data.user?.id;
  assert.ok(userId, 'Signup must create a disposable user');
  assert.ok(created.data.session, 'Local Auth has email confirmation disabled');

  const signedOut = await first.auth.signOut({ scope: 'local' });
  if (signedOut.error) throw new Error('Local logout failed');
  const second = client();
  const signedIn = await second.auth.signInWithPassword({ email, password });
  if (signedIn.error) throw new Error('Local password login failed');
  assert.equal(signedIn.data.user?.id, userId);
  await second.auth.signOut({ scope: 'local' });

  const recovery = await second.auth.resetPasswordForEmail(email, {
    redirectTo: 'dokh://reset-password',
  });
  if (recovery.error) throw new Error('Local recovery request failed');
  const verifyLink = await mailLinkFor(email);
  const verified = await fetch(verifyLink, { redirect: 'manual' });
  const callbackUrl = verified.headers.get('location');
  assert.ok(callbackUrl?.startsWith('dokh://reset-password#'), 'Recovery must redirect to the app');
  const params = new URLSearchParams(callbackUrl.split('#', 2)[1]);
  assert.equal(params.get('type'), 'recovery');
  const accessToken = params.get('access_token');
  const refreshToken = params.get('refresh_token');
  assert.ok(accessToken && refreshToken, 'Recovery redirect must contain a session');

  const resetClient = client();
  const session = await resetClient.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });
  if (session.error) throw new Error('Recovery session failed');
  const updated = await resetClient.auth.updateUser({ password: newPassword });
  if (updated.error) throw new Error('Password update failed');
  await resetClient.auth.signOut({ scope: 'local' });
  const afterReset = await client().auth.signInWithPassword({ email, password: newPassword });
  if (afterReset.error) throw new Error('Login with updated password failed');
  assert.equal(afterReset.data.user?.id, userId);
  console.log('Supabase Auth local: signup, login, recovery link and new password passed.');
} finally {
  if (userId) {
    const removed = await admin.auth.admin.deleteUser(userId);
    if (removed.error) {
      console.error('Disposable user cleanup failed');
      process.exitCode = 1;
    }
  }
}
