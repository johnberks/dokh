-- Run after migrations through 3.9 in a disposable database.
begin;

insert into auth.users (id) values
  ('00000000-0000-0000-0000-000000000011'),
  ('00000000-0000-0000-0000-000000000022');
insert into public.profiles (id, display_name, professional_status, specialty, timezone) values
  ('00000000-0000-0000-0000-000000000011', 'A', 'resident', 'Cardiology', 'UTC'),
  ('00000000-0000-0000-0000-000000000022', 'B', 'resident', 'Neurology', 'UTC');

do $$
begin
  assert has_function_privilege('authenticated',
    'public.create_or_update_residency(uuid,text,text,text,date,date,bigint,smallint)', 'EXECUTE');
  assert not has_function_privilege('anon',
    'public.create_or_update_residency(uuid,text,text,text,date,date,bigint,smallint)', 'EXECUTE');
  assert not has_function_privilege('service_role',
    'public.generate_residency_receivables(uuid)', 'EXECUTE');
  assert not has_function_privilege('authenticated',
    'private.extend_all_residency_receivables()', 'EXECUTE');
  assert (select count(*) = 3 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname in
      ('create_or_update_residency', 'generate_residency_receivables', 'deactivate_residency')
      and p.prosecdef and p.proconfig @> array['search_path=""']),
    'public residency RPCs need definer role and empty search path';
end $$;

set role anon;
do $$
declare v_denied boolean := false;
begin
  begin
    perform public.create_or_update_residency(null, 'A', null, null,
      '2024-01-01', null, 10000, 31::smallint);
  exception when insufficient_privilege then v_denied := true;
  end;
  assert v_denied, 'anonymous account created residency';
end $$;
reset role;

set role authenticated;
do $$
declare v_denied boolean := false;
begin
  begin
    perform public.create_or_update_residency(null, 'A', null, null,
      '2024-01-01', null, 10000, 31::smallint);
  exception when insufficient_privilege then v_denied := true;
  end;
  assert v_denied, 'session without JWT subject created residency';
end $$;

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000011', false);
do $$
declare
  v_residency_id uuid;
  v_result record;
  v_created_at timestamptz;
  v_denied boolean := false;
begin
  select * into v_result from public.create_or_update_residency(
    null, 'Cardiology', 'Hospital', 'R1', '2024-01-15', '2025-03-20', 12345, 31::smallint
  );
  v_residency_id := v_result.residency_id;
  assert v_result.receivables_changed = 15, 'bounded residency should create 15 months';
  assert (select count(*) = 15 from public.receivables where residency_id = v_residency_id),
    'month count incorrect';
  assert (select expected_on = '2024-01-31' from public.receivables
    where residency_id = v_residency_id and competence_month = '2024-01-01'), 'January 31 missing';
  assert (select expected_on = '2024-02-29' from public.receivables
    where residency_id = v_residency_id and competence_month = '2024-02-01'), 'leap February not clamped';
  assert (select expected_on = '2024-03-31' from public.receivables
    where residency_id = v_residency_id and competence_month = '2024-03-01'), 'March 31 missing';
  assert (select expected_on = '2025-02-28' from public.receivables
    where residency_id = v_residency_id and competence_month = '2025-02-01'), 'ordinary February not clamped';
  assert (select count(*) = 0 from public.work_series), 'Free residency created work_series';
  assert (select count(*) = 0 from public.subscription_entitlements), 'Free residency checked/wrote entitlement';
  assert (select count(*) = 0 from public.work_entries), 'residency appeared as work';
  select created_at into v_created_at from public.residencies where id = v_residency_id;
  perform set_config('test.first_residency_id', v_residency_id::text, false);

  select * into v_result from public.create_or_update_residency(
    null, 'Cardiology', 'Hospital', 'R1', '2024-01-15', '2025-03-20', 12345, 31::smallint
  );
  assert v_result.residency_id = v_residency_id and v_result.receivables_changed = 0,
    'retry duplicated/modified residency';
  assert (select created_at = v_created_at from public.residencies where id = v_residency_id);

  begin
    perform public.create_or_update_residency(null, 'Cardiology', null, null,
      '2024-01-01', null, 0, 31::smallint);
  exception when check_violation then v_denied := true;
  end;
  assert v_denied, 'invalid amount accepted';
  assert (select count(*) = 15 from public.receivables where residency_id = v_residency_id),
    'failed edit partially changed aggregate';
end $$;

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000022', false);
do $$
declare v_denied boolean := false;
begin
  assert (select count(*) = 0 from public.residencies), 'foreign residency visible';
  begin
    perform public.generate_residency_receivables(
      current_setting('test.first_residency_id')::uuid
    );
  exception when no_data_found then v_denied := true;
  end;
  assert v_denied, 'other owner generated receivables';
  v_denied := false;
  begin
    perform public.create_or_update_residency(
      current_setting('test.first_residency_id')::uuid,
      'Neurology', null, null, '2024-01-01', null, 20000, 15::smallint
    );
  exception when no_data_found then v_denied := true;
  end;
  assert v_denied, 'other owner edited residency';
  v_denied := false;
  begin
    perform public.deactivate_residency(current_setting('test.first_residency_id')::uuid);
  exception when no_data_found then v_denied := true;
  end;
  assert v_denied, 'other owner deactivated residency';
