-- Run only in a disposable database after migrations 3.2 and 3.3.
insert into auth.users (id) values
  ('00000000-0000-0000-0000-000000000011'),
  ('00000000-0000-0000-0000-000000000022');

insert into public.work_locations (id, user_id, name, color_token) values
  ('00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000011', 'Hospital A', 'sage'),
  ('00000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000011', 'Hospital A', 'bronze'),
  ('00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000022', 'Clínica B', 'blue');

insert into public.work_series (id, user_id, frequency, rrule, timezone, starts_on) values
  ('00000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000011', 'weekly', 'FREQ=WEEKLY', 'America/Sao_Paulo', '2026-09-01'),
  ('00000000-0000-0000-0000-000000000302', '00000000-0000-0000-0000-000000000022', 'monthly', 'FREQ=MONTHLY', 'UTC', '2026-09-01');

insert into public.residencies (id, user_id, specialty, starts_on, monthly_amount_cents, payment_day) values
  ('00000000-0000-0000-0000-000000000401', '00000000-0000-0000-0000-000000000011', 'Cardiologia', '2026-09-01', 365442, 31),
  ('00000000-0000-0000-0000-000000000402', '00000000-0000-0000-0000-000000000022', 'Pediatria', '2026-09-01', 300000, 5);

insert into public.work_entries (id, user_id, type, location_id, work_date, start_time, duration_minutes, timezone) values
  ('00000000-0000-0000-0000-000000000501', '00000000-0000-0000-0000-000000000011', 'shift', '00000000-0000-0000-0000-000000000101', '2026-09-14', '19:00', 720, 'America/Sao_Paulo'),
  ('00000000-0000-0000-0000-000000000502', '00000000-0000-0000-0000-000000000011', 'procedure', '00000000-0000-0000-0000-000000000102', '2026-09-15', null, null, 'America/Sao_Paulo'),
  ('00000000-0000-0000-0000-000000000503', '00000000-0000-0000-0000-000000000022', 'appointment', '00000000-0000-0000-0000-000000000201', '2026-09-15', null, null, 'UTC');

insert into public.work_entries (id, user_id, type, location_id, work_date, start_time, duration_minutes, timezone, series_id, occurrence_key, source)
values ('00000000-0000-0000-0000-000000000504', '00000000-0000-0000-0000-000000000011', 'shift', '00000000-0000-0000-0000-000000000101', '2026-09-21', '19:00', 720, 'America/Sao_Paulo', '00000000-0000-0000-0000-000000000301', '2026-09-21', 'recurrence');

insert into public.receivables (id, user_id, work_entry_id, competence_month, amount_cents, expected_on) values
  ('00000000-0000-0000-0000-000000000601', '00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000501', '2026-09-01', 120000, '2026-10-14'),
  ('00000000-0000-0000-0000-000000000602', '00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000502', '2026-09-01', 250000, null);
insert into public.receivables (id, user_id, residency_id, competence_month, amount_cents, expected_on) values
  ('00000000-0000-0000-0000-000000000603', '00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000401', '2026-09-01', 365442, '2026-09-30');

do $$
begin
  assert (select count(*) = 5 from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname in ('work_locations', 'work_series', 'work_entries', 'residencies', 'receivables')
      and c.relrowsecurity), 'RLS must be enabled on all five tables';
  assert (select count(*) = 7 from pg_indexes where schemaname = 'public' and indexname in (
    'work_locations_user_active_name_idx', 'work_series_user_materialized_idx',
    'residencies_one_active_per_user_idx', 'work_entries_user_date_idx',
    'receivables_user_expected_idx', 'receivables_user_competence_idx',
    'receivables_user_received_idx'
  )), 'required owner/date indexes missing';
  assert (select indexdef like '%(user_id, work_date, start_time, created_at)%'
    from pg_indexes where schemaname = 'public' and indexname = 'work_entries_user_date_idx'), 'work date index columns';
  assert (select indexdef like '%(user_id, expected_on)%'
    from pg_indexes where schemaname = 'public' and indexname = 'receivables_user_expected_idx'), 'cash date index columns';
  assert (select indexdef like '%(user_id, competence_month)%'
    from pg_indexes where schemaname = 'public' and indexname = 'receivables_user_competence_idx'), 'competence index columns';
  assert (select indexdef like '%(user_id, received_at)%'
    from pg_indexes where schemaname = 'public' and indexname = 'receivables_user_received_idx'), 'received index columns';
  assert (select count(*) = 2 from public.work_locations where name = 'Hospital A'), 'repeated location names must be allowed';
  assert (select received_at is null and invalidated_at is null from public.receivables where id = '00000000-0000-0000-0000-000000000601'), 'payment must not auto-confirm';
  assert (select expected_on is null from public.receivables where id = '00000000-0000-0000-0000-000000000602'), 'undated receivable must be valid';
end $$;

