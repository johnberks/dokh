-- Run in a disposable database after migrations through 3.10.
begin;

insert into auth.users (id) values
  ('00000000-0000-0000-0000-000000000011'),
  ('00000000-0000-0000-0000-000000000022');
insert into public.profiles (id, display_name, professional_status, specialty, timezone) values
  ('00000000-0000-0000-0000-000000000011', 'Premium', 'general_practitioner', null, 'UTC'),
  ('00000000-0000-0000-0000-000000000022', 'Free', 'general_practitioner', null, 'UTC');
insert into public.subscription_entitlements (
  user_id, is_active, product_id, store, environment, last_event_id
) values (
  '00000000-0000-0000-0000-000000000011', true, 'dokh_premium_test', 'app_store',
  'sandbox', 'test-3.10'
);
insert into public.work_locations (id, user_id, name, color_token) values
  ('00000000-0000-0000-0000-00000000a011', '00000000-0000-0000-0000-000000000011', 'São Lucas', 'sage'),
  ('00000000-0000-0000-0000-00000000a022', '00000000-0000-0000-0000-000000000022', 'Central', 'bronze');

do $$
begin
  assert has_function_privilege('authenticated',
    'public.create_work_series(uuid,public.work_series_frequency,public.work_entry_type,uuid,text,date,time,integer,text,bigint,integer)',
    'EXECUTE'), 'authenticated create series RPC missing';
  assert not has_function_privilege('anon',
    'public.create_work_series(uuid,public.work_series_frequency,public.work_entry_type,uuid,text,date,time,integer,text,bigint,integer)',
    'EXECUTE'), 'anon can create series';
  assert not has_function_privilege('authenticated', 'private.extend_all_work_series()', 'EXECUTE'),
    'worker exposed';
  assert not has_function_privilege('authenticated',
    'private.materialize_work_series(uuid,date)', 'EXECUTE'), 'materializer exposed';
  assert not has_table_privilege('authenticated', 'public.work_series', 'INSERT'),
    'clients must not insert series directly';
  assert (select count(*) = 2 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname in ('create_work_series', 'stop_work_series')
      and p.prosecdef and p.proconfig @> array['search_path=""']), 'unsafe series RPC';
end $$;

set role authenticated;

-- Free: denied before any write, so nothing is left behind.
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000022', false);
do $$
declare v_denied boolean := false;
begin
  begin
    perform public.create_work_series(gen_random_uuid(), 'weekly', 'appointment',
      '00000000-0000-0000-0000-00000000a022', null, current_date, null, null, 'UTC', 50000, 30);
  exception when insufficient_privilege then v_denied := true;
  end;
  assert v_denied, 'Free account created a work series';
  assert (select count(*) = 0 from public.work_series), 'Free left a partial series';
  assert (select count(*) = 0 from public.work_entries), 'Free left partial works';
end $$;

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000011', false);
do $$
declare
  v_key uuid := gen_random_uuid();
  v_result record;
  v_retry record;
  v_today date := (transaction_timestamp() at time zone 'UTC')::date;
  v_horizon date := ((transaction_timestamp() at time zone 'UTC')::date + interval '12 months')::date;
  v_denied boolean;
