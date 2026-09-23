-- Run in a disposable database after 3.2–3.5, 3.7 and 3.8 migrations.
begin;

insert into auth.users (id) values
  ('00000000-0000-0000-0000-000000000011'),
  ('00000000-0000-0000-0000-000000000022');
insert into public.work_locations (id, user_id, name, color_token) values
  ('00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000011', 'A', 'sage'),
  ('00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000022', 'B', 'blue');
insert into public.work_entries (
  id, user_id, type, location_id, work_date, timezone, deleted_at
) values
  ('00000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000011', 'procedure', '00000000-0000-0000-0000-000000000101', '2020-01-01', 'UTC', null),
  ('00000000-0000-0000-0000-000000000302', '00000000-0000-0000-0000-000000000011', 'procedure', '00000000-0000-0000-0000-000000000101', '2020-01-02', 'UTC', null),
  ('00000000-0000-0000-0000-000000000303', '00000000-0000-0000-0000-000000000011', 'procedure', '00000000-0000-0000-0000-000000000101', '2020-01-03', 'UTC', now()),
  ('00000000-0000-0000-0000-000000000401', '00000000-0000-0000-0000-000000000022', 'procedure', '00000000-0000-0000-0000-000000000201', '2020-01-01', 'UTC', null);
insert into public.receivables (
  id, user_id, work_entry_id, competence_month, amount_cents, expected_on, invalidated_at
) values
  ('00000000-0000-0000-0000-000000000501', '00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000301', '2020-01-01', 10000, '2020-02-01', null),
  ('00000000-0000-0000-0000-000000000502', '00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000302', '2020-01-01', 20000, null, null),
  ('00000000-0000-0000-0000-000000000503', '00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000303', '2020-01-01', 30000, '2020-02-03', now()),
  ('00000000-0000-0000-0000-000000000601', '00000000-0000-0000-0000-000000000022', '00000000-0000-0000-0000-000000000401', '2020-01-01', 40000, '2020-02-01', null);

do $$
begin
  assert (select count(*) = 4 from public.receivables where received_at is null),
    'past due date must never auto-confirm';
  assert not has_function_privilege('anon', 'public.confirm_receivable_received(uuid)', 'EXECUTE'),
    'anonymous execute grant';
  assert not has_function_privilege('service_role', 'public.confirm_receivable_received(uuid)', 'EXECUTE'),
    'service role execute grant';
  assert has_function_privilege('authenticated', 'public.confirm_receivable_received(uuid)', 'EXECUTE'),
    'authenticated execute missing';
  assert (select p.prosecdef and p.proconfig @> array['search_path=""']
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'confirm_receivable_received'),
    'RPC must be security definer with empty search path';
  assert (select count(*) = 1 from pg_trigger
    where tgname = 'receivables_received_at_immutable' and not tgisinternal),
    'audit trigger missing';
end $$;

set role anon;
do $$
declare v_denied boolean := false;
begin
  begin
    perform public.confirm_receivable_received('00000000-0000-0000-0000-000000000501');
  exception when insufficient_privilege then v_denied := true;
  end;
  assert v_denied, 'anonymous caller confirmed receivable';
end $$;
reset role;

set role authenticated;
do $$
declare v_denied boolean := false;
begin
  begin
    perform public.confirm_receivable_received('00000000-0000-0000-0000-000000000501');
  exception when insufficient_privilege then v_denied := true;
  end;
  assert v_denied, 'session without JWT subject confirmed receivable';
end $$;

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000011', false);
do $$
declare
  v_result record;
  v_first_at timestamptz;
  v_first_updated_at timestamptz;
  v_before timestamptz := clock_timestamp();
  v_after timestamptz;
  v_denied boolean := false;
begin
  select * into v_result from public.confirm_receivable_received(
    '00000000-0000-0000-0000-000000000501'
  );
  v_after := clock_timestamp();
  v_first_at := v_result.received_at;
  assert v_result.receivable_id = '00000000-0000-0000-0000-000000000501',
    'RPC returned wrong receivable';
  assert v_first_at between v_before and v_after, 'confirmation did not use server time';
  assert (select received_at = v_first_at and expected_on = '2020-02-01'
    from public.receivables where id = v_result.receivable_id),
    'receipt timestamp not persisted or due date changed';
  select updated_at into v_first_updated_at from public.receivables where id = v_result.receivable_id;

  perform pg_sleep(0.02);
  select * into v_result from public.confirm_receivable_received(
    '00000000-0000-0000-0000-000000000501'
  );
  assert v_result.received_at = v_first_at, 'repeat advanced receipt timestamp';
  assert (select updated_at = v_first_updated_at from public.receivables
    where id = v_result.receivable_id), 'repeat rewrote receivable';

  -- An undated item remains valid; confirmation never invents expected_on.
  select * into v_result from public.confirm_receivable_received(
    '00000000-0000-0000-0000-000000000502'
  );
  assert v_result.received_at is not null, 'undated receipt was not confirmed';
  assert (select expected_on is null from public.receivables where id = v_result.receivable_id),
    'confirmation invented a due date';

  begin
    perform public.confirm_receivable_received('00000000-0000-0000-0000-000000000503');
  exception when no_data_found then v_denied := true;
  end;
  assert v_denied, 'invalidated receivable was confirmed';
  assert (select received_at is null from public.receivables
    where id = '00000000-0000-0000-0000-000000000503'),
    'invalidated receivable was changed';

  v_denied := false;
  begin
    update public.receivables set received_at = clock_timestamp()
    where id = '00000000-0000-0000-0000-000000000601';
  exception when insufficient_privilege then v_denied := true;
  end;
  assert v_denied, 'client retained direct UPDATE privilege';
end $$;

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000022', false);
do $$
declare v_denied boolean := false;
begin
  assert (select count(*) = 1 from public.receivables), 'foreign receivables visible';
  begin
    perform public.confirm_receivable_received('00000000-0000-0000-0000-000000000501');
  exception when no_data_found then v_denied := true;
  end;
  assert v_denied, 'foreign owner confirmed receivable';
  assert (select received_at is null from public.receivables
    where id = '00000000-0000-0000-0000-000000000601'),
    'foreign attempt changed own receivable';
end $$;
reset role;

set role service_role;
do $$
declare
  v_first_at timestamptz;
  v_denied boolean;
begin
  select received_at into v_first_at from public.receivables
  where id = '00000000-0000-0000-0000-000000000501';
  v_denied := false;
  begin
    update public.receivables set received_at = v_first_at + interval '1 day'
    where id = '00000000-0000-0000-0000-000000000501';
  exception when check_violation then v_denied := true;
  end;
  assert v_denied, 'confirmed timestamp was rewritten';
  v_denied := false;
  begin
    update public.receivables set received_at = null
    where id = '00000000-0000-0000-0000-000000000501';
  exception when check_violation then v_denied := true;
  end;
  assert v_denied, 'confirmed timestamp was cleared';

  update public.receivables set amount_cents = 11000
  where id = '00000000-0000-0000-0000-000000000501';
  assert (select received_at = v_first_at and amount_cents = 11000
    from public.receivables where id = '00000000-0000-0000-0000-000000000501'),
    'unrelated update changed audit time';
end $$;
reset role;

rollback;
select '3.8 explicit confirmation, ownership, idempotency and audit passed' as result;