do $$
begin
  begin
    insert into public.work_locations (user_id, name, color_token) values ('00000000-0000-0000-0000-000000000011', ' ', 'sage');
    raise exception 'blank location name accepted';
  exception when check_violation then null; end;
  begin
    insert into public.work_locations (user_id, name, color_token) values ('00000000-0000-0000-0000-000000000011', 'X', '#ff0000');
    raise exception 'hex color accepted';
  exception when check_violation then null; end;
  begin
    insert into public.work_series (user_id, frequency, rrule, timezone, starts_on) values ('00000000-0000-0000-0000-000000000011', 'weekly', ' ', 'UTC', '2026-09-01');
    raise exception 'blank rrule accepted';
  exception when check_violation then null; end;
  begin
    insert into public.work_series (user_id, frequency, rrule, timezone, starts_on) values ('00000000-0000-0000-0000-000000000011', 'weekly', 'FREQ=WEEKLY', 'Invalid/Zone', '2026-09-01');
    raise exception 'invalid series timezone accepted';
  exception when check_violation then null; end;
  begin
    insert into public.residencies (user_id, specialty, starts_on, monthly_amount_cents, payment_day) values ('00000000-0000-0000-0000-000000000011', 'Clínica Médica', '2026-09-01', 100000, 5);
    raise exception 'second active residency accepted';
  exception when unique_violation then null; end;
  insert into public.residencies (user_id, specialty, starts_on, monthly_amount_cents, payment_day, active)
  values ('00000000-0000-0000-0000-000000000011', 'Clínica Médica', '2024-09-01', 100000, 5, false);
  assert (select count(*) = 2 from public.residencies where user_id = '00000000-0000-0000-0000-000000000011'), 'inactive residency history blocked';
  begin
    update public.residencies set payment_day = 0 where id = '00000000-0000-0000-0000-000000000401';
    raise exception 'payment day zero accepted';
  exception when check_violation then null; end;
  begin
    update public.residencies set payment_day = 32 where id = '00000000-0000-0000-0000-000000000401';
    raise exception 'payment day 32 accepted';
  exception when check_violation then null; end;
  begin
    update public.residencies set monthly_amount_cents = 0 where id = '00000000-0000-0000-0000-000000000401';
    raise exception 'zero residency amount accepted';
  exception when check_violation then null; end;
  begin
    insert into public.work_entries (user_id, type, location_id, work_date, timezone)
    values ('00000000-0000-0000-0000-000000000011', 'shift', '00000000-0000-0000-0000-000000000101', '2026-09-16', 'UTC');
    raise exception 'shift without start/duration accepted';
  exception when check_violation then null; end;
  begin
    update public.work_entries set duration_minutes = 0 where id = '00000000-0000-0000-0000-000000000501';
    raise exception 'zero duration accepted';
  exception when check_violation then null; end;
  begin
    insert into public.work_entries (user_id, type, location_id, work_date, timezone)
    values ('00000000-0000-0000-0000-000000000011', 'procedure', '00000000-0000-0000-0000-000000000201', '2026-09-16', 'UTC');
    raise exception 'cross-owner location accepted';
  exception when check_violation then null; end;
  begin
    insert into public.work_entries (user_id, type, location_id, work_date, timezone, series_id, occurrence_key, source)
    values ('00000000-0000-0000-0000-000000000011', 'procedure', '00000000-0000-0000-0000-000000000101', '2026-09-16', 'UTC', '00000000-0000-0000-0000-000000000302', '2026-09-16', 'recurrence');
    raise exception 'cross-owner series accepted';
  exception when foreign_key_violation then null; end;
  begin
    insert into public.work_entries (user_id, type, location_id, work_date, timezone, series_id, source)
    values ('00000000-0000-0000-0000-000000000011', 'procedure', '00000000-0000-0000-0000-000000000101', '2026-09-16', 'UTC', '00000000-0000-0000-0000-000000000301', 'recurrence');
    raise exception 'series without occurrence key accepted';
  exception when check_violation then null; end;
  begin
    insert into public.work_entries (user_id, type, location_id, work_date, timezone, series_id, occurrence_key, source)
    values ('00000000-0000-0000-0000-000000000011', 'procedure', '00000000-0000-0000-0000-000000000101', '2026-09-21', 'UTC', '00000000-0000-0000-0000-000000000301', '2026-09-21', 'recurrence');
    raise exception 'duplicate series occurrence accepted';
  exception when unique_violation then null; end;
  begin
    update public.work_entries set timezone = 'Invalid/Zone' where id = '00000000-0000-0000-0000-000000000501';
    raise exception 'invalid work timezone accepted';
  exception when check_violation then null; end;
end $$;

