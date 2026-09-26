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
  const email = `location-rpc-test-${randomUUID()}@example.invalid`;
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

  // Como no app, o perfil existe antes do primeiro Trabalho: a projeção de Recebíveis
  // (valor e previsão na Agenda) depende dele para o fuso.
  success(
    await call('/rest/v1/profiles', {
      method: 'POST',
      token: owner.token,
      body: {
        id: owner.id,
        display_name: 'Owner',
        professional_status: 'general_practitioner',
        timezone: 'America/Sao_Paulo',
      },
    }),
    'owner creates profile',
  );

  // Regressão da 7.4: o cliente não escreve direto na tabela (3.5 fecha DML)...
  const direct = await call('/rest/v1/work_locations', {
    method: 'POST',
    token: owner.token,
    body: { user_id: owner.id, name: 'Direto', color_token: 'sage' },
  });
  assert.equal(direct.response.status, 403, 'direct insert must stay closed to clients');

  // ...e o caminho do app — criar Local pela RPC e o Trabalho em seguida — funciona.
  const location = success(
    await call('/rest/v1/rpc/create_work_location', {
      method: 'POST',
      token: owner.token,
      body: {
        p_name: '  Hospital São Lucas ',
        p_city: null,
        p_color_token: 'sage',
        p_color_source: 'automatic',
      },
    }),
    'owner creates location through RPC',
  );
  assert.equal(location.user_id, owner.id);
  assert.equal(location.name, 'Hospital São Lucas');

  const work = success(
    await call('/rest/v1/rpc/create_work_with_receivable', {
      method: 'POST',
      token: owner.token,
      body: {
        p_idempotency_key: randomUUID(),
        p_type: 'shift',
        p_location_id: location.id,
        p_description: null,
        p_work_date: '2026-09-26',
        p_start_time: '19:00',
        p_duration_minutes: 720,
        p_timezone: 'America/Sao_Paulo',
        p_amount_cents: 120000,
        p_expected_on: '2026-10-26',
      },
    }),
    'owner creates first work at the new location',
  )[0];
  assert.ok(work.work_id);

  // Pontos do seletor de data (Agenda 08): mesma consulta do app, pela view com RLS do dono.
  const dots = success(
    await call(
      '/rest/v1/agenda_work_projection?select=work_date,color_token,start_time&work_date=gte.2026-09-01&work_date=lt.2026-10-01&order=work_date.asc,start_time.asc.nullslast',
      { token: owner.token },
    ),
    'owner reads month dots',
  );
  assert.deepEqual(dots, [
    { work_date: '2026-09-26', color_token: 'sage', start_time: '19:00:00' },
  ]);
  // Agenda 8.1/8.2: mesma consulta do mês e do detalhe que o app faz.
  const agendaMonth = success(
    await call(
      '/rest/v1/agenda_work_projection?select=work_entry_id,work_date,start_time,duration_minutes,type,description,location_name,color_token,amount_cents,expected_on,receipt_status&work_date=gte.2026-09-01&work_date=lt.2026-10-01&order=work_date.asc,start_time.asc.nullslast,created_at.asc',
      { token: owner.token },
    ),
    'owner reads agenda month',
  );
  assert.equal(agendaMonth.length, 1);
  assert.equal(agendaMonth[0].work_entry_id, work.work_id);
  assert.equal(agendaMonth[0].location_name, 'Hospital São Lucas');
  assert.equal(agendaMonth[0].receipt_status, 'scheduled');

  // "Usar novamente" (6.6): mesma leitura do app — histórico pela view e Locais ativos.
  const history = success(
    await call(
      '/rest/v1/agenda_work_projection?select=work_entry_id,location_id,location_name,color_token,type,work_date,start_time,duration_minutes,amount_cents,expected_on&order=work_date.desc,created_at.desc&limit=200',
      { token: owner.token },
    ),
    'owner reads template history',
  );
  assert.equal(history.length, 1);
  assert.equal(history[0].location_id, location.id);
  assert.equal(history[0].amount_cents, 120000);
  assert.equal(history[0].expected_on, '2026-10-26');
  const activeLocations = success(
    await call('/rest/v1/work_locations?select=id&archived_at=is.null', { token: owner.token }),
    'owner reads active locations',
  );
  assert.deepEqual(activeLocations, [{ id: location.id }]);

  const strangerDots = success(
    await call(
      '/rest/v1/agenda_work_projection?select=work_date&work_date=gte.2026-09-01&work_date=lt.2026-10-01',
      { token: stranger.token },
    ),
    'stranger reads month dots',
  );
  assert.equal(strangerDots.length, 0, 'month dots must not leak across accounts');

  const premium = await call('/rest/v1/rpc/create_work_location', {
    method: 'POST',
    token: owner.token,
    body: {
      p_name: 'Clínica',
      p_city: null,
      p_color_token: 'terra',
      p_color_source: 'premium_palette',
    },
  });
  assert.ok(!premium.response.ok, 'premium palette requires an entitlement');

  const foreign = await call('/rest/v1/rpc/archive_work_location', {
    method: 'POST',
    token: stranger.token,
    body: { p_location_id: location.id },
  });
  assert.ok(!foreign.response.ok, 'foreign account must not archive location');

  // Finanças 9.2: mesmas consultas do app para o mês da entrada (out/2026), plano Free.
  const financeMonth = success(
    await call('/rest/v1/rpc/finance_month_projection', {
      method: 'POST',
      token: owner.token,
      body: { p_month: '2026-10-01' },
    }),
    'owner reads finance month',
  )[0];
  assert.equal(financeMonth.has_expected_entries, true);
  assert.equal(Number(financeMonth.expected_total_cents), 120000);
  assert.equal(financeMonth.hourly_value_cents, null, 'Free never receives hourly value');
  const financeYear = success(
    await call('/rest/v1/rpc/finance_year_projection', {
      method: 'POST',
      token: owner.token,
      body: { p_year: 2026 },
    }),
    'owner reads finance year',
  );
  assert.deepEqual(
    financeYear.map((row) => [row.month_start, Number(row.expected_total_cents)]),
    [['2026-10-01', 120000]],
    'year series has only months with real entries',
  );
  const origins = success(
    await call('/rest/v1/rpc/finance_month_origins', {
      method: 'POST',
      token: owner.token,
      body: { p_month: '2026-10-01' },
    }),
    'owner reads finance origins',
  );
  assert.deepEqual(
    origins.map((row) => row.amount_cents),
    [null, null, null, null],
    'Free never receives origin amounts',
  );
  const nextEntry = success(
    await call(
      '/rest/v1/receivable_projection?select=receivable_id,work_entry_id,origin,amount_cents,expected_on&expected_on=gte.2026-10-01&expected_on=lt.2026-11-01&received_at=is.null&invalidated_at=is.null&work_deleted_at=is.null&order=expected_on.asc&limit=1',
      { token: owner.token },
    ),
    'owner reads next entry',
  );
  assert.equal(nextEntry.length, 1);
  assert.equal(nextEntry[0].origin, 'shift');
  assert.equal(nextEntry[0].expected_on, '2026-10-26');
  const entitlement = success(
    await call('/rest/v1/subscription_entitlements?select=is_active,expires_at', {
      token: owner.token,
    }),
    'owner reads own entitlement',
  );
  assert.deepEqual(entitlement, [], 'no entitlement means Free');
  const undated = success(
    await call(
      '/rest/v1/agenda_work_projection?select=work_entry_id&receipt_status=eq.undated&order=work_date.asc&limit=2',
      { token: owner.token },
    ),
    'owner reads undated previews',
  );
  assert.deepEqual(undated, []);

  // Premium ativo (espelho do servidor): valor/hora e origens passam a vir com números.
  success(
    await call('/rest/v1/subscription_entitlements', {
      method: 'POST',
      token: serviceKey,
      body: {
        user_id: owner.id,
        is_active: true,
        product_id: 'dokh_premium_test',
        store: 'app_store',
        environment: 'sandbox',
        last_event_id: `test-${randomUUID()}`,
      },
    }),
    'service grants test entitlement',
  );
  const premiumWorkMonth = success(
    await call('/rest/v1/rpc/finance_month_projection', {
      method: 'POST',
      token: owner.token,
      body: { p_month: '2026-09-01' },
    }),
    'premium reads work month',
  )[0];
  assert.equal(Number(premiumWorkMonth.hourly_value_cents), 10000, 'R$ 1.200 in 12h = R$ 100/h');
  const premiumOrigins = success(
    await call('/rest/v1/rpc/finance_month_origins', {
      method: 'POST',
      token: owner.token,
      body: { p_month: '2026-10-01' },
    }),
    'premium reads origins',
  );
  assert.equal(Number(premiumOrigins.find((row) => row.origin === 'shift').amount_cents), 120000);
  const premiumEntitlement = success(
    await call('/rest/v1/subscription_entitlements?select=is_active,expires_at', {
      token: owner.token,
    }),
    'owner reads premium entitlement',
  );
  assert.deepEqual(premiumEntitlement, [{ is_active: true, expires_at: null }]);

  // Editar (Agenda 16): mesmos argumentos do app; Agenda reflete o novo valor e a nova data.
  const foreignUpdate = await call('/rest/v1/rpc/update_work_with_receivable', {
    method: 'POST',
    token: stranger.token,
    body: {
      p_idempotency_key: randomUUID(),
      p_work_entry_id: work.work_id,
      p_type: 'shift',
      p_location_id: location.id,
      p_description: null,
      p_work_date: '2026-09-27',
      p_start_time: '07:00',
      p_duration_minutes: 720,
      p_timezone: 'America/Sao_Paulo',
      p_amount_cents: 1,
      p_expected_on: null,
    },
  });
  assert.ok(!foreignUpdate.response.ok, 'foreign account must not edit work');
  success(
    await call('/rest/v1/rpc/update_work_with_receivable', {
      method: 'POST',
      token: owner.token,
      body: {
        p_idempotency_key: randomUUID(),
        p_work_entry_id: work.work_id,
        p_type: 'shift',
        p_location_id: location.id,
        p_description: null,
        p_work_date: '2026-09-27',
        p_start_time: '07:00',
        p_duration_minutes: 720,
        p_timezone: 'America/Sao_Paulo',
        p_amount_cents: 150000,
        p_expected_on: '2026-10-27',
      },
    }),
    'owner edits work',
  );
  const edited = success(
    await call(
      `/rest/v1/agenda_work_projection?select=work_date,start_time,amount_cents,expected_on&work_entry_id=eq.${work.work_id}`,
      { token: owner.token },
    ),
    'owner reads edited work',
  );
  assert.deepEqual(edited, [
    {
      work_date: '2026-09-27',
      start_time: '07:00:00',
      amount_cents: 150000,
      expected_on: '2026-10-27',
    },
  ]);

  // Excluir (Agenda 15): mesma chamada do app; some da Agenda e das projeções de Finanças.
  const foreignDelete = await call('/rest/v1/rpc/delete_work_with_receivable', {
    method: 'POST',
    token: stranger.token,
    body: { p_work_entry_id: work.work_id, p_idempotency_key: randomUUID() },
  });
  assert.ok(!foreignDelete.response.ok, 'foreign account must not delete work');
  success(
    await call('/rest/v1/rpc/delete_work_with_receivable', {
      method: 'POST',
      token: owner.token,
      body: { p_work_entry_id: work.work_id, p_idempotency_key: randomUUID() },
    }),
    'owner deletes work',
  );
  const afterDelete = success(
    await call(
      '/rest/v1/agenda_work_projection?select=work_entry_id&work_date=gte.2026-09-01&work_date=lt.2026-10-01',
      { token: owner.token },
    ),
    'owner reads agenda after delete',
  );
  assert.equal(afterDelete.length, 0, 'deleted work must leave the agenda');
  const financeAfterDelete = success(
    await call('/rest/v1/rpc/finance_month_projection', {
      method: 'POST',
      token: owner.token,
      body: { p_month: '2026-10-01' },
    }),
    'owner reads finances after delete',
  );
  assert.equal(
    Number(financeAfterDelete[0].expected_total_cents),
    0,
    'deleted work must leave finances',
  );

  success(
    await call('/rest/v1/rpc/update_work_location', {
      method: 'POST',
      token: owner.token,
      body: {
        p_location_id: location.id,
        p_name: 'HSL',
        p_city: 'Recife',
        p_color_token: 'bronze',
        p_color_source: 'free_palette',
      },
    }),
    'owner updates location',
  );
  success(
    await call('/rest/v1/rpc/archive_work_location', {
      method: 'POST',
      token: owner.token,
      body: { p_location_id: location.id },
    }),
    'owner archives location',
  );
  console.log(
    '6.1 location RPCs through PostgREST, first work flow, agenda month, finance month and year (Free and Premium), edit, delete from agenda and finances, month dots, template history, palette and ownership passed',
  );
} finally {
  for (const id of users) {
    success(
      await call(`/auth/v1/admin/users/${id}`, { method: 'DELETE', token: serviceKey }),
      'cleanup disposable user',
    );
  }
}
