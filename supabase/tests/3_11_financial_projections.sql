-- Run after migrations through 3.11 in a disposable database.
begin;
insert into auth.users (id) values
  ('00000000-0000-0000-0000-000000000011'),
  ('00000000-0000-0000-0000-000000000022');
insert into public.profiles (id, display_name, professional_status, specialty, timezone) values
  ('00000000-0000-0000-0000-000000000011', 'A', 'resident', 'Cardiology', 'UTC'),
  ('00000000-0000-0000-0000-000000000022', 'B', 'general_practitioner', null, 'America/Sao_Paulo');
insert into public.work_locations (id, user_id, name, color_token) values
  ('00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000011', 'A', 'sage'),
  ('00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000022', 'B', 'blue');
insert into public.residencies (id, user_id, specialty, starts_on, expected_ends_on,
  monthly_amount_cents, payment_day) values
  ('00000000-0000-0000-0000-000000000701', '00000000-0000-0000-0000-000000000011',
    'Cardiology', '2026-01-01', '2026-01-31', 30000, 31);
insert into public.work_entries (id, user_id, type, location_id, work_date, start_time,
  duration_minutes, timezone, deleted_at) values
  ('00000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000011',
    'shift', '00000000-0000-0000-0000-000000000101', '2025-12-10', '08:00', 120, 'UTC', null),
  ('00000000-0000-0000-0000-000000000302', '00000000-0000-0000-0000-000000000011',
    'procedure', '00000000-0000-0000-0000-000000000101', '2026-01-08', null, null, 'UTC', null),
  ('00000000-0000-0000-0000-000000000303', '00000000-0000-0000-0000-000000000011',
    'appointment', '00000000-0000-0000-0000-000000000101', '2026-01-09', '14:00', 60, 'UTC', null),
  ('00000000-0000-0000-0000-000000000304', '00000000-0000-0000-0000-000000000011',
    'shift', '00000000-0000-0000-0000-000000000101', '2026-01-10', '09:00', 120, 'UTC', now()),
  ('00000000-0000-0000-0000-000000000305', '00000000-0000-0000-0000-000000000011',
    'procedure', '00000000-0000-0000-0000-000000000101', '2025-12-20', null, null, 'UTC', null),
  ('00000000-0000-0000-0000-000000000401', '00000000-0000-0000-0000-000000000022',
    'procedure', '00000000-0000-0000-0000-000000000201', '2025-12-01', null, null,
    'America/Sao_Paulo', null);
insert into public.receivables (id, user_id, work_entry_id, residency_id, competence_month,
  amount_cents, expected_on, received_at, invalidated_at) values
  ('00000000-0000-0000-0000-000000000501', '00000000-0000-0000-0000-000000000011',
    '00000000-0000-0000-0000-000000000301', null, '2025-12-01', 12000,
    '2026-01-12', '2026-02-01 12:00+00', null),
  ('00000000-0000-0000-0000-000000000502', '00000000-0000-0000-0000-000000000011',
    '00000000-0000-0000-0000-000000000302', null, '2026-01-01', 5000,
    null, null, null),
  ('00000000-0000-0000-0000-000000000503', '00000000-0000-0000-0000-000000000011',
    '00000000-0000-0000-0000-000000000303', null, '2026-01-01', 10000,
    '2026-01-20', null, null),
  ('00000000-0000-0000-0000-000000000504', '00000000-0000-0000-0000-000000000011',
    '00000000-0000-0000-0000-000000000304', null, '2026-01-01', 8000,
    '2026-01-21', null, now()),
  ('00000000-0000-0000-0000-000000000505', '00000000-0000-0000-0000-000000000011',
    '00000000-0000-0000-0000-000000000305', null, '2025-12-01', 3000,
    '2026-02-15', null, null),
  ('00000000-0000-0000-0000-000000000506', '00000000-0000-0000-0000-000000000011',
    null, '00000000-0000-0000-0000-000000000701', '2026-01-01', 30000,
    '2026-01-31', null, null),
  ('00000000-0000-0000-0000-000000000601', '00000000-0000-0000-0000-000000000022',
    '00000000-0000-0000-0000-000000000401', null, '2025-12-01', 7000,
    '2025-12-15', '2026-01-01 01:00+00', null);

do $$
begin
  assert not has_table_privilege('anon', 'public.receivable_projection', 'SELECT'),
    'anonymous view access';
  assert not has_function_privilege('anon', 'public.finance_month_projection(date)', 'EXECUTE'),
    'anonymous month RPC access';
  assert (select count(*) = 2 from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname in ('receivable_projection', 'agenda_work_projection')
      and c.reloptions @> array['security_invoker=true']),
    'projection views must invoke underlying RLS';
