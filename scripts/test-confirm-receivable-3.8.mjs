import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';

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
assert.ok(apiUrl && anonKey && serviceKey, 'Supabase local API and keys are required');

async function call(path, { method = 'GET', token = anonKey, body, prefer } = {}) {
  const response = await fetch(new URL(path, apiUrl), {
    method,
    headers: {
      apikey: token === serviceKey ? serviceKey : anonKey,
      authorization: `Bearer ${token}`,
      'content-type': 'application/json',
      ...(prefer ? { prefer } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await response.json().catch(() => null);
  return { response, data };
}

function success(result, label) {
  assert.ok(
    result.response.ok,
    `${label}: HTTP ${result.response.status} ${JSON.stringify(result.data)}`,
  );
  return result.data;
}

const users = [];
async function createUser() {
  const email = `receipt-test-${randomUUID()}@example.invalid`;
  const password = randomUUID();
  const created = success(
    await call('/auth/v1/admin/users', {
      method: 'POST',
      token: serviceKey,
      body: { email, password, email_confirm: true },
    }),
    'create disposable user',
  );
  users.push(created.id);
  const session = success(
    await call('/auth/v1/token?grant_type=password', {
      method: 'POST',
      body: { email, password },
    }),
    'sign in disposable user',
  );
  return { id: created.id, token: session.access_token };
}

try {
  const owner = await createUser();
  const stranger = await createUser();
  const location = success(
    await call('/rest/v1/work_locations?select=id', {
      method: 'POST',
      token: serviceKey,
      prefer: 'return=representation',
      body: { user_id: owner.id, name: 'Receipt test location', color_token: 'sage' },
    }),
    'create disposable location',
  )[0];
  const created = success(
    await call('/rest/v1/rpc/create_work_with_receivable', {
      method: 'POST',
      token: owner.token,
      body: {
        p_idempotency_key: randomUUID(),
        p_type: 'procedure',
        p_location_id: location.id,
        p_description: null,
        p_work_date: '2026-09-22',
        p_start_time: null,
        p_duration_minutes: null,
        p_timezone: 'America/Sao_Paulo',
        p_amount_cents: 12345,
        p_expected_on: null,
      },
    }),
    'create work with receivable',
  )[0];
  const receiptPath = '/rest/v1/rpc/confirm_receivable_received';
  const payload = { p_receivable_id: created.receivable_id };
  const [first, concurrent] = await Promise.all([
    call(receiptPath, { method: 'POST', token: owner.token, body: payload }),
    call(receiptPath, { method: 'POST', token: owner.token, body: payload }),
  ]);
  const firstRow = success(first, 'first concurrent receipt confirmation')[0];
  const concurrentRow = success(concurrent, 'second concurrent receipt confirmation')[0];
  assert.deepEqual(concurrentRow, firstRow, 'concurrent retry must preserve the first timestamp');
  assert.equal(firstRow.receivable_id, created.receivable_id);
  assert.ok(
    Number.isFinite(Date.parse(firstRow.received_at)),
    'confirmation timestamp must be valid',
  );

  const persisted = success(
    await call(
      `/rest/v1/receivables?select=id,received_at,expected_on&id=eq.${created.receivable_id}`,
      { token: owner.token },
    ),
    'owner reads confirmed receivable',
  )[0];
  assert.equal(persisted.received_at, firstRow.received_at);
  assert.equal(persisted.expected_on, null, 'confirmation must not alter the due date');

  const repeated = success(
    await call(receiptPath, { method: 'POST', token: owner.token, body: payload }),
    'later receipt retry',
  )[0];
  assert.deepEqual(repeated, firstRow);
  const foreign = await call(receiptPath, { method: 'POST', token: stranger.token, body: payload });
  assert.ok(!foreign.response.ok, 'another user must not confirm this receivable');
  const anonymous = await call(receiptPath, { method: 'POST', body: payload });
  assert.ok(!anonymous.response.ok, 'anonymous caller must not confirm a receivable');
  console.log('3.8 PostgREST concurrent receipt confirmation, ownership and audit passed');
} finally {
  for (const id of users) {
    success(
      await call(`/auth/v1/admin/users/${id}`, { method: 'DELETE', token: serviceKey }),
      'cleanup disposable user',
    );
  }
}