-- Historical work keeps its archived location, but new work cannot select it.
update public.work_locations set archived_at = now() where id = '00000000-0000-0000-0000-000000000102';
do $$
begin
  assert (select location_id = '00000000-0000-0000-0000-000000000102' from public.work_entries where id = '00000000-0000-0000-0000-000000000502'), 'archive changed historical work';
  begin
    insert into public.work_entries (user_id, type, location_id, work_date, timezone)
    values ('00000000-0000-0000-0000-000000000011', 'procedure', '00000000-0000-0000-0000-000000000102', '2026-09-17', 'UTC');
    raise exception 'archived location accepted for new work';
  exception when check_violation then null; end;
end $$;

do $$
begin
  begin
    insert into public.receivables (user_id, competence_month, amount_cents) values ('00000000-0000-0000-0000-000000000011', '2026-09-01', 100);
    raise exception 'receivable without origin accepted';
  exception when check_violation then null; end;
  begin
    insert into public.receivables (user_id, work_entry_id, residency_id, competence_month, amount_cents)
    values ('00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000501', '00000000-0000-0000-0000-000000000401', '2026-09-01', 100);
    raise exception 'receivable with two origins accepted';
  exception when check_violation then null; end;
  begin
    insert into public.receivables (user_id, work_entry_id, competence_month, amount_cents)
    values ('00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000501', '2026-09-01', 100);
    raise exception 'second work receivable accepted';
  exception when unique_violation then null; end;
  begin
    insert into public.receivables (user_id, residency_id, competence_month, amount_cents)
    values ('00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000401', '2026-09-01', 100);
    raise exception 'second residency month accepted';
  exception when unique_violation then null; end;
  begin
    update public.receivables set competence_month = '2026-09-14' where id = '00000000-0000-0000-0000-000000000601';
    raise exception 'mid-month competence accepted';
  exception when check_violation then null; end;
  begin
    update public.receivables set amount_cents = 0 where id = '00000000-0000-0000-0000-000000000601';
    raise exception 'zero amount accepted';
  exception when check_violation then null; end;
  begin
    update public.receivables set currency = 'USD' where id = '00000000-0000-0000-0000-000000000601';
    raise exception 'non-BRL currency accepted';
  exception when check_violation then null; end;
  begin
    insert into public.receivables (user_id, work_entry_id, competence_month, amount_cents)
    values ('00000000-0000-0000-0000-000000000022', '00000000-0000-0000-0000-000000000504', '2026-09-01', 100);
    raise exception 'cross-owner work receivable accepted';
  exception when foreign_key_violation then null; end;
  begin
    insert into public.receivables (user_id, residency_id, competence_month, amount_cents)
    values ('00000000-0000-0000-0000-000000000022', '00000000-0000-0000-0000-000000000401', '2026-10-01', 100);
    raise exception 'cross-owner residency receivable accepted';
  exception when foreign_key_violation then null; end;
end $$;

set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000011', false);
do $$
begin
  assert (select count(*) = 2 from public.work_locations), 'owner cannot read locations';
  assert (select count(*) = 1 from public.work_series), 'owner cannot read series';
  assert (select count(*) = 3 from public.work_entries), 'owner cannot read work';
  assert (select count(*) = 2 from public.residencies), 'owner cannot read residency history';
  assert (select count(*) = 3 from public.receivables), 'owner cannot read receivables';
  begin
    insert into public.work_locations (user_id, name, color_token) values (auth.uid(), 'Nova', 'sage');
    raise exception 'direct location write accepted';
  exception when insufficient_privilege then null; end;
  begin
    insert into public.work_entries (user_id, type, location_id, work_date, timezone)
    values (auth.uid(), 'procedure', '00000000-0000-0000-0000-000000000101', '2026-09-17', 'UTC');
    raise exception 'partial aggregate write accepted';
  exception when insufficient_privilege then null; end;
  begin
    insert into public.work_series (user_id, frequency, rrule, timezone, starts_on)
    values (auth.uid(), 'weekly', 'FREQ=WEEKLY', 'UTC', '2026-09-01');
    raise exception 'Premium series write accepted';
  exception when insufficient_privilege then null; end;
end $$;

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000022', false);
do $$
begin
  assert (select count(*) = 1 from public.work_locations), 'other user read locations';
  assert (select count(*) = 1 from public.work_series), 'other user read series';
  assert (select count(*) = 1 from public.work_entries), 'other user read work';
  assert (select count(*) = 1 from public.residencies), 'other user read residency';
  assert (select count(*) = 0 from public.receivables), 'other user read receivables';
  begin
    update public.receivables set amount_cents = 1 where id = '00000000-0000-0000-0000-000000000601';
    raise exception 'direct receivable update accepted';
  exception when insufficient_privilege then null; end;
end $$;
reset role;

set role anon;
do $$
declare table_name text;
begin
  foreach table_name in array array['work_locations', 'work_series', 'work_entries', 'residencies', 'receivables'] loop
    begin
      execute format('select count(*) from public.%I', table_name);
      raise exception 'anonymous read accepted on %', table_name;
    exception when insufficient_privilege then null; end;
  end loop;
end $$;
reset role;

select '3.3 core constraints, indexes and RLS passed' as result;