end $$;

set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000011', false);
do $$
declare
  v_month record;
  v_denied boolean := false;
begin
  assert (select count(*) = 6 from public.receivable_projection), 'owner receipt rows missing';
  assert (select count(*) = 4 from public.agenda_work_projection),
    'Agenda should omit deleted work and residency';
  assert (select receipt_status = 'received' from public.receivable_projection
    where receivable_id = '00000000-0000-0000-0000-000000000501');
  assert (select receipt_status = 'undated' from public.receivable_projection
    where receivable_id = '00000000-0000-0000-0000-000000000502');
  assert (select receipt_status = 'confirmation_pending' from public.receivable_projection
    where receivable_id = '00000000-0000-0000-0000-000000000503');
  assert (select receipt_status = 'invalidated' from public.receivable_projection
    where receivable_id = '00000000-0000-0000-0000-000000000504');

  select * into v_month from public.finance_month_projection('2026-01-01');
  assert v_month.has_expected_entries and v_month.expected_total_cents = 52000,
    'January expected cash is wrong';
  assert v_month.received_of_expected_cents = 12000
    and v_month.awaiting_of_expected_cents = 40000,
    'hero partition must equal expected cash';
  assert v_month.received_in_month_cents = 0,
    'February confirmation was incorrectly counted as January cash';
  assert v_month.undated_count = 1 and v_month.undated_total_cents = 5000,
    'undated item missing or incorrectly assigned to cash';
  assert v_month.work_generated_cents = 15000 and v_month.work_count = 2,
    'January work competence included residency or wrong month';
  assert v_month.work_duration_minutes = 60 and v_month.hourly_value_cents is null,
    'Free hourly analytics leaked or duration wrong';
  assert (select count(*) = 4 from public.finance_month_origins('2026-01-01')
    where amount_cents is null), 'Free origin numbers leaked';

  select * into v_month from public.finance_month_projection('2026-02-01');
  assert v_month.expected_total_cents = 3000 and v_month.received_in_month_cents = 12000,
    'cross-month receipt/expected mismatch';
  assert (select count(*) = 2 from public.finance_year_projection(2026)),
    'year should show only January and February with real entries';
  assert (select historical_month_count = 2 and historical_average_cents = 27500
    from public.finance_year_projection(2026) where month_start = '2026-01-01'),
    'historical average is wrong';
  select * into v_month from public.finance_month_projection('2026-03-01');
  assert not v_month.has_expected_entries and v_month.expected_total_cents = 0,
    'empty month must carry explicit empty flag';

  begin
    perform public.finance_month_projection('2026-01-02');
  exception when invalid_parameter_value then v_denied := true;
  end;
  assert v_denied, 'non-month boundary accepted';
end $$;
reset role;

-- Server entitlement unlocks interpretations but not the underlying Free sums.
insert into public.subscription_entitlements (
  user_id, is_active, product_id, store, environment, last_event_id
) values (
  '00000000-0000-0000-0000-000000000011', true, 'test-monthly',
  'app_store', 'sandbox', 'test-3-11'
);
set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000011', false);
do $$
begin
  assert (select hourly_value_cents = 10000
    from public.finance_month_projection('2026-01-01')),
    'Premium hourly numerator must omit no-duration work';
  assert (select amount_cents = 30000 from public.finance_month_origins('2026-01-01')
    where origin = 'residency'), 'Premium residency origin missing';
  assert (select amount_cents = 12000 from public.finance_month_origins('2026-01-01')
    where origin = 'shift'), 'Premium shift origin missing';
end $$;

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000022', false);
do $$
begin
  assert (select count(*) = 1 from public.receivable_projection), 'foreign receipts visible';
  assert (select count(*) = 1 from public.agenda_work_projection), 'foreign works visible';
  assert (select received_local_date = '2025-12-31' from public.receivable_projection),
    'local receipt date crossed year incorrectly';
  assert (select received_in_month_cents = 7000
    from public.finance_month_projection('2025-12-01')),
    'local timezone cash month incorrect';
  assert (select historical_month_count = 1 and historical_average_cents is null
    from public.finance_year_projection(2025)),
    'first month fabricated average';
end $$;
reset role;
rollback;

select '3.11 caixa, competência, statuses, Free/Premium, year and RLS passed' as result;
