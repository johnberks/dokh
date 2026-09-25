-- Run in a disposable database after 3.2–3.5, 3.7 and 6.1 migrations.
begin;

insert into auth.users (id) values
  ('00000000-0000-0000-0000-000000000011'),
  ('00000000-0000-0000-0000-000000000022');

do $$
begin
  assert not has_table_privilege('authenticated', 'public.work_locations', 'INSERT'),
    'clients must not insert locations directly';
  assert not has_table_privilege('authenticated', 'public.work_locations', 'UPDATE'),
    'clients must not update locations directly';
  assert has_function_privilege('authenticated',
    'public.create_work_location(text,text,text,public.work_location_color_source)', 'EXECUTE'),
    'authenticated create RPC missing';
  assert not has_function_privilege('anon',
    'public.create_work_location(text,text,text,public.work_location_color_source)', 'EXECUTE'),
    'anon create RPC grant';
  assert not has_function_privilege('authenticated',
    'private.assert_work_location_color(uuid,text,public.work_location_color_source)', 'EXECUTE'),
    'color helper exposed';
  assert (select count(*) = 3 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname in (
      'create_work_location', 'update_work_location', 'archive_work_location'
    ) and p.prosecdef and p.proconfig @> array['search_path=""']), 'unsafe RPC search path';
end $$;

set role authenticated;
-- Without a verified JWT subject nothing is written.
do $$
declare v_denied boolean := false;
begin
  begin
    perform public.create_work_location('Sem dono', null, 'sage', 'automatic');
  exception when insufficient_privilege then v_denied := true;
  end;
  assert v_denied, 'caller without JWT subject created a location';
end $$;

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000011', false);
do $$
declare
  v_location public.work_locations;
  v_denied boolean;
begin
  v_location := public.create_work_location('  Hospital São Lucas  ', '  ', 'sage', 'automatic');
  assert v_location.user_id = '00000000-0000-0000-0000-000000000011', 'owner not taken from JWT';
  assert v_location.name = 'Hospital São Lucas' and v_location.city is null, 'name/city not normalized';
  perform set_config('dokh.test_location_id', v_location.id::text, false);

  v_denied := false;
  begin
    perform public.create_work_location('Clínica', null, 'terra', 'free_palette');
  exception when invalid_parameter_value then v_denied := true;
  end;
  assert v_denied, 'free palette accepted a premium color';

  v_denied := false;
  begin
    perform public.create_work_location('Clínica', null, 'terra', 'premium_palette');
  exception when insufficient_privilege then v_denied := true;
  end;
  assert v_denied, 'premium palette accepted without entitlement';
end $$;
reset role;

insert into public.subscription_entitlements (
  user_id, is_active, product_id, store, environment, last_event_id
) values (
  '00000000-0000-0000-0000-000000000011', true, 'dokh_premium_monthly', 'app_store', 'sandbox', 'evt-6-1'
);

set role authenticated;
do $$
declare
  v_location public.work_locations;
begin
  v_location := public.update_work_location(
    current_setting('dokh.test_location_id')::uuid, 'São Lucas', 'Recife', 'terra', 'premium_palette'
  );
  assert v_location.color_token = 'terra' and v_location.city = 'Recife', 'premium update failed';
end $$;
reset role;

update public.subscription_entitlements set is_active = false
where user_id = '00000000-0000-0000-0000-000000000011';

set role authenticated;
do $$
declare
  v_location public.work_locations;
  v_denied boolean := false;
begin
  -- Sem Premium, renomear mantém a cor ampliada que já existia...
  v_location := public.update_work_location(
    current_setting('dokh.test_location_id')::uuid, 'HSL', 'Recife', 'terra', 'premium_palette'
  );
  assert v_location.name = 'HSL', 'rename with kept premium color failed';
  -- ...mas trocar para outra cor ampliada exige Premium de novo.
  begin
    perform public.update_work_location(
      current_setting('dokh.test_location_id')::uuid, 'HSL', 'Recife', 'violet', 'premium_palette'
    );
  exception when insufficient_privilege then v_denied := true;
  end;
  assert v_denied, 'premium color change accepted after entitlement ended';
end $$;

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000022', false);
do $$
declare v_denied boolean;
begin
  v_denied := false;
  begin
    perform public.update_work_location(
      current_setting('dokh.test_location_id')::uuid, 'Invasor', null, 'sage', 'automatic'
    );
  exception when no_data_found then v_denied := true;
  end;
  assert v_denied, 'stranger updated a location';

  v_denied := false;
  begin
    perform public.archive_work_location(current_setting('dokh.test_location_id')::uuid);
  exception when no_data_found then v_denied := true;
  end;
  assert v_denied, 'stranger archived a location';
end $$;

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000011', false);
do $$
declare v_denied boolean := false;
begin
  perform public.archive_work_location(current_setting('dokh.test_location_id')::uuid);
  -- Repetir não falha.
  perform public.archive_work_location(current_setting('dokh.test_location_id')::uuid);
  assert (select archived_at is not null from public.work_locations
    where id = current_setting('dokh.test_location_id')::uuid), 'location not archived';
  begin
    perform public.update_work_location(
      current_setting('dokh.test_location_id')::uuid, 'Arquivado', null, 'sage', 'automatic'
    );
  exception when no_data_found then v_denied := true;
  end;
  assert v_denied, 'archived location was edited';
end $$;
reset role;

rollback;
