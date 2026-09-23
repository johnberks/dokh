-- Run only in a disposable database after migrations 3.2–3.5.
begin;

insert into auth.users (id) values
  ('00000000-0000-0000-0000-000000000011'),
  ('00000000-0000-0000-0000-000000000022'),
  ('00000000-0000-0000-0000-000000000033');

insert into public.profiles (id, display_name, professional_status, timezone) values
  ('00000000-0000-0000-0000-000000000011', 'Owner', 'general_practitioner', 'UTC'),
  ('00000000-0000-0000-0000-000000000022', 'Other', 'general_practitioner', 'UTC');
insert into public.work_preferences (user_id) values
  ('00000000-0000-0000-0000-000000000011'),
  ('00000000-0000-0000-0000-000000000022');
insert into public.notification_preferences (user_id) values
  ('00000000-0000-0000-0000-000000000011'),
  ('00000000-0000-0000-0000-000000000022');
insert into public.work_locations (id, user_id, name, color_token) values
  ('00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000011', 'A', 'sage'),
  ('00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000022', 'B', 'sage');
insert into public.work_series (id, user_id, frequency, rrule, timezone, starts_on) values
  ('00000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000011', 'weekly', 'FREQ=WEEKLY', 'UTC', '2026-09-01'),
  ('00000000-0000-0000-0000-000000000202', '00000000-0000-0000-0000-000000000022', 'weekly', 'FREQ=WEEKLY', 'UTC', '2026-09-01');
insert into public.residencies (id, user_id, specialty, starts_on, monthly_amount_cents, payment_day) values
  ('00000000-0000-0000-0000-000000000103', '00000000-0000-0000-0000-000000000011', 'A', '2026-09-01', 100, 1),
  ('00000000-0000-0000-0000-000000000203', '00000000-0000-0000-0000-000000000022', 'B', '2026-09-01', 100, 1);
insert into public.work_entries (id, user_id, type, location_id, work_date, timezone) values
  ('00000000-0000-0000-0000-000000000104', '00000000-0000-0000-0000-000000000011', 'procedure', '00000000-0000-0000-0000-000000000101', '2026-09-22', 'UTC'),
  ('00000000-0000-0000-0000-000000000204', '00000000-0000-0000-0000-000000000022', 'procedure', '00000000-0000-0000-0000-000000000201', '2026-09-22', 'UTC');
insert into public.receivables (id, user_id, work_entry_id, competence_month, amount_cents) values
  ('00000000-0000-0000-0000-000000000105', '00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000104', '2026-09-01', 100),
  ('00000000-0000-0000-0000-000000000205', '00000000-0000-0000-0000-000000000022', '00000000-0000-0000-0000-000000000204', '2026-09-01', 100);
insert into public.subscription_entitlements (user_id, product_id, store, environment, last_event_id) values
  ('00000000-0000-0000-0000-000000000011', 'monthly', 'app_store', 'sandbox', 'a'),
  ('00000000-0000-0000-0000-000000000022', 'annual', 'play_store', 'sandbox', 'b');
insert into public.device_push_tokens (user_id, expo_push_token, platform, device_id_hash) values
  ('00000000-0000-0000-0000-000000000011', 'ExponentPushToken[a]', 'ios', repeat('a', 64)),
  ('00000000-0000-0000-0000-000000000022', 'ExponentPushToken[b]', 'android', repeat('b', 64));
insert into public.imports (id, user_id, source, storage_path, original_filename, file_sha256) values
  ('00000000-0000-0000-0000-000000000106', '00000000-0000-0000-0000-000000000011', 'csv', '00000000-0000-0000-0000-000000000011/a.csv', 'a.csv', repeat('a', 64)),
  ('00000000-0000-0000-0000-000000000206', '00000000-0000-0000-0000-000000000022', 'csv', '00000000-0000-0000-0000-000000000022/b.csv', 'b.csv', repeat('b', 64));
insert into public.import_issues (import_id, user_id, row_number, issue_code) values
  ('00000000-0000-0000-0000-000000000106', '00000000-0000-0000-0000-000000000011', 1, 'missing_amount'),
  ('00000000-0000-0000-0000-000000000206', '00000000-0000-0000-0000-000000000022', 1, 'missing_amount');

