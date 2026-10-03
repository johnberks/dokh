-- Run in a disposable database after all migrations through 7.7 (received date).
begin;

insert into auth.users (id) values
  ('00000000-0000-0000-0000-000000000011'),
  ('00000000-0000-0000-0000-000000000022');
insert into public.profiles (id, display_name, professional_status, timezone) values
  ('00000000-0000-0000-0000-000000000011', 'Ana', 'general_practitioner', 'America/Sao_Paulo');
insert into public.work_locations (id, user_id, name, color_token) values
  ('00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000011', 'A', 'sage'),
  ('00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000022', 'B', 'blue');
insert into public.work_entries (id, user_id, type, location_id, work_date, timezone) values
  ('00000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000011', 'procedure', '00000000-0000-0000-0000-000000000101', '2026-08-12', 'America/Sao_Paulo'),
  ('00000000-0000-0000-0000-000000000302', '00000000-0000-0000-0000-000000000011', 'procedure', '00000000-0000-0000-0000-000000000101', '2026-08-13', 'America/Sao_Paulo'),
  ('00000000-0000-0000-0000-000000000303', '00000000-0000-0000-0000-000000000011', 'procedure', '00000000-0000-0000-0000-000000000101', '2026-08-14', 'America/Sao_Paulo'),
  ('00000000-0000-0000-0000-000000000401', '00000000-0000-0000-0000-000000000022', 'procedure', '00000000-0000-0000-0000-000000000201', '2026-08-12', 'UTC');
insert into public.receivables (id, user_id, work_entry_id, competence_month, amount_cents, expected_on) values
  ('00000000-0000-0000-0000-000000000501', '00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000301', '2026-08-01', 150000, '2026-09-11'),
  ('00000000-0000-0000-0000-000000000502', '00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000302', '2026-08-01', 90000, '2026-09-12'),
  ('00000000-0000-0000-0000-000000000503', '00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000303', '2026-08-01', 50000, null),
  ('00000000-0000-0000-0000-000000000601', '00000000-0000-0000-0000-000000000022', '00000000-0000-0000-0000-000000000401', '2026-08-01', 40000, '2026-09-11');

do $$
begin
  assert not has_function_privilege('anon', 'public.confirm_receivable_received(uuid, date)', 'EXECUTE'),
    'anonymous execute grant';
  assert not has_function_privilege('service_role', 'public.confirm_receivable_received(uuid, date)', 'EXECUTE'),
    'service role execute grant';
  assert has_function_privilege('authenticated', 'public.confirm_receivable_received(uuid, date)', 'EXECUTE'),
    'authenticated execute missing';
  assert (select count(*) = 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'confirm_receivable_received'),
    'old one-argument overload left behind';
end $$;

set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000011', false);
do $$
declare
  v_result record;
  v_before timestamptz := clock_timestamp();
  v_denied boolean := false;
begin
  -- Já recebi em 11/09: meio-dia local, e o caixa conta setembro, não o dia da confirmação.
  select * into v_result from public.confirm_receivable_received(
    '00000000-0000-0000-0000-000000000501', '2026-09-11'
  );
  assert v_result.received_at = timestamptz '2026-09-11 12:00 America/Sao_Paulo',
    'received date not stored as local noon';
  assert (select (received_at at time zone 'America/Sao_Paulo')::date = '2026-09-11'
    and expected_on = '2026-09-11' from public.receivables where id = v_result.receivable_id),
    'local receipt date or due date changed';

  -- Repetir não reescreve a data original.
  select * into v_result from public.confirm_receivable_received(
    '00000000-0000-0000-0000-000000000501', '2026-09-20'
  );
  assert v_result.received_at = timestamptz '2026-09-11 12:00 America/Sao_Paulo',
    'repeat rewrote the receipt date';

  -- Sem data, continua o horário do servidor (Finanças, Review Card).
  select * into v_result from public.confirm_receivable_received(
    '00000000-0000-0000-0000-000000000503'
  );
  assert v_result.received_at >= v_before, 'default confirmation lost server time';

  begin
    perform public.confirm_receivable_received(
      '00000000-0000-0000-0000-000000000502', current_date + 30
    );
  exception when invalid_parameter_value then v_denied := true;
  end;
  assert v_denied, 'future receipt date accepted';
  assert (select received_at is null from public.receivables
    where id = '00000000-0000-0000-0000-000000000502'), 'rejected call changed receivable';

  v_denied := false;
  begin
    perform public.confirm_receivable_received(
      '00000000-0000-0000-0000-000000000601', '2026-09-11'
    );
  exception when no_data_found then v_denied := true;
  end;
  assert v_denied, 'confirmed another user''s receivable';
end $$;
reset role;

rollback;
