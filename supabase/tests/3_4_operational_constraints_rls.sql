-- Run only in a disposable database after migrations 3.2, 3.3 and 3.4.
begin;
insert into auth.users (id) values
  ('00000000-0000-0000-0000-000000000011'),
  ('00000000-0000-0000-0000-000000000022');

insert into public.subscription_entitlements
  (user_id, product_id, store, environment, last_event_id, is_active)
values
  ('00000000-0000-0000-0000-000000000011', 'monthly', 'app_store', 'sandbox', 'event-a', true),
  ('00000000-0000-0000-0000-000000000022', 'annual', 'play_store', 'production', 'event-b', false);

insert into public.device_push_tokens (user_id, expo_push_token, platform, device_id_hash) values
  ('00000000-0000-0000-0000-000000000011', 'ExponentPushToken[token-a]', 'ios', repeat('a', 64)),
  ('00000000-0000-0000-0000-000000000022', 'ExponentPushToken[token-b]', 'android', repeat('b', 64));

insert into public.imports
  (id, user_id, source, storage_path, original_filename, file_sha256, status, row_count, valid_count, issue_count, summary)
values
  ('00000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000011', 'csv', '00000000-0000-0000-0000-000000000011/a.csv', 'a.csv', repeat('a', 64), 'ready', 2, 1, 1, '{"work_count":1}'),
  ('00000000-0000-0000-0000-000000000302', '00000000-0000-0000-0000-000000000022', 'plantaozinho', '00000000-0000-0000-0000-000000000022/b.xlsx', 'b.xlsx', repeat('b', 64), 'empty', 0, 0, 0, '{}');

insert into public.import_issues (import_id, user_id, row_number, issue_code, payload) values
  ('00000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000011', 2, 'missing_amount', '{"row_label":"2"}');

do $$
begin
  assert (select count(*) = 4 from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname in ('subscription_entitlements', 'device_push_tokens', 'imports', 'import_issues')
      and c.relrowsecurity), 'RLS missing on operational tables';
  assert (select count(*) = 0 from public.work_entries), 'preview created Work without confirmation';
  assert (select count(*) = 0 from public.receivables), 'preview created a Receivable';
  assert (select count(*) = 1 from pg_indexes where schemaname = 'public' and indexname = 'work_entries_import_row_idx'), 'row idempotency index missing';

  begin
    update public.subscription_entitlements set environment = 'sandbox', last_event_id = 'event-a'
    where user_id = '00000000-0000-0000-0000-000000000022';
    raise exception 'duplicate webhook event accepted';
  exception when unique_violation then null; end;
  begin
    update public.subscription_entitlements set entitlement = 'other' where user_id = '00000000-0000-0000-0000-000000000011';
    raise exception 'unknown entitlement accepted';
  exception when check_violation then null; end;
  begin
    insert into public.device_push_tokens (user_id, expo_push_token, platform, device_id_hash)
    values ('00000000-0000-0000-0000-000000000022', 'ExponentPushToken[token-a]', 'android', repeat('c', 64));
    raise exception 'duplicate push token accepted';
  exception when unique_violation then null; end;
  begin
    insert into public.device_push_tokens (user_id, expo_push_token, platform, device_id_hash)
    values ('00000000-0000-0000-0000-000000000011', 'ExponentPushToken[token-c]', 'ios', 'raw-device-id');
    raise exception 'raw device id accepted';
  exception when check_violation then null; end;
  begin
    insert into public.imports (user_id, source, storage_path, original_filename, file_sha256)
    values ('00000000-0000-0000-0000-000000000011', 'csv', '00000000-0000-0000-0000-000000000011/again.csv', 'again.csv', repeat('a', 64));
    raise exception 'same-user duplicate file accepted';
  exception when unique_violation then null; end;
  begin
    insert into public.imports (user_id, source, storage_path, original_filename, file_sha256)
    values ('00000000-0000-0000-0000-000000000011', 'csv', '00000000-0000-0000-0000-000000000022/other.csv', 'other.csv', repeat('c', 64));
    raise exception 'other-user storage path accepted';
  exception when check_violation then null; end;
  begin
    update public.imports set valid_count = 3 where id = '00000000-0000-0000-0000-000000000301';
    raise exception 'invalid preview counts accepted';
  exception when check_violation then null; end;
  begin
    update public.imports set status = 'confirmed' where id = '00000000-0000-0000-0000-000000000301';
    raise exception 'confirmed status without timestamp accepted';
  exception when check_violation then null; end;
  begin
    insert into public.import_issues (import_id, user_id, row_number, issue_code)
    values ('00000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000022', 2, 'missing_location');
    raise exception 'cross-owner issue accepted';
  exception when foreign_key_violation then null; end;
  begin
    insert into public.import_issues (import_id, user_id, row_number, issue_code)
    values ('00000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000011', 2, 'missing_amount');
    raise exception 'duplicate row issue accepted';
  exception when unique_violation then null; end;