do $$
declare table_name text;
begin
  assert (select count(*) = 12 from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind = 'r' and c.relrowsecurity), 'RLS missing on a user table';
  assert (select count(*) = 12 from pg_policies where schemaname = 'public'
    and roles = array['authenticated']::name[]), 'every table needs an authenticated ownership policy';
  assert (select count(*) = 0 from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind = 'v'
      and not coalesce(c.reloptions @> array['security_invoker=true'], false)), 'unsafe public view';
  assert (select count(*) = 0 from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind = 'm'
      and (has_table_privilege('anon', c.oid, 'SELECT')
        or has_table_privilege('authenticated', c.oid, 'SELECT'))), 'client-readable materialized view';

  foreach table_name in array array[
    'profiles', 'work_preferences', 'notification_preferences', 'work_locations',
    'work_series', 'work_entries', 'residencies', 'receivables',
    'subscription_entitlements', 'device_push_tokens', 'imports', 'import_issues'
  ] loop
    assert not has_table_privilege('anon', format('public.%I', table_name), 'SELECT'), 'anon read grant on ' || table_name;
    assert not has_table_privilege('anon', format('public.%I', table_name), 'INSERT'), 'anon insert grant on ' || table_name;
    assert not has_table_privilege('anon', format('public.%I', table_name), 'UPDATE'), 'anon update grant on ' || table_name;
    assert not has_table_privilege('anon', format('public.%I', table_name), 'DELETE'), 'anon delete grant on ' || table_name;
    assert not has_table_privilege('anon', format('public.%I', table_name), 'TRUNCATE'), 'anon truncate grant on ' || table_name;
    assert not has_table_privilege('anon', format('public.%I', table_name), 'REFERENCES'), 'anon references grant on ' || table_name;
    assert not has_table_privilege('anon', format('public.%I', table_name), 'TRIGGER'), 'anon trigger grant on ' || table_name;
    assert not has_table_privilege('anon', format('public.%I', table_name), 'MAINTAIN'), 'anon maintain grant on ' || table_name;
    assert not has_table_privilege('authenticated', format('public.%I', table_name), 'TRUNCATE'), 'client truncate grant on ' || table_name;
    assert not has_table_privilege('authenticated', format('public.%I', table_name), 'REFERENCES'), 'client references grant on ' || table_name;
    assert not has_table_privilege('authenticated', format('public.%I', table_name), 'TRIGGER'), 'client trigger grant on ' || table_name;
    assert not has_table_privilege('authenticated', format('public.%I', table_name), 'MAINTAIN'), 'client maintain grant on ' || table_name;
    assert has_table_privilege('service_role', format('public.%I', table_name), 'SELECT'), 'service read missing on ' || table_name;
    assert has_table_privilege('service_role', format('public.%I', table_name), 'INSERT'), 'service insert missing on ' || table_name;
    assert has_table_privilege('service_role', format('public.%I', table_name), 'UPDATE'), 'service update missing on ' || table_name;
    assert has_table_privilege('service_role', format('public.%I', table_name), 'DELETE'), 'service delete missing on ' || table_name;
    assert not has_table_privilege('service_role', format('public.%I', table_name), 'TRUNCATE'), 'service truncate grant on ' || table_name;
    assert not has_table_privilege('service_role', format('public.%I', table_name), 'MAINTAIN'), 'service maintain grant on ' || table_name;
  end loop;
end $$;

-- Defaults for tables from later migrations must not silently expose data.
create table public.rls_future_probe (id integer);
do $$
begin
  assert not has_table_privilege('anon', 'public.rls_future_probe', 'SELECT'), 'future table exposed to anon';
  assert not has_table_privilege('authenticated', 'public.rls_future_probe', 'TRUNCATE'), 'future table permits client truncate';
  assert not has_table_privilege('authenticated', 'public.rls_future_probe', 'SELECT'), 'future table exposed to client';
  assert has_table_privilege('service_role', 'public.rls_future_probe', 'SELECT'), 'future table unavailable to service role';
end $$;

set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000011', false);
do $$
declare table_name text;
declare visible_count bigint;
declare owned_count bigint;
begin
  foreach table_name in array array[
    'profiles', 'work_preferences', 'notification_preferences', 'work_locations',
    'work_series', 'work_entries', 'residencies', 'receivables',
    'subscription_entitlements', 'device_push_tokens', 'imports', 'import_issues'
  ] loop
    execute format('select count(*) from public.%I', table_name) into visible_count;
    assert visible_count = 1, 'owner saw wrong row count in ' || table_name;
    execute format('select count(*) from public.%I where user_id = auth.uid()', table_name) into owned_count;
    assert owned_count = 1, 'owner saw another account instead of own row in ' || table_name;
    assert has_table_privilege('authenticated', format('public.%I', table_name), 'SELECT'), 'client read missing on ' || table_name;
  end loop;
end $$;

