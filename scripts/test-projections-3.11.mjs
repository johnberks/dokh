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
  const email = `projection-test-${randomUUID()}@example.invalid`;
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
        professional_status: 'general_practitioner',
        timezone: 'UTC',
      },
    }),
    'create disposable profile',
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
      body: { user_id: owner.id, name: 'Projection test', color_token: 'sage' },
    }),
    'create disposable location',
  )[0];

  for (const [workDate, expectedOn, amount] of [
    ['2026-01-10', '2026-02-15', 10000],
    ['2026-01-11', null, 5000],
  ]) {
    success(
      await call('/rest/v1/rpc/create_work_with_receivable', {
        method: 'POST',
        token: owner.token,
        body: {
          p_idempotency_key: randomUUID(),
          p_type: 'procedure',
          p_location_id: location.id,
          p_description: null,
          p_work_date: workDate,
          p_start_time: null,
          p_duration_minutes: null,
          p_timezone: 'UTC',
          p_amount_cents: amount,
          p_expected_on: expectedOn,
        },
      }),
      'create work and receivable',
    );
  }

  const receipts = success(
    await call('/rest/v1/receivable_projection?select=origin,receipt_status,expected_on', {
      token: owner.token,
    }),
    'owner reads receipt projection',
  );
  assert.equal(receipts.length, 2);
  assert.deepEqual(receipts.map((row) => row.receipt_status).sort(), [
    'confirmation_pending',
    'undated',
  ]);
  assert.equal(
    success(
      await call('/rest/v1/agenda_work_projection?select=work_entry_id', {
        token: owner.token,
      }),
      'owner reads Agenda projection',
    ).length,
    2,
  );
  const january = success(
    await call('/rest/v1/rpc/finance_month_projection', {
      method: 'POST',
      token: owner.token,
      body: { p_month: '2026-01-01' },
    }),
    'January projection',
  )[0];
  assert.equal(january.expected_total_cents, 0);
  assert.equal(january.work_generated_cents, 15000);
  assert.equal(january.undated_total_cents, 5000);
  assert.equal(january.hourly_value_cents, null);
  const february = success(
    await call('/rest/v1/rpc/finance_month_projection', {
      method: 'POST',
      token: owner.token,
      body: { p_month: '2026-02-01' },
    }),
    'February projection',
  )[0];
  assert.equal(february.expected_total_cents, 10000);
  assert.equal(february.work_generated_cents, 0);
  const year = success(
    await call('/rest/v1/rpc/finance_year_projection', {
      method: 'POST',
      token: owner.token,
      body: { p_year: 2026 },
    }),
    'year projection',
  );
  assert.equal(year.length, 1);
  assert.equal(year[0].historical_average_cents, null);
  assert.equal(
    success(
      await call('/rest/v1/receivable_projection?select=receivable_id', {
        token: stranger.token,
      }),
      'foreign account reads view',
    ).length,
    0,
  );
  const anonymous = await call('/rest/v1/receivable_projection?select=receivable_id');
  assert.ok(!anonymous.response.ok, 'anonymous caller must not read projection views');
  console.log('3.11 PostgREST cash/competence, empty history and invoker RLS passed');
} finally {
  for (const id of users) {
    success(
      await call(`/auth/v1/admin/users/${id}`, { method: 'DELETE', token: serviceKey }),
      'cleanup disposable user',
    );
  }
}
