-- 3.7: manual Work + Receivable form one transactional aggregate.
-- Keep idempotency records outside exposed API schemas and do not grant table
-- writes to clients. SECURITY DEFINER is necessary because 3.5 closes DML.
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table private.work_rpc_requests (
  user_id uuid not null references auth.users (id) on delete cascade,
  idempotency_key uuid not null,
  operation text not null check (operation in ('create', 'update', 'delete')),
  request_hash text not null check (request_hash ~ '^[0-9a-f]{64}$'),
  work_entry_id uuid,
  receivable_id uuid,
  created_at timestamptz not null default now(),
  primary key (user_id, idempotency_key),
  check ((work_entry_id is null) = (receivable_id is null))
);
alter table private.work_rpc_requests enable row level security;
revoke all on private.work_rpc_requests from public, anon, authenticated;

-- A conflicting insert waits for an in-flight request with the same key. The
-- row lock then serializes retries and lets them return the original IDs.
create function private.claim_work_rpc_request(
  p_user_id uuid, p_key uuid, p_operation text, p_hash text
)
returns private.work_rpc_requests
language plpgsql security invoker set search_path = '' as $$
declare
  v_request private.work_rpc_requests;
begin
  if p_key is null then
    raise exception 'idempotency key is required' using errcode = '22023';
  end if;

  insert into private.work_rpc_requests (user_id, idempotency_key, operation, request_hash)
  values (p_user_id, p_key, p_operation, p_hash)
  on conflict (user_id, idempotency_key) do nothing;

  select r.* into strict v_request
  from private.work_rpc_requests as r
  where r.user_id = p_user_id and r.idempotency_key = p_key
  for update;

  if v_request.operation <> p_operation or v_request.request_hash <> p_hash then
    raise exception 'idempotency key was used for a different request' using errcode = '23505';
  end if;
  return v_request;
end;
$$;
revoke execute on function private.claim_work_rpc_request(uuid, uuid, text, text)
  from public, anon, authenticated;

create function public.create_work_with_receivable(
  p_idempotency_key uuid,
  p_type public.work_entry_type,
  p_location_id uuid,
  p_description text,
  p_work_date date,
  p_start_time time,
  p_duration_minutes integer,
  p_timezone text,
  p_amount_cents bigint,
  p_expected_on date
)
returns table (work_id uuid, receivable_id uuid)
language plpgsql security definer set search_path = '' as $$
declare
  v_user_id uuid := auth.uid();
  v_hash text;
  v_request private.work_rpc_requests;
  v_work_id uuid;
  v_receivable_id uuid;
begin
  if v_user_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;
  v_hash := encode(sha256(convert_to(pg_catalog.jsonb_build_object(
    'type', p_type, 'location_id', p_location_id, 'description', p_description,
    'work_date', p_work_date, 'start_time', p_start_time,
    'duration_minutes', p_duration_minutes, 'timezone', p_timezone,
    'amount_cents', p_amount_cents, 'expected_on', p_expected_on
  )::text, 'UTF8')), 'hex');
  v_request := private.claim_work_rpc_request(v_user_id, p_idempotency_key, 'create', v_hash);
  if v_request.work_entry_id is not null then
    return query select v_request.work_entry_id, v_request.receivable_id;
    return;
  end if;

  insert into public.work_entries (
    user_id, type, location_id, description, work_date, start_time,
    duration_minutes, timezone, source
  ) values (
    v_user_id, p_type, p_location_id, p_description, p_work_date, p_start_time,
    p_duration_minutes, p_timezone, 'manual'
  ) returning id into v_work_id;

  insert into public.receivables (
    user_id, work_entry_id, competence_month, amount_cents, expected_on
  ) values (
    v_user_id, v_work_id, pg_catalog.date_trunc('month', p_work_date::timestamp)::date,
    p_amount_cents, p_expected_on
  ) returning id into v_receivable_id;

  update private.work_rpc_requests as r
  set work_entry_id = v_work_id, receivable_id = v_receivable_id
  where r.user_id = v_user_id and r.idempotency_key = p_idempotency_key;
  return query select v_work_id, v_receivable_id;
end;
$$;

create function public.update_work_with_receivable(
  p_idempotency_key uuid,
  p_work_entry_id uuid,
  p_type public.work_entry_type,
  p_location_id uuid,
  p_description text,
  p_work_date date,
  p_start_time time,
  p_duration_minutes integer,
  p_timezone text,
  p_amount_cents bigint,
  p_expected_on date
)
returns table (work_id uuid, receivable_id uuid)
language plpgsql security definer set search_path = '' as $$
declare
  v_user_id uuid := auth.uid();
  v_hash text;
  v_request private.work_rpc_requests;
  v_work public.work_entries;
  v_receivable public.receivables;