end $$;

insert into public.work_locations (id, user_id, name, color_token)
values ('00000000-0000-0000-0000-000000000401', '00000000-0000-0000-0000-000000000011', 'Local', 'sage');
insert into public.work_entries
  (id, user_id, type, location_id, work_date, timezone, source, import_id, import_row_key)
values
  ('00000000-0000-0000-0000-000000000501', '00000000-0000-0000-0000-000000000011', 'procedure', '00000000-0000-0000-0000-000000000401', '2026-09-22', 'UTC', 'import', '00000000-0000-0000-0000-000000000301', 'row-1');

do $$
begin
  begin
    insert into public.work_entries (user_id, type, location_id, work_date, timezone, source, import_id, import_row_key)
    values ('00000000-0000-0000-0000-000000000011', 'procedure', '00000000-0000-0000-0000-000000000401', '2026-09-22', 'UTC', 'import', '00000000-0000-0000-0000-000000000301', 'row-1');
    raise exception 'duplicate normalized row accepted';
  exception when unique_violation then null; end;
  begin
    insert into public.work_entries (user_id, type, location_id, work_date, timezone, source, import_id, import_row_key)
    values ('00000000-0000-0000-0000-000000000011', 'procedure', '00000000-0000-0000-0000-000000000401', '2026-09-22', 'UTC', 'import', '00000000-0000-0000-0000-000000000302', 'row-2');
    raise exception 'cross-owner import Work accepted';
  exception when foreign_key_violation then null; end;
  begin
    insert into public.work_entries (user_id, type, location_id, work_date, timezone, source)
    values ('00000000-0000-0000-0000-000000000011', 'procedure', '00000000-0000-0000-0000-000000000401', '2026-09-22', 'UTC', 'import');
    raise exception 'import Work without tracking accepted';
  exception when check_violation then null; end;
  begin
    update public.import_issues set created_work_entry_id = '00000000-0000-0000-0000-000000000501';
    raise exception 'resolved Work without timestamp accepted';
  exception when check_violation then null; end;
end $$;

set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000011', false);
do $$
begin
  assert (select count(*) = 1 from public.subscription_entitlements), 'owner entitlement read failed';
  assert (select count(*) = 1 from public.device_push_tokens), 'owner token read failed';
  assert (select count(*) = 1 from public.imports), 'owner import read failed';
  assert (select count(*) = 1 from public.import_issues), 'owner issue read failed';
  begin
    update public.subscription_entitlements set is_active = false where user_id = auth.uid();
    raise exception 'client entitlement write accepted';
  exception when insufficient_privilege then null; end;
  begin
    update public.imports set summary = '{}' where user_id = auth.uid();
    raise exception 'client preview write accepted';
  exception when insufficient_privilege then null; end;
  begin
    insert into public.import_issues (import_id, user_id, row_number, issue_code)
    values ('00000000-0000-0000-0000-000000000301', auth.uid(), 3, 'unknown');
    raise exception 'client issue write accepted';
  exception when insufficient_privilege then null; end;
  begin
    insert into public.device_push_tokens (user_id, expo_push_token, platform, device_id_hash)
    values ('00000000-0000-0000-0000-000000000022', 'ExponentPushToken[foreign]', 'ios', repeat('d', 64));
    raise exception 'cross-owner token write accepted';
  exception when insufficient_privilege then null; end;
end $$;

insert into public.device_push_tokens (user_id, expo_push_token, platform, device_id_hash)
values (auth.uid(), 'ExponentPushToken[mine]', 'ios', repeat('e', 64));
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000022', false);
do $$
begin
  assert (select count(*) = 1 from public.subscription_entitlements), 'cross-owner entitlement visible';
  assert (select count(*) = 1 from public.device_push_tokens), 'cross-owner token visible';
  assert (select count(*) = 1 from public.imports), 'cross-owner import visible';
  assert (select count(*) = 0 from public.import_issues), 'cross-owner issue visible';
end $$;
reset role;

set role anon;
do $$
declare table_name text;
begin
  foreach table_name in array array['subscription_entitlements', 'device_push_tokens', 'imports', 'import_issues'] loop
    begin
      execute format('select count(*) from public.%I', table_name);
      raise exception 'anonymous read accepted on %', table_name;
    exception when insufficient_privilege then null; end;
  end loop;
end $$;
reset role;
rollback;

select '3.4 operational constraints, idempotency and RLS passed' as result;