begin
  -- Weekly shift, 30 days to payment.
  select * into v_result from public.create_work_series(v_key, 'weekly', 'shift',
    '00000000-0000-0000-0000-00000000a011', 'Plantão noturno', v_today, '19:00', 720, 'UTC',
    120000, 30);
  assert v_result.occurrences = (v_horizon - v_today) / 7 + 1,
    format('weekly count %s', v_result.occurrences);
  assert (select work_date = v_today and source = 'recurrence' and occurrence_key = v_today::text
    from public.work_entries where id = v_result.work_id), 'first occurrence wrong';
  assert (select expected_on = v_today + 30 and amount_cents = 120000
    from public.receivables where work_entry_id = v_result.work_id), 'receivable wrong';
  assert (select count(*) = v_result.occurrences from public.receivables as r
    join public.work_entries as w on w.id = r.work_entry_id where w.series_id = v_result.series_id),
    'every occurrence needs one receivable';
  assert (select materialized_until = v_horizon from public.work_series where id = v_result.series_id),
    'horizon not recorded';

  -- Same key and payload: same series, no duplicates.
  select * into v_retry from public.create_work_series(v_key, 'weekly', 'shift',
    '00000000-0000-0000-0000-00000000a011', 'Plantão noturno', v_today, '19:00', 720, 'UTC',
    120000, 30);
  assert v_retry.series_id = v_result.series_id and v_retry.work_id = v_result.work_id,
    'retry created another series';
  assert (select count(*) = 1 from public.work_series), 'retry duplicated series';

  -- Same key, different payload: rejected.
  v_denied := false;
  begin
    perform public.create_work_series(v_key, 'monthly', 'shift',
      '00000000-0000-0000-0000-00000000a011', null, v_today, '19:00', 720, 'UTC', 120000, 30);
  exception when unique_violation then v_denied := true;
  end;
  assert v_denied, 'idempotency key reused for another payload';

  -- Custom (P03) is not offered.
  v_denied := false;
  begin
    perform public.create_work_series(gen_random_uuid(), 'custom', 'appointment',
      '00000000-0000-0000-0000-00000000a011', null, v_today, null, null, 'UTC', 1000, null);
  exception when invalid_parameter_value then v_denied := true;
  end;
  assert v_denied, 'custom frequency accepted';

  -- Shift requires schedule, like single works.
  v_denied := false;
  begin
    perform public.create_work_series(gen_random_uuid(), 'weekly', 'shift',
      '00000000-0000-0000-0000-00000000a011', null, v_today, null, null, 'UTC', 1000, null);
  exception when check_violation then v_denied := true;
  end;
  assert v_denied, 'shift series without schedule accepted';

  -- Another user's location is rejected.
  v_denied := false;
  begin
    perform public.create_work_series(gen_random_uuid(), 'weekly', 'appointment',
      '00000000-0000-0000-0000-00000000a022', null, v_today, null, null, 'UTC', 1000, null);
  exception when foreign_key_violation or check_violation then v_denied := true;
  end;
  assert v_denied, 'series used another user location';

  perform set_config('test.weekly_series', v_result.series_id::text, false);
end $$;

-- Biweekly and monthly (day 31 clamps to short months without drifting).
do $$
declare
  v_result record;
  v_today date := (transaction_timestamp() at time zone 'UTC')::date;
  v_horizon date := ((transaction_timestamp() at time zone 'UTC')::date + interval '12 months')::date;
begin
  select * into v_result from public.create_work_series(gen_random_uuid(), 'biweekly',
    'procedure', '00000000-0000-0000-0000-00000000a011', 'Cirurgia', v_today, null, null, 'UTC',
    250000, null);
  assert v_result.occurrences = (v_horizon - v_today) / 14 + 1,
    format('biweekly count %s', v_result.occurrences);
  assert (select count(*) = v_result.occurrences from public.receivables as r
    join public.work_entries as w on w.id = r.work_entry_id
    where w.series_id = v_result.series_id and r.expected_on is null),
    'unknown payment should stay undated';

  select * into v_result from public.create_work_series(gen_random_uuid(), 'monthly',
    'appointment', '00000000-0000-0000-0000-00000000a011', null, '2027-01-31', null, null, 'UTC',
    80000, 0);
  assert (select array_agg(work_date order by work_date)
    from public.work_entries where series_id = v_result.series_id and work_date <= '2027-05-31')
    = array['2027-01-31', '2027-02-28', '2027-03-31', '2027-04-30', '2027-05-31']::date[],
    'monthly dates drifted or did not clamp';
  assert (select count(*) = 0 from public.work_entries
    where series_id = v_result.series_id and work_date > v_horizon), 'materialized past horizon';
end $$;

-- One occurrence is edited and another deleted; the worker keeps both decisions.
do $$
declare
  v_series uuid := current_setting('test.weekly_series')::uuid;
  v_second public.work_entries;
  v_third public.work_entries;
