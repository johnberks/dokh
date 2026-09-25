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
  const email = `residency-test-${randomUUID()}@example.invalid`;
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
  success(
    await call('/rest/v1/profiles', {
      method: 'POST',
      token: serviceKey,
      body: {
        id: created.id,
        display_name: 'Test',
        professional_status: 'resident',
        specialty: 'Cardiology',
        timezone: 'America/Sao_Paulo',
      },
    }),
    'create disposable profile',
  );
  return { id: created.id, token: session.access_token };
}

try {
  const owner = await createUser();
  const stranger = await createUser();
  const path = '/rest/v1/rpc/create_or_update_residency';
  const payload = {
    p_residency_id: null,
    p_specialty: 'Cardiology',
    p_institution: 'Test institution',
    p_level_label: 'R1',
    p_starts_on: '2025-01-01',
    p_expected_ends_on: '2025-03-31',
    p_monthly_amount_cents: 12345,
    p_payment_day: 31,
  };
  const [first, concurrent] = await Promise.all([
    call(path, { method: 'POST', token: owner.token, body: payload }),
    call(path, { method: 'POST', token: owner.token, body: payload }),
  ]);
  const firstRow = success(first, 'first concurrent residency create')[0];
  const concurrentRow = success(concurrent, 'second concurrent residency create')[0];
  assert.equal(concurrentRow.residency_id, firstRow.residency_id);
  assert.deepEqual(
    [firstRow.receivables_changed, concurrentRow.receivables_changed].sort(),
    [0, 3],
  );

  const receivables = success(
    await call(
      `/rest/v1/receivables?select=competence_month,expected_on&residency_id=eq.${firstRow.residency_id}&order=competence_month`,
      {
        token: owner.token,
      },
    ),
    'owner reads residency receivables',
  );
  assert.deepEqual(
    receivables.map(({ competence_month, expected_on }) => [competence_month, expected_on]),
    [
      ['2025-01-01', '2025-01-31'],
      ['2025-02-01', '2025-02-28'],
      ['2025-03-01', '2025-03-31'],
    ],
  );
  const foreign = await call('/rest/v1/rpc/generate_residency_receivables', {
    method: 'POST',
    token: stranger.token,
    body: { p_residency_id: firstRow.residency_id },
  });
  assert.ok(!foreign.response.ok, 'another account must not generate owner receivables');
  const anonymous = await call(path, { method: 'POST', body: payload });
  assert.ok(!anonymous.response.ok, 'anonymous caller must not create a residency');
  assert.equal(
    success(
      await call('/rest/v1/rpc/deactivate_residency', {
        method: 'POST',
        token: owner.token,
        body: { p_residency_id: firstRow.residency_id },
      }),
      'owner deactivates residency',
    ),
    firstRow.residency_id,
  );
  console.log('3.9 PostgREST concurrent create, calendar dates, ownership and deactivation passed');
} finally {
  for (const id of users) {
    success(
      await call(`/auth/v1/admin/users/${id}`, { method: 'DELETE', token: serviceKey }),
      'cleanup disposable user',
    );
  }
}