begin
  if v_user_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;
  v_hash := encode(sha256(convert_to(pg_catalog.jsonb_build_object(
    'work_entry_id', p_work_entry_id, 'type', p_type, 'location_id', p_location_id,
    'description', p_description, 'work_date', p_work_date,
    'start_time', p_start_time, 'duration_minutes', p_duration_minutes,
    'timezone', p_timezone, 'amount_cents', p_amount_cents,
    'expected_on', p_expected_on
  )::text, 'UTF8')), 'hex');
  v_request := private.claim_work_rpc_request(v_user_id, p_idempotency_key, 'update', v_hash);
  if v_request.work_entry_id is not null then
    return query select v_request.work_entry_id, v_request.receivable_id;
    return;
  end if;

  select w.* into v_work from public.work_entries as w
  where w.id = p_work_entry_id and w.user_id = v_user_id
    and w.deleted_at is null and w.source = 'manual'
    and w.series_id is null and w.import_id is null
  for update;
  if not found then
    raise exception 'work not found' using errcode = 'P0002';
  end if;
  select r.* into v_receivable from public.receivables as r
  where r.work_entry_id = v_work.id and r.user_id = v_user_id
    and r.invalidated_at is null
  for update;
  if not found then
    raise exception 'receivable not found' using errcode = 'P0002';
  end if;

  update public.work_entries as w set
    type = p_type, location_id = p_location_id, description = p_description,
    work_date = p_work_date, start_time = p_start_time,
    duration_minutes = p_duration_minutes, timezone = p_timezone
  where w.id = v_work.id and w.user_id = v_user_id;
  update public.receivables as r set
    competence_month = pg_catalog.date_trunc('month', p_work_date::timestamp)::date,
    amount_cents = p_amount_cents, expected_on = p_expected_on
  where r.id = v_receivable.id and r.user_id = v_user_id;

  update private.work_rpc_requests as q
  set work_entry_id = v_work.id, receivable_id = v_receivable.id
  where q.user_id = v_user_id and q.idempotency_key = p_idempotency_key;
  return query select v_work.id, v_receivable.id;
end;
$$;

create function public.delete_work_with_receivable(
  p_idempotency_key uuid, p_work_entry_id uuid
)
returns table (work_id uuid, receivable_id uuid)
language plpgsql security definer set search_path = '' as $$
declare
  v_user_id uuid := auth.uid();
  v_hash text;
  v_request private.work_rpc_requests;
  v_work public.work_entries;
  v_receivable public.receivables;
  v_deleted_at timestamptz := pg_catalog.clock_timestamp();
begin
  if v_user_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;
  v_hash := encode(sha256(convert_to(pg_catalog.jsonb_build_object(
    'work_entry_id', p_work_entry_id
  )::text, 'UTF8')), 'hex');
  v_request := private.claim_work_rpc_request(v_user_id, p_idempotency_key, 'delete', v_hash);
  if v_request.work_entry_id is not null then
    return query select v_request.work_entry_id, v_request.receivable_id;
    return;
  end if;

  select w.* into v_work from public.work_entries as w
  where w.id = p_work_entry_id and w.user_id = v_user_id
    and w.source = 'manual' and w.series_id is null and w.import_id is null
  for update;
  if not found then
    raise exception 'work not found' using errcode = 'P0002';
  end if;
  select r.* into v_receivable from public.receivables as r
  where r.work_entry_id = v_work.id and r.user_id = v_user_id
  for update;
  if not found then
    raise exception 'receivable not found' using errcode = 'P0002';
  end if;

  if v_work.deleted_at is null then
    update public.work_entries as w set deleted_at = v_deleted_at
    where w.id = v_work.id and w.user_id = v_user_id;
    update public.receivables as r set invalidated_at = v_deleted_at
    where r.id = v_receivable.id and r.user_id = v_user_id;
  elsif v_receivable.invalidated_at is null then
    raise exception 'deleted work has active receivable' using errcode = '23514';
  end if;

  update private.work_rpc_requests as q
  set work_entry_id = v_work.id, receivable_id = v_receivable.id
  where q.user_id = v_user_id and q.idempotency_key = p_idempotency_key;
  return query select v_work.id, v_receivable.id;
end;
$$;

revoke execute on function public.create_work_with_receivable(
  uuid, public.work_entry_type, uuid, text, date, time, integer, text, bigint, date
) from public, anon, service_role;
revoke execute on function public.update_work_with_receivable(
  uuid, uuid, public.work_entry_type, uuid, text, date, time, integer, text, bigint, date
) from public, anon, service_role;
revoke execute on function public.delete_work_with_receivable(uuid, uuid)
  from public, anon, service_role;
grant execute on function public.create_work_with_receivable(
  uuid, public.work_entry_type, uuid, text, date, time, integer, text, bigint, date
) to authenticated;
grant execute on function public.update_work_with_receivable(
  uuid, uuid, public.work_entry_type, uuid, text, date, time, integer, text, bigint, date
) to authenticated;
grant execute on function public.delete_work_with_receivable(uuid, uuid) to authenticated;
