-- For disposable migration tests only; never roll back production data casually.
do $$
begin
  if current_database() = 'postgres' then
    perform cron.unschedule('dokh-work-series-extension');
  end if;
end;
$$;

drop view public.agenda_work_projection;
create view public.agenda_work_projection with (security_invoker = true) as
select
  w.id as work_entry_id,
  w.user_id,
  w.work_date,
  w.start_time,
  w.duration_minutes,
  w.type,
  w.description,
  w.timezone,
  w.created_at,
  l.id as location_id,
  l.name as location_name,
  l.color_token,
  r.receivable_id,
  r.amount_cents,
  r.expected_on,
  r.receipt_status
from public.work_entries as w
join public.work_locations as l on l.id = w.location_id and l.user_id = w.user_id
left join public.receivable_projection as r on r.work_entry_id = w.id
where w.deleted_at is null;
revoke all on public.agenda_work_projection from public, anon, authenticated, service_role;
grant select on public.agenda_work_projection to authenticated;

create or replace function public.update_work_with_receivable(
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

create or replace function public.delete_work_with_receivable(
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

drop function public.stop_work_series(uuid);
drop function public.create_work_series(
  uuid, public.work_series_frequency, public.work_entry_type, uuid, text, date, time,
  integer, text, bigint, integer
);
drop function private.extend_all_work_series();
drop function private.materialize_work_series(uuid, date);
drop table private.work_series_requests;
drop function private.has_active_entitlement(uuid);

alter table public.work_series
  drop constraint work_series_shift_fields,
  drop constraint work_series_location_owner,
  drop column expected_offset_days,
  drop column amount_cents,
  drop column duration_minutes,
  drop column start_time,
  drop column description,
  drop column location_id,
  drop column type;