end $$;
reset role;

-- Use a second owner to test the rolling unbounded horizon and future edits.
set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000022', false);
do $$
declare
  v_residency_id uuid;
  v_result record;
  v_today date := (transaction_timestamp() at time zone 'UTC')::date;
  v_start date := (date_trunc('month', (transaction_timestamp() at time zone 'UTC')) + interval '1 month')::date;
  v_first_month date := (date_trunc('month', (transaction_timestamp() at time zone 'UTC')) + interval '1 month')::date;
  v_received_id uuid;
  v_received_at timestamptz;
  v_received_amount bigint;
  v_received_due date;
  v_denied boolean := false;
begin
  select * into v_result from public.create_or_update_residency(
    null, 'Neurology', null, 'R2', v_start, null, 30000, 31::smallint
  );
  v_residency_id := v_result.residency_id;
  assert (select count(*) = 12 from public.receivables where residency_id = v_residency_id),
    'unbounded start-next-month should materialize 12 future months';
  assert public.generate_residency_receivables(v_residency_id) = 0,
    'repeat generation changed rows';
  assert (select expected_on = (v_first_month + interval '1 month - 1 day')::date
    from public.receivables where residency_id = v_residency_id
    and competence_month = v_first_month), 'payment day 31 not clamped';

  select id into v_received_id from public.receivables
  where residency_id = v_residency_id and competence_month = v_first_month;
  select received_at into v_received_at
  from public.confirm_receivable_received(v_received_id);
  select amount_cents, expected_on into v_received_amount, v_received_due
  from public.receivables where id = v_received_id;

  select * into v_result from public.create_or_update_residency(
    v_residency_id, 'Neurology', null, 'R3', v_start, null, 40000, 15::smallint
  );
  assert v_result.residency_id = v_residency_id;
  assert (select amount_cents = v_received_amount and expected_on = v_received_due
    and received_at = v_received_at and invalidated_at is null
    from public.receivables where id = v_received_id), 'received history changed';
  assert (select count(*) = 11 from public.receivables
    where residency_id = v_residency_id and received_at is null
      and amount_cents = 40000 and extract(day from expected_on) = 15),
    'future unreceived months were not reconciled';

  select * into v_result from public.create_or_update_residency(
    v_residency_id, 'Neurology', null, 'R3', v_start, v_start, 40000, 15::smallint
  );
  assert (select count(*) = 11 from public.receivables where residency_id = v_residency_id
    and invalidated_at is not null), 'shortened end did not invalidate future';
  assert (select invalidated_at is null from public.receivables where id = v_received_id),
    'shortened end invalidated received month';

  select * into v_result from public.create_or_update_residency(
    v_residency_id, 'Neurology', null, 'R3', v_start, null, 40000, 15::smallint
  );
  assert (select count(*) = 12 from public.receivables where residency_id = v_residency_id
    and invalidated_at is null), 'extending end did not restore future months';

  assert public.deactivate_residency(v_residency_id) = v_residency_id;
  assert (select count(*) = 11 from public.receivables where residency_id = v_residency_id
    and invalidated_at is not null), 'deactivation left future projections active';
  assert (select received_at = v_received_at and invalidated_at is null
    from public.receivables where id = v_received_id), 'deactivation changed received history';
  assert public.deactivate_residency(v_residency_id) = v_residency_id,
    'deactivation retry failed';
  begin
    perform public.generate_residency_receivables(v_residency_id);
  exception when no_data_found then v_denied := true;
  end;
  assert v_denied, 'inactive residency generated new receivables';
  assert (select count(*) = 0 from public.work_series), 'Free path created work_series';
  assert (select count(*) = 0 from public.subscription_entitlements), 'Free path used entitlement';
end $$;
reset role;

-- The private scheduled worker extends an active open-ended residency even
-- without an app session, and is idempotent on its next run.
insert into auth.users (id) values ('00000000-0000-0000-0000-000000000033');
insert into public.profiles (id, display_name, professional_status, specialty, timezone)
values ('00000000-0000-0000-0000-000000000033', 'C', 'resident', 'Pediatrics', 'UTC');
insert into public.residencies (
  id, user_id, specialty, starts_on, monthly_amount_cents, payment_day
) values (
  '00000000-0000-0000-0000-000000000333',
  '00000000-0000-0000-0000-000000000033',
  'Pediatrics', date_trunc('month', (transaction_timestamp() at time zone 'UTC'))::date,
  22000, 31
);
do $$
begin
  assert private.extend_all_residency_receivables() = 13,
    'scheduled worker did not populate current plus 12 future months';
  assert private.extend_all_residency_receivables() = 0,
    'scheduled worker retry modified existing months';
  assert (select count(*) = 13 from public.receivables
    where residency_id = '00000000-0000-0000-0000-000000000333'),
    'scheduled worker month count wrong';
  assert (select count(*) = 0 from public.work_series),
    'scheduled worker created premium work_series';
end $$;
rollback;

select '3.9 Free recurrence, leap day, ownership, history and deactivation passed' as result;
