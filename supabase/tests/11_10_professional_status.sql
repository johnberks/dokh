-- Run in a disposable database after migrations through 11.10.
begin;

insert into auth.users (id) values
  ('00000000-0000-0000-0000-000000000011'),
  ('00000000-0000-0000-0000-000000000022');
insert into public.profiles (id, display_name, professional_status, specialty, timezone) values
  ('00000000-0000-0000-0000-000000000011', 'Generalista', 'general_practitioner', null, 'UTC'),
  ('00000000-0000-0000-0000-000000000022', 'Especialista', 'specialist', 'Cardiologia', 'UTC');

do $$
declare v_denied boolean;
begin
  assert (select enum_range(null::public.professional_status)::text[]
    = array['general_practitioner', 'resident', 'specialist']), 'status values changed';
  assert not has_function_privilege('authenticated',
    'private.sync_residency_with_status()', 'EXECUTE'), 'trigger function exposed';

  v_denied := false;
  begin
    insert into auth.users (id) values ('00000000-0000-0000-0000-000000000033');
    insert into public.profiles (id, display_name, professional_status, specialty, timezone)
    values ('00000000-0000-0000-0000-000000000033', 'X', 'specialist', null, 'UTC');
  exception when check_violation then v_denied := true;
  end;
  assert v_denied, 'specialist without specialty accepted';

  v_denied := false;
  begin
    update public.profiles set specialty = 'Cardiologia'
    where id = '00000000-0000-0000-0000-000000000011';
  exception when check_violation then v_denied := true;
  end;
  assert v_denied, 'generalist with specialty accepted';
end $$;

-- Absence of residency never implies generalist, and only residents get a stipend.
set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000022', false);
do $$
declare v_denied boolean := false;
begin
  begin
    perform public.create_or_update_residency(null, 'Cardiologia', null, null,
      '2024-01-01', null, 10000, 5::smallint);
  exception when invalid_parameter_value then v_denied := true;
  end;
  assert v_denied, 'specialist created a residency';
end $$;

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000011', false);
do $$
declare
  v_denied boolean := false;
  v_residency_id uuid;
  v_today date := (transaction_timestamp() at time zone 'UTC')::date;
  v_start date := (date_trunc('month', transaction_timestamp() at time zone 'UTC') - interval '3 months')::date;
begin
  begin
    perform public.create_or_update_residency(null, 'Clínica Médica', null, null,
      v_start, null, 10000, 5::smallint);
  exception when invalid_parameter_value then v_denied := true;
  end;
  assert v_denied, 'generalist created a residency';

  update public.profiles set professional_status = 'resident', specialty = 'Clínica Médica'
  where id = '00000000-0000-0000-0000-000000000011';
  select residency_id into v_residency_id from public.create_or_update_residency(
    null, 'Clínica Médica', null, null, v_start, null, 10000, 5::smallint
  );
  assert v_residency_id is not null, 'resident could not create residency';
  perform set_config('test.residency_id', v_residency_id::text, false);

  -- Program follows the profile specialty while the person stays resident.
  update public.profiles set specialty = 'Pediatria'
  where id = '00000000-0000-0000-0000-000000000011';
  assert (select specialty = 'Pediatria' from public.residencies where id = v_residency_id),
    'residency program did not follow profile specialty';
end $$;
reset role;

-- One past month was received; it must survive leaving residency.
update public.receivables set received_at = now()
where residency_id = current_setting('test.residency_id')::uuid
  and competence_month = (date_trunc('month', transaction_timestamp() at time zone 'UTC') - interval '3 months')::date;

set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000011', false);
do $$
declare
  v_residency_id uuid := current_setting('test.residency_id')::uuid;
  v_today date := (transaction_timestamp() at time zone 'UTC')::date;
begin
  assert (select count(*) > 0 from public.receivables
    where residency_id = v_residency_id and invalidated_at is null and expected_on > v_today),
    'fixture needs future stipend months';
  update public.profiles set professional_status = 'specialist', specialty = 'Pediatria'
  where id = '00000000-0000-0000-0000-000000000011';
  assert (select not active from public.residencies where id = v_residency_id),
    'leaving residency kept it active';
  assert (select count(*) = 0 from public.receivables
    where residency_id = v_residency_id and invalidated_at is null and expected_on > v_today),
    'future stipend months stayed in Finances';
  assert (select count(*) = 1 from public.receivables
    where residency_id = v_residency_id and received_at is not null and invalidated_at is null),
    'received stipend was touched';
end $$;
reset role;

rollback;