begin
  select * into v_second from public.work_entries
  where series_id = v_series order by work_date offset 1 limit 1;
  select * into v_third from public.work_entries
  where series_id = v_series order by work_date offset 2 limit 1;

  perform public.update_work_with_receivable(gen_random_uuid(), v_second.id, 'shift',
    v_second.location_id, v_second.description, v_second.work_date + 1, '07:00', 720, 'UTC',
    130000, v_second.work_date + 31);
  perform public.delete_work_with_receivable(gen_random_uuid(), v_third.id);

  assert (select work_date = v_second.work_date + 1 and start_time = '07:00'
    from public.work_entries where id = v_second.id), 'occurrence edit not saved';
  assert (select deleted_at is not null from public.work_entries where id = v_third.id),
    'occurrence delete not saved';
  perform set_config('test.second_id', v_second.id::text, false);
  perform set_config('test.third_date', v_third.work_date::text, false);
end $$;

-- The other user cannot stop or see the series.
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000022', false);
do $$
declare v_denied boolean := false;
begin
  assert (select count(*) = 0 from public.work_series), 'other user read series';
  begin
    perform public.stop_work_series(current_setting('test.weekly_series')::uuid);
  exception when no_data_found then v_denied := true;
  end;
  assert v_denied, 'other user stopped the series';
end $$;
reset role;

-- Worker: extends as time passes, never recreates edited/deleted dates, skips lapsed Premium.
do $$
declare
  v_series uuid := current_setting('test.weekly_series')::uuid;
  v_before integer;
begin
  select count(*) into v_before from public.work_entries where series_id = v_series;
  assert private.extend_all_work_series() = 0, 'worker changed an up-to-date horizon';
  assert (select count(*) = v_before from public.work_entries where series_id = v_series),
    'worker duplicated occurrences';
  assert (select count(*) = 1 from public.work_entries
    where series_id = v_series and occurrence_key = current_setting('test.third_date')
      and deleted_at is not null), 'deleted occurrence was recreated';

  -- Pretend the horizon is two weeks behind: the worker fills only the gap.
  update public.work_series set materialized_until = materialized_until - 14 where id = v_series;
  delete from public.receivables where work_entry_id in (
    select id from public.work_entries where series_id = v_series
      and work_date > (select materialized_until from public.work_series where id = v_series)
  );
  delete from public.work_entries where series_id = v_series
    and work_date > (select materialized_until from public.work_series where id = v_series);
  assert private.extend_all_work_series() = 2, 'worker did not fill the two-week gap';

  update public.subscription_entitlements set is_active = false
  where user_id = '00000000-0000-0000-0000-000000000011';
  update public.work_series set materialized_until = materialized_until - 7 where id = v_series;
  delete from public.receivables where work_entry_id in (
    select id from public.work_entries where series_id = v_series
      and work_date > (select materialized_until from public.work_series where id = v_series)
  );
  delete from public.work_entries where series_id = v_series
    and work_date > (select materialized_until from public.work_series where id = v_series);
  assert private.extend_all_work_series() = 0, 'lapsed Premium kept extending';
  update public.subscription_entitlements set is_active = true
  where user_id = '00000000-0000-0000-0000-000000000011';
end $$;

-- Stopping keeps today and the past, removes the future (not received), and is idempotent.
set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000011', false);
do $$
declare
  v_series uuid := current_setting('test.weekly_series')::uuid;
  v_today date := (transaction_timestamp() at time zone 'UTC')::date;
  v_future integer;
  v_result record;
begin
  select count(*) into v_future from public.work_entries
  where series_id = v_series and deleted_at is null and work_date > v_today;
  select * into v_result from public.stop_work_series(v_series);
  assert v_result.removed = v_future, format('stop removed %s of %s', v_result.removed, v_future);
  assert (select count(*) = 1 from public.agenda_work_projection
    where series_id = v_series and work_date = v_today and series_active = false),
    'today occurrence should remain as history';
  assert (select count(*) = 0 from public.agenda_work_projection
    where series_id = v_series and work_date > v_today), 'future occurrences remain in agenda';
  assert (select count(*) = 0 from public.receivable_projection as r
    join public.work_entries as w on w.id = r.work_entry_id
    where w.series_id = v_series and w.work_date > v_today and r.receipt_status <> 'invalidated'),
    'future receivables remain active';
  select * into v_result from public.stop_work_series(v_series);
  assert v_result.removed = 0, 'second stop changed data';
end $$;
reset role;

do $$
begin
  assert private.extend_all_work_series() = 0, 'stopped series kept extending';
end $$;
rollback;

select '3.10 Premium recurrence, idempotency, occurrences, worker and stop passed' as result;
