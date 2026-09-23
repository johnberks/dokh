-- Run in a disposable database after 3.2–3.5 and 3.7 migrations.
begin;

insert into auth.users (id) values
  ('00000000-0000-0000-0000-000000000011'),
  ('00000000-0000-0000-0000-000000000022');
insert into public.work_locations (id, user_id, name, color_token) values
  ('00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000011', 'A', 'sage'),
  ('00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000022', 'B', 'blue');

do $$
begin
  assert (select c.relrowsecurity from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'private' and c.relname = 'work_rpc_requests'), 'idempotency RLS missing';
  assert not has_schema_privilege('authenticated', 'private', 'USAGE'), 'private schema exposed';
  assert not has_table_privilege('authenticated', 'private.work_rpc_requests', 'SELECT'), 'idempotency table exposed';
  assert not has_function_privilege('anon', 'public.delete_work_with_receivable(uuid,uuid)', 'EXECUTE'), 'anon RPC grant';
  assert not has_function_privilege('service_role', 'public.delete_work_with_receivable(uuid,uuid)', 'EXECUTE'), 'service RPC grant';
  assert has_function_privilege('authenticated', 'public.delete_work_with_receivable(uuid,uuid)', 'EXECUTE'), 'authenticated RPC missing';
  assert (select count(*) = 3 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname in (
      'create_work_with_receivable', 'update_work_with_receivable', 'delete_work_with_receivable'
    ) and p.prosecdef and p.proconfig @> array['search_path=""']), 'unsafe RPC search path';
end $$;

set role anon;
do $$
declare v_denied boolean := false;
begin
  begin
    perform public.create_work_with_receivable(
      '00000000-0000-0000-0000-000000000001', 'shift',
      '00000000-0000-0000-0000-000000000101', null,
      '2026-09-14', '19:00', 720, 'America/Sao_Paulo', 120000, null
    );
  exception when insufficient_privilege then v_denied := true;
  end;
  assert v_denied, 'anonymous caller executed create RPC';
end $$;
reset role;

set role authenticated;
-- Even an authenticated role without a verified JWT subject cannot write.
do $$
declare v_denied boolean := false;
begin
  begin
    perform public.create_work_with_receivable(
      '00000000-0000-0000-0000-000000000001', 'shift',
      '00000000-0000-0000-0000-000000000101', null,
      '2026-09-14', '19:00', 720, 'America/Sao_Paulo', 120000, null
    );
  exception when insufficient_privilege then v_denied := true;
  end;
  assert v_denied, 'authenticated role without JWT subject wrote data';
end $$;

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000011', false);
do $$
declare
  v_result record;
  v_repeat record;
  v_denied boolean;
