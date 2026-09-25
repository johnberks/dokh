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
  assert.ok(result.response.ok, `${label}: HTTP ${result.response.status}`);
  return result.data;
}

const users = [];
async function createUser() {
  const email = `work-rpc-test-${randomUUID()}@example.invalid`;
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
      body: { user_id: owner.id, name: 'Test location', color_token: 'sage' },
    }),
    'create disposable location',
  )[0];

  const key = randomUUID();
  const payload = {
    p_idempotency_key: key,
    p_type: 'procedure',
    p_location_id: location.id,
    p_description: null,
    p_work_date: '2026-09-22',
    p_start_time: null,
    p_duration_minutes: null,
    p_timezone: 'America/Sao_Paulo',
    p_amount_cents: 12345,
    p_expected_on: null,
  };
  const [first, repeated] = await Promise.all([
    call('/rest/v1/rpc/create_work_with_receivable', {
      method: 'POST',
      token: owner.token,
      body: payload,
    }),
    call('/rest/v1/rpc/create_work_with_receivable', {
      method: 'POST',
      token: owner.token,
      body: payload,
    }),
  ]);
  const firstRow = success(first, 'first concurrent create')[0];
  const repeatedRow = success(repeated, 'second concurrent create')[0];
  assert.deepEqual(repeatedRow, firstRow, 'concurrent retry must return the same IDs');

  const work = success(
    await call(`/rest/v1/work_entries?select=id,work_date,deleted_at&user_id=eq.${owner.id}`, {
      token: owner.token,
    }),
    'owner reads work',
  );
  assert.equal(work.length, 1);
  assert.equal(work[0].id, firstRow.work_id);
  const receivables = success(
    await call(`/rest/v1/receivables?select=id,work_entry_id,expected_on&user_id=eq.${owner.id}`, {
      token: owner.token,
    }),
    'owner reads receivable',
  );
  assert.equal(receivables.length, 1);
  assert.equal(receivables[0].id, firstRow.receivable_id);
  assert.equal(receivables[0].expected_on, null);

  const denied = await call('/rest/v1/rpc/delete_work_with_receivable', {
    method: 'POST',
    token: stranger.token,
    body: { p_idempotency_key: randomUUID(), p_work_entry_id: firstRow.work_id },
  });
  assert.ok(!denied.response.ok, 'foreign account must not delete work');

  const deleted = success(
    await call('/rest/v1/rpc/delete_work_with_receivable', {
      method: 'POST',
      token: owner.token,
      body: { p_idempotency_key: randomUUID(), p_work_entry_id: firstRow.work_id },
    }),
    'owner deletes aggregate',
  )[0];
  assert.deepEqual(deleted, firstRow);
  console.log('3.7 PostgREST RPC, concurrent retry, ownership and delete passed');
} finally {
  for (const id of users) {
    success(
      await call(`/auth/v1/admin/users/${id}`, { method: 'DELETE', token: serviceKey }),
      'cleanup disposable user',
    );
  }
}
