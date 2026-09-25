-- This file is run against a fresh disposable DB after the 3.2 migration.
insert into auth.users (id) values
  ('00000000-0000-0000-0000-000000000001'),
  ('00000000-0000-0000-0000-000000000002');

do $$
begin
  assert (select count(*) = 3 from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname in ('profiles', 'work_preferences', 'notification_preferences')
      and c.relrowsecurity), 'RLS must be enabled on all three user tables';
  assert (select count(*) = 1 from pg_type t join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public' and t.typname = 'professional_status'), 'professional status enum missing';
end $$;

set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000001', false);

insert into public.profiles (id, display_name, professional_status, timezone)
values ('00000000-0000-0000-0000-000000000001', 'Ana', 'general_practitioner', 'America/Sao_Paulo');
insert into public.work_preferences (user_id, default_duration_minutes, default_start_time, default_payment_term_days)
values ('00000000-0000-0000-0000-000000000001', 720, '07:00', 30);
insert into public.notification_preferences (user_id)
values ('00000000-0000-0000-0000-000000000001');

do $$
declare before_update timestamptz;
begin
  assert (select user_id = id and country_code = 'BR' and locale = 'pt-BR' from public.profiles), 'profile defaults/owner';
  assert (select not receivable_due_day and not undated_weekly_reminder
    and not upcoming_work_reminder and not important_work_changes from public.notification_preferences), 'notification defaults';
  select updated_at into before_update from public.profiles;
  perform pg_sleep(0.01);
  update public.profiles set display_name = 'Ana Maria', updated_at = '2000-01-01' where id = auth.uid();
  assert (select updated_at > before_update from public.profiles), 'profile updated_at trigger';
  select updated_at into before_update from public.work_preferences;
  perform pg_sleep(0.01);
  update public.work_preferences set default_duration_minutes = 360 where user_id = auth.uid();
  assert (select updated_at > before_update from public.work_preferences), 'work preference updated_at trigger';
  select updated_at into before_update from public.notification_preferences;
  perform pg_sleep(0.01);
  update public.notification_preferences set receivable_due_day = true where user_id = auth.uid();
  assert (select updated_at > before_update from public.notification_preferences), 'notification updated_at trigger';
end $$;

-- Each invalid value must fail at the database, not just in a form.
do $$
begin
  begin
    update public.profiles set display_name = '  ' where id = auth.uid();
    raise exception 'blank display_name was accepted';
  exception when check_violation then null; end;
  begin
    update public.profiles set graduation_year = extract(year from current_date)::integer + 1 where id = auth.uid();
    raise exception 'future graduation_year was accepted';
  exception when check_violation then null; end;
  begin
    update public.profiles set professional_status = 'resident' where id = auth.uid();
    raise exception 'resident without specialty was accepted';
  exception when check_violation then null; end;
  begin
    update public.profiles set specialty = 'Cardiologia' where id = auth.uid();
    raise exception 'generalist specialty was accepted';
  exception when check_violation then null; end;
  begin
    update public.profiles set timezone = 'Invalid/Not_A_Zone' where id = auth.uid();
    raise exception 'invalid timezone was accepted';
  exception when check_violation then null; end;
  begin
    update public.profiles set country_code = 'br' where id = auth.uid();
    raise exception 'lowercase country code was accepted';
  exception when check_violation then null; end;
  begin
    update public.profiles set locale = ' ' where id = auth.uid();
    raise exception 'blank locale was accepted';
  exception when check_violation then null; end;
  begin
    update public.work_preferences set default_duration_minutes = 0 where user_id = auth.uid();
    raise exception 'zero duration was accepted';
  exception when check_violation then null; end;
  begin
    update public.work_preferences set default_payment_term_days = 45 where user_id = auth.uid();
    raise exception 'unsupported payment term was accepted';
  exception when check_violation then null; end;
  begin
    update public.notification_preferences set receivable_due_day = null where user_id = auth.uid();
    raise exception 'null notification toggle was accepted';
  exception when not_null_violation then null; end;
  begin
    insert into public.work_preferences (user_id) values (auth.uid());
    raise exception 'duplicate work preferences were accepted';
  exception when unique_violation then null; end;
  update public.profiles set professional_status = 'resident', specialty = 'Cardiologia' where id = auth.uid();
  assert (select specialty = 'Cardiologia' from public.profiles), 'valid resident should be saved';
  update public.profiles set professional_status = 'general_practitioner', specialty = null where id = auth.uid();
end $$;

-- Switch identity without changing the SQL role. Other users see no rows and cannot write across ownership.
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000002', false);
do $$
begin
  assert (select count(*) = 0 from public.profiles), 'other user read profile';
  assert (select count(*) = 0 from public.work_preferences), 'other user read work preferences';
  assert (select count(*) = 0 from public.notification_preferences), 'other user read notification preferences';
  update public.profiles set display_name = 'Eve' where id = '00000000-0000-0000-0000-000000000001';
  assert not found, 'other user updated profile';
  update public.work_preferences set default_duration_minutes = 999 where user_id = '00000000-0000-0000-0000-000000000001';
  assert not found, 'other user updated work preferences';
  update public.notification_preferences set receivable_due_day = false where user_id = '00000000-0000-0000-0000-000000000001';
  assert not found, 'other user updated notification preferences';
  delete from public.profiles where id = '00000000-0000-0000-0000-000000000001';
  assert not found, 'other user deleted profile';
  delete from public.work_preferences where user_id = '00000000-0000-0000-0000-000000000001';
  assert not found, 'other user deleted work preferences';
  delete from public.notification_preferences where user_id = '00000000-0000-0000-0000-000000000001';
  assert not found, 'other user deleted notification preferences';
  begin
    insert into public.profiles (id, display_name, professional_status, timezone)
    values ('00000000-0000-0000-0000-000000000001', 'Eve', 'general_practitioner', 'UTC');
    raise exception 'other user inserted profile';
  exception when insufficient_privilege then null; end;
  begin
    insert into public.work_preferences (user_id)
    values ('00000000-0000-0000-0000-000000000001');
    raise exception 'other user inserted work preferences';
  exception when insufficient_privilege then null; end;
  begin
    insert into public.notification_preferences (user_id)
    values ('00000000-0000-0000-0000-000000000001');
    raise exception 'other user inserted notification preferences';
  exception when insufficient_privilege then null; end;
end $$;

insert into public.profiles (id, display_name, professional_status, timezone)
values ('00000000-0000-0000-0000-000000000002', 'Bia', 'general_practitioner', 'UTC');

reset role;
set role anon;
do $$
begin
  begin
    perform count(*) from public.profiles;
    raise exception 'anonymous read profile';
  exception when insufficient_privilege then null; end;
  begin
    perform count(*) from public.work_preferences;
    raise exception 'anonymous read work preferences';
  exception when insufficient_privilege then null; end;
  begin
    perform count(*) from public.notification_preferences;
    raise exception 'anonymous read notification preferences';
  exception when insufficient_privilege then null; end;
end $$;
reset role;

select '3.2 constraints and RLS passed' as result;