begin
  select * into v_result from public.create_work_with_receivable(
    '00000000-0000-0000-0000-000000000001', 'shift',
    '00000000-0000-0000-0000-000000000101', 'Plantão',
    '2026-09-14', '19:00', 720, 'America/Sao_Paulo', 120000, null
  );
  assert v_result.work_id is not null and v_result.receivable_id is not null, 'create returned no IDs';
  perform set_config('dokh.test_work_id', v_result.work_id::text, false);
  perform set_config('dokh.test_receivable_id', v_result.receivable_id::text, false);
  assert (select count(*) = 1 from public.work_entries where id = v_result.work_id
    and user_id = auth.uid() and source = 'manual' and deleted_at is null), 'create work mismatch';
  assert (select count(*) = 1 from public.receivables where id = v_result.receivable_id
    and work_entry_id = v_result.work_id and user_id = auth.uid()
    and competence_month = '2026-09-01' and amount_cents = 120000
    and expected_on is null and received_at is null), 'create receivable mismatch';

  select * into v_repeat from public.create_work_with_receivable(
    '00000000-0000-0000-0000-000000000001', 'shift',
    '00000000-0000-0000-0000-000000000101', 'Plantão',
    '2026-09-14', '19:00', 720, 'America/Sao_Paulo', 120000, null
  );
  assert v_repeat.work_id = v_result.work_id and v_repeat.receivable_id = v_result.receivable_id,
    'create retry changed IDs';
  assert (select count(*) = 1 from public.work_entries), 'create retry duplicated work';
  assert (select count(*) = 1 from public.receivables), 'create retry duplicated receivable';

  v_denied := false;
  begin
    perform public.create_work_with_receivable(
      '00000000-0000-0000-0000-000000000001', 'shift',
      '00000000-0000-0000-0000-000000000101', 'Plantão',
      '2026-09-14', '19:00', 720, 'America/Sao_Paulo', 120001, null
    );
  exception when unique_violation then v_denied := true;
  end;
  assert v_denied, 'same key with changed payload accepted';

  v_denied := false;
  begin
    perform public.create_work_with_receivable(
      '00000000-0000-0000-0000-000000000003', 'shift',
      '00000000-0000-0000-0000-000000000101', 'Invalid',
      '2026-09-15', '19:00', 720, 'UTC', 0, null
    );
  exception when check_violation then v_denied := true;
  end;
  assert v_denied, 'invalid receivable amount accepted';
  assert (select count(*) = 1 from public.work_entries), 'failed receivable insert left orphan work';

  v_denied := false;
  begin
    perform public.create_work_with_receivable(
      '00000000-0000-0000-0000-000000000004', 'procedure',
      '00000000-0000-0000-0000-000000000201', null,
      '2026-09-15', null, null, 'UTC', 100, null
    );
  exception when check_violation then v_denied := true;
  end;
  assert v_denied, 'foreign location accepted by create';
  assert (select count(*) = 1 from public.work_entries), 'foreign location created work';

  v_denied := false;
  begin
    perform public.create_work_with_receivable(
      null, 'procedure', '00000000-0000-0000-0000-000000000101', null,
      '2026-09-15', null, null, 'UTC', 100, null
    );
  exception when invalid_parameter_value then v_denied := true;
  end;
  assert v_denied, 'missing idempotency key accepted';

  v_denied := false;
  begin
    insert into public.work_entries (user_id, type, location_id, work_date, timezone)
    values (auth.uid(), 'procedure', '00000000-0000-0000-0000-000000000101', '2026-09-15', 'UTC');
  exception when insufficient_privilege then v_denied := true;
  end;
  assert v_denied, 'direct partial aggregate write accepted';
end $$;

do $$
declare
  v_work_id uuid := current_setting('dokh.test_work_id')::uuid;
  v_receivable_id uuid := current_setting('dokh.test_receivable_id')::uuid;
  v_result record;
  v_updated_at timestamptz;
  v_denied boolean;
begin
  select * into v_result from public.update_work_with_receivable(
    '00000000-0000-0000-0000-000000000002', v_work_id, 'procedure',
    '00000000-0000-0000-0000-000000000101', 'Procedimento',
    '2026-10-02', null, null, 'UTC', 250000, '2026-11-05'
  );
  assert v_result.work_id = v_work_id and v_result.receivable_id = v_receivable_id,
    'update changed aggregate IDs';
  assert (select count(*) = 1 from public.work_entries where id = v_work_id
    and type = 'procedure' and description = 'Procedimento' and work_date = '2026-10-02'
    and start_time is null and duration_minutes is null), 'work update mismatch';
  assert (select count(*) = 1 from public.receivables where id = v_receivable_id
    and amount_cents = 250000 and competence_month = '2026-10-01'
    and expected_on = '2026-11-05' and received_at is null), 'receivable update mismatch';

  select updated_at into v_updated_at from public.work_entries where id = v_work_id;
  select * into v_result from public.update_work_with_receivable(
    '00000000-0000-0000-0000-000000000002', v_work_id, 'procedure',
    '00000000-0000-0000-0000-000000000101', 'Procedimento',
    '2026-10-02', null, null, 'UTC', 250000, '2026-11-05'
  );
  assert v_result.work_id = v_work_id and v_result.receivable_id = v_receivable_id,
    'update retry changed IDs';
  assert (select updated_at = v_updated_at from public.work_entries where id = v_work_id),
    'update retry touched work';

  v_denied := false;
  begin
    perform public.update_work_with_receivable(
      '00000000-0000-0000-0000-000000000002', v_work_id, 'procedure',
      '00000000-0000-0000-0000-000000000101', 'Changed',
      '2026-10-02', null, null, 'UTC', 250000, '2026-11-05'
    );
  exception when unique_violation then v_denied := true;
  end;
  assert v_denied, 'update key reused with changed payload';

  v_denied := false;
  begin
    perform public.update_work_with_receivable(
      '00000000-0000-0000-0000-000000000005', v_work_id, 'procedure',
      '00000000-0000-0000-0000-000000000101', 'Must rollback',
      '2026-12-02', null, null, 'UTC', 0, null
    );
  exception when check_violation then v_denied := true;
  end;
  assert v_denied, 'invalid amount accepted by update';
  assert (select work_date = '2026-10-02' and description = 'Procedimento'
    from public.work_entries where id = v_work_id), 'failed receivable update left changed work';
  assert (select amount_cents = 250000 and expected_on = '2026-11-05'
    from public.receivables where id = v_receivable_id), 'failed update changed receivable';

  v_denied := false;
  begin
    perform public.update_work_with_receivable(
      '00000000-0000-0000-0000-000000000006', v_work_id, 'procedure',
      '00000000-0000-0000-0000-000000000201', null,
      '2026-10-02', null, null, 'UTC', 250000, null
    );
  exception when check_violation then v_denied := true;
  end;
  assert v_denied, 'foreign location accepted by update';