-- Client-writable records still require auth.uid() on every operation.
do $$
declare table_name text;
declare affected bigint;
declare update_column text;
begin
  foreach table_name in array array[
    'profiles', 'work_preferences', 'notification_preferences', 'device_push_tokens'
  ] loop
    update_column := case table_name
      when 'profiles' then 'display_name'
      when 'work_preferences' then 'default_duration_minutes'
      when 'notification_preferences' then 'upcoming_work_reminder'
      else 'last_seen_at'
    end;
    execute format('update public.%I set %I = %I where user_id = $1', table_name, update_column, update_column)
      using '00000000-0000-0000-0000-000000000022'::uuid;
    get diagnostics affected = row_count;
    assert affected = 0, 'cross-owner update touched ' || table_name;
    execute format('delete from public.%I where user_id = $1', table_name)
      using '00000000-0000-0000-0000-000000000022'::uuid;
    get diagnostics affected = row_count;
    assert affected = 0, 'cross-owner delete touched ' || table_name;
  end loop;

  begin
    insert into public.profiles (id, display_name, professional_status, timezone)
    values ('00000000-0000-0000-0000-000000000033', 'Foreign', 'general_practitioner', 'UTC');
    raise exception 'cross-owner profile insert accepted';
  exception when insufficient_privilege then null; end;
  begin
    insert into public.work_preferences (user_id)
    values ('00000000-0000-0000-0000-000000000033');
    raise exception 'cross-owner work preferences insert accepted';
  exception when insufficient_privilege then null; end;
  begin
    insert into public.notification_preferences (user_id)
    values ('00000000-0000-0000-0000-000000000033');
    raise exception 'cross-owner notification preferences insert accepted';
  exception when insufficient_privilege then null; end;
  begin
    insert into public.device_push_tokens (user_id, expo_push_token, platform, device_id_hash)
    values ('00000000-0000-0000-0000-000000000033', 'ExponentPushToken[foreign]', 'ios', repeat('c', 64));
    raise exception 'cross-owner push token insert accepted';
  exception when insufficient_privilege then null; end;
end $$;

update public.profiles set display_name = 'Owner changed' where id = auth.uid();
update public.work_preferences set default_duration_minutes = 60 where user_id = auth.uid();
update public.notification_preferences set upcoming_work_reminder = true where user_id = auth.uid();
update public.device_push_tokens set last_seen_at = now() where user_id = auth.uid();

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000022', false);
do $$
declare table_name text;
declare visible_count bigint;
declare owned_count bigint;
begin
  foreach table_name in array array[
    'profiles', 'work_preferences', 'notification_preferences', 'work_locations',
    'work_series', 'work_entries', 'residencies', 'receivables',
    'subscription_entitlements', 'device_push_tokens', 'imports', 'import_issues'
  ] loop
    execute format('select count(*) from public.%I', table_name) into visible_count;
    assert visible_count = 1, 'other user saw wrong row count in ' || table_name;
    execute format('select count(*) from public.%I where user_id = auth.uid()', table_name) into owned_count;
    assert owned_count = 1, 'other user saw owner row in ' || table_name;
  end loop;
  assert (select display_name = 'Other' from public.profiles), 'other user read owner profile';
  assert (select default_duration_minutes is null from public.work_preferences), 'other user read owner preference';
end $$;
reset role;

set role service_role;
do $$
declare table_name text;
declare visible_count bigint;
begin
  foreach table_name in array array[
    'profiles', 'work_preferences', 'notification_preferences', 'work_locations',
    'work_series', 'work_entries', 'residencies', 'receivables',
    'subscription_entitlements', 'device_push_tokens', 'imports', 'import_issues'
  ] loop
    execute format('select count(*) from public.%I', table_name) into visible_count;
    assert visible_count = 2, 'service role cannot read both owners in ' || table_name;
  end loop;
end $$;
reset role;

set role anon;
do $$
declare table_name text;
begin
  foreach table_name in array array[
    'profiles', 'work_preferences', 'notification_preferences', 'work_locations',
    'work_series', 'work_entries', 'residencies', 'receivables',
    'subscription_entitlements', 'device_push_tokens', 'imports', 'import_issues'
  ] loop
    begin
      execute format('select count(*) from public.%I', table_name);
      raise exception 'anonymous read accepted on %', table_name;
    exception when insufficient_privilege then null; end;
  end loop;
  begin
    truncate public.profiles;
    raise exception 'anonymous truncate accepted';
  exception when insufficient_privilege then null; end;
end $$;
reset role;
rollback;

select '3.5 full RLS matrix and view guard passed' as result;
