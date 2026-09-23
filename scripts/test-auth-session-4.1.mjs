import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

// Local integration only. The service key is read at runtime for disposable-user cleanup
// and is never imported by the mobile application or written to the repository.
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

const values = new Map();
const storage = {
  getItem: async (key) => values.get(key) ?? null,
  setItem: async (key, value) => {
    values.set(key, value);
  },
  removeItem: async (key) => {
    values.delete(key);
  },
};
const authOptions = {
  storage,
  storageKey: 'dokh.local.auth',
  persistSession: true,
  autoRefreshToken: true,
  detectSessionInUrl: false,
};
const appClient = () => createClient(apiUrl, anonKey, { auth: authOptions });
const admin = createClient(apiUrl, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

let userId;
try {
  const email = `auth-session-test-${randomUUID()}@example.invalid`;
  const password = randomUUID();
  const created = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  assert.ifError(created.error);
  userId = created.data.user?.id;
  assert.ok(userId, 'Disposable user was not created');

  const first = appClient();
  const signedIn = await first.auth.signInWithPassword({ email, password });
  assert.ifError(signedIn.error);
  assert.equal(signedIn.data.user?.id, userId);
  assert.ok(values.has(authOptions.storageKey), 'Session must persist in the supplied storage');

  const reopened = appClient();
  const restored = await reopened.auth.getSession();
  assert.ifError(restored.error);
  assert.equal(restored.data.session?.user.id, userId);

  const signedOut = await reopened.auth.signOut({ scope: 'local' });
  assert.ifError(signedOut.error);
  assert.equal(values.has(authOptions.storageKey), false, 'Logout must remove persisted session');
  assert.equal((await appClient().auth.getSession()).data.session, null);
  console.log('Supabase Auth local: login, restore, local logout and cleanup passed.');
} finally {
  if (userId) {
    const removed = await admin.auth.admin.deleteUser(userId);
    assert.ifError(removed.error);
  }
}