end $$;

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000022', false);
do $$
declare
  v_work_id uuid := current_setting('dokh.test_work_id')::uuid;
  v_denied boolean;
  v_result record;
begin
  assert (select count(*) = 0 from public.work_entries), 'foreign user can read work';
  v_denied := false;
  begin
    perform public.update_work_with_receivable(
      '00000000-0000-0000-0000-000000000007', v_work_id, 'procedure',
      '00000000-0000-0000-0000-000000000201', null,
      '2026-10-02', null, null, 'UTC', 1, null
    );
  exception when no_data_found then v_denied := true;
  end;
  assert v_denied, 'foreign user updated work';
  v_denied := false;
  begin
    perform public.delete_work_with_receivable('00000000-0000-0000-0000-000000000008', v_work_id);
  exception when no_data_found then v_denied := true;
  end;
  assert v_denied, 'foreign user deleted work';

  -- Keys are scoped by user, not globally; the second owner may reuse one.
  select * into v_result from public.create_work_with_receivable(
    '00000000-0000-0000-0000-000000000001', 'appointment',
    '00000000-0000-0000-0000-000000000201', null,
    '2026-09-14', null, null, 'UTC', 30000, '2026-10-14'
  );
  assert v_result.work_id <> v_work_id, 'key collision across users';
  assert (select count(*) = 1 from public.work_entries), 'second owner work missing';
end $$;

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000011', false);
do $$
declare
  v_work_id uuid := current_setting('dokh.test_work_id')::uuid;
  v_receivable_id uuid := current_setting('dokh.test_receivable_id')::uuid;
  v_result record;
  v_deleted_at timestamptz;
  v_denied boolean;
begin
  select * into v_result from public.delete_work_with_receivable(
    '00000000-0000-0000-0000-000000000009', v_work_id
  );
  assert v_result.work_id = v_work_id and v_result.receivable_id = v_receivable_id,
    'delete changed aggregate IDs';
  select deleted_at into v_deleted_at from public.work_entries where id = v_work_id;
  assert v_deleted_at is not null, 'work was not soft-deleted';
  assert (select invalidated_at = v_deleted_at and received_at is null
    from public.receivables where id = v_receivable_id), 'receivable not invalidated with work';

  perform public.delete_work_with_receivable('00000000-0000-0000-0000-000000000009', v_work_id);
  perform public.delete_work_with_receivable('00000000-0000-0000-0000-000000000010', v_work_id);
  assert (select deleted_at = v_deleted_at from public.work_entries where id = v_work_id),
    'delete retry changed work timestamp';
  assert (select invalidated_at = v_deleted_at from public.receivables where id = v_receivable_id),
    'delete retry changed receivable timestamp';

  v_denied := false;
  begin
    perform public.update_work_with_receivable(
      '00000000-0000-0000-0000-000000000011', v_work_id, 'procedure',
      '00000000-0000-0000-0000-000000000101', null,
      '2026-11-02', null, null, 'UTC', 1000, null
    );
  exception when no_data_found then v_denied := true;
  end;
  assert v_denied, 'deleted work could be edited';
end $$;

reset role;
do $$
begin
  assert (select count(*) = 5 from private.work_rpc_requests), 'failed requests persisted idempotency rows';
  assert (select count(*) = 2 from public.work_entries), 'unexpected work count';
  assert (select count(*) = 2 from public.receivables), 'unexpected receivable count';
end $$;
rollback;

select '3.7 atomicity, ownership, idempotency and aggregate coherence passed' as result;
