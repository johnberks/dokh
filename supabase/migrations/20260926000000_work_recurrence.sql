-- 3.10: Premium Work recurrence. A series stores the Work template and materializes
-- Work + Receivable occurrences 12 months ahead, idempotently by (series_id,
-- occurrence_key). Entitlement is validated on the server before any write; Free
-- residency (3.9) stays independent of work_series.
alter table public.work_series
  add column type public.work_entry_type not null,
  add column location_id uuid not null,
  add column description text,
  add column start_time time,
  add column duration_minutes integer check (duration_minutes > 0),
  add column amount_cents bigint not null check (amount_cents > 0),
  -- Days between each occurrence and its expected payment; null means "ainda não sei".
  add column expected_offset_days integer check (expected_offset_days between 0 and 366),
  add constraint work_series_location_owner foreign key (location_id, user_id)
    references public.work_locations (id, user_id) on delete cascade,
  add constraint work_series_shift_fields check (
    type <> 'shift' or (start_time is not null and duration_minutes is not null)
  );

-- Custom frequency (P03) is not offered yet; the enum keeps room for it.
create function private.has_active_entitlement(p_user_id uuid)
returns boolean
language sql stable security invoker set search_path = '' as $$
  select exists (
    select 1 from public.subscription_entitlements as e
    where e.user_id = p_user_id and e.is_active
      and (e.expires_at is null or e.expires_at > pg_catalog.transaction_timestamp())
  );
$$;
revoke execute on function private.has_active_entitlement(uuid)
  from public, anon, authenticated, service_role;

create table private.work_series_requests (
  user_id uuid not null references auth.users (id) on delete cascade,
  idempotency_key uuid not null,
  request_hash text not null check (request_hash ~ '^[0-9a-f]{64}$'),
  series_id uuid,
  created_at timestamptz not null default now(),
  primary key (user_id, idempotency_key)
);
alter table private.work_series_requests enable row level security;
revoke all on private.work_series_requests from public, anon, authenticated;

-- Occurrence dates always derive from starts_on (never from the previous one), so
-- a monthly series on day 31 clamps to short months without drifting.
create function private.materialize_work_series(p_series_id uuid, p_until date)
returns integer language plpgsql security invoker set search_path = '' as $$
declare
  v_series public.work_series;
  v_until date := p_until;
  v_step integer := 0;
  v_date date;
  v_work_id uuid;
  v_count integer := 0;
begin
  select * into strict v_series from public.work_series where id = p_series_id for update;
  if not v_series.active then
    return 0;
  end if;
  -- An archived location stops generation; past occurrences keep their reference.
  if not exists (
    select 1 from public.work_locations as l
    where l.id = v_series.location_id and l.user_id = v_series.user_id and l.archived_at is null
  ) then
    return 0;
  end if;
  if v_series.ends_on is not null and v_until > v_series.ends_on then
    v_until := v_series.ends_on;
  end if;
  if v_until < v_series.starts_on then
    return 0;
  end if;

  loop
    v_date := case v_series.frequency
      when 'weekly' then v_series.starts_on + 7 * v_step
      when 'biweekly' then v_series.starts_on + 14 * v_step
      else (v_series.starts_on + pg_catalog.make_interval(months => v_step))::date
    end;
    exit when v_date > v_until;
    v_step := v_step + 1;
    continue when v_series.materialized_until is not null
      and v_date <= v_series.materialized_until;

    v_work_id := null;
    insert into public.work_entries (
      user_id, type, location_id, description, work_date, start_time,
      duration_minutes, timezone, series_id, occurrence_key, source
    ) values (
      v_series.user_id, v_series.type, v_series.location_id, v_series.description, v_date,
      v_series.start_time, v_series.duration_minutes, v_series.timezone, v_series.id,
      v_date::text, 'recurrence'
    ) on conflict (series_id, occurrence_key) do nothing
    returning id into v_work_id;

    if v_work_id is not null then
      insert into public.receivables (
        user_id, work_entry_id, competence_month, amount_cents, expected_on
      ) values (
        v_series.user_id, v_work_id, pg_catalog.date_trunc('month', v_date::timestamp)::date,
        v_series.amount_cents, v_date + v_series.expected_offset_days
      );
      v_count := v_count + 1;
    end if;
  end loop;

  update public.work_series as s
  set materialized_until = greatest(coalesce(s.materialized_until, v_until), v_until)
  where s.id = v_series.id;
  return v_count;
end;
$$;
revoke execute on function private.materialize_work_series(uuid, date)
  from public, anon, authenticated, service_role;

create function public.create_work_series(
  p_idempotency_key uuid,
  p_frequency public.work_series_frequency,
  p_type public.work_entry_type,
  p_location_id uuid,
  p_description text,
  p_starts_on date,
  p_start_time time,
  p_duration_minutes integer,
  p_timezone text,
  p_amount_cents bigint,
  p_expected_offset_days integer
)
returns table (series_id uuid, work_id uuid, occurrences integer)
language plpgsql security definer set search_path = '' as $$
declare
  v_user_id uuid := auth.uid();
  v_today date;
  v_hash text;
  v_request private.work_series_requests;
  v_series_id uuid;
  v_count integer;
begin
  if v_user_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;
  -- Checked before any write: Free is denied without partial state.
  if not private.has_active_entitlement(v_user_id) then
    raise exception 'work recurrence requires an active entitlement' using errcode = '42501';
  end if;
  if p_frequency is null or p_frequency not in ('weekly', 'biweekly', 'monthly') then
    raise exception 'unsupported recurrence frequency' using errcode = '22023';
  end if;
  if p_idempotency_key is null then
    raise exception 'idempotency key is required' using errcode = '22023';
  end if;
  select (pg_catalog.transaction_timestamp() at time zone p.timezone)::date into v_today
  from public.profiles as p where p.id = v_user_id;
  if v_today is null then
    raise exception 'profile with timezone required' using errcode = '22023';
  end if;

  v_hash := encode(sha256(convert_to(pg_catalog.jsonb_build_object(
    'frequency', p_frequency, 'type', p_type, 'location_id', p_location_id,
    'description', p_description, 'starts_on', p_starts_on, 'start_time', p_start_time,
    'duration_minutes', p_duration_minutes, 'timezone', p_timezone,
    'amount_cents', p_amount_cents, 'expected_offset_days', p_expected_offset_days
  )::text, 'UTF8')), 'hex');
  insert into private.work_series_requests (user_id, idempotency_key, request_hash)
  values (v_user_id, p_idempotency_key, v_hash)
  on conflict (user_id, idempotency_key) do nothing;
  select r.* into strict v_request from private.work_series_requests as r
  where r.user_id = v_user_id and r.idempotency_key = p_idempotency_key
  for update;
  if v_request.request_hash <> v_hash then
    raise exception 'idempotency key was used for a different request' using errcode = '23505';
  end if;

  if v_request.series_id is null then
    insert into public.work_series (
      user_id, frequency, rrule, timezone, starts_on, type, location_id, description,
      start_time, duration_minutes, amount_cents, expected_offset_days
    ) values (
      v_user_id, p_frequency,
      case p_frequency
        when 'weekly' then 'FREQ=WEEKLY;INTERVAL=1'
        when 'biweekly' then 'FREQ=WEEKLY;INTERVAL=2'
        else 'FREQ=MONTHLY;INTERVAL=1'
      end,
      p_timezone, p_starts_on, p_type, p_location_id, nullif(pg_catalog.btrim(p_description), ''),
      p_start_time, p_duration_minutes, p_amount_cents, p_expected_offset_days
    ) returning id into v_series_id;
    -- The first occurrence always exists, even when it starts beyond the horizon.
    perform private.materialize_work_series(
      v_series_id, greatest((v_today + interval '12 months')::date, p_starts_on)
    );
    update private.work_series_requests as r set series_id = v_series_id
    where r.user_id = v_user_id and r.idempotency_key = p_idempotency_key;
  else
    v_series_id := v_request.series_id;
  end if;

  select count(*)::integer into v_count from public.work_entries as w
  where w.series_id = v_series_id and w.deleted_at is null;
  return query
  select v_series_id, w.id, v_count from public.work_entries as w
  where w.series_id = v_series_id and w.occurrence_key = p_starts_on::text;
end;
$$;

-- "Parar de repetir": past and today's occurrences stay as history; future ones not yet
-- received leave Agenda and Finanças. Stopping never requires Premium.
create function public.stop_work_series(p_series_id uuid)
returns table (series_id uuid, removed integer)
language plpgsql security definer set search_path = '' as $$
declare
  v_user_id uuid := auth.uid();
  v_today date;
  v_series public.work_series;
  v_now timestamptz := pg_catalog.clock_timestamp();
  v_removed integer := 0;
begin
  if v_user_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;
  select (pg_catalog.transaction_timestamp() at time zone p.timezone)::date into v_today
  from public.profiles as p where p.id = v_user_id;
  if v_today is null then
    raise exception 'profile with timezone required' using errcode = '22023';
  end if;
  select s.* into v_series from public.work_series as s
  where s.id = p_series_id and s.user_id = v_user_id
  for update;
  if not found then
    raise exception 'work series not found' using errcode = 'P0002';
  end if;

  if v_series.active then
    update public.work_series as s set active = false where s.id = v_series.id;
    with removed as (
      update public.work_entries as w set deleted_at = v_now
      where w.series_id = v_series.id and w.user_id = v_user_id
        and w.deleted_at is null and w.work_date > v_today
        and not exists (
          select 1 from public.receivables as r
          where r.work_entry_id = w.id and r.received_at is not null
        )
      returning w.id
    )
    update public.receivables as r set invalidated_at = v_now
    from removed
    where r.work_entry_id = removed.id and r.invalidated_at is null;
    select count(*)::integer into v_removed from public.work_entries as w
    where w.series_id = v_series.id and w.deleted_at = v_now;
  end if;
  return query select v_series.id, v_removed;
end;
$$;

-- Scheduled worker: extends every active series whose owner is still Premium. A
-- lapsed subscription keeps what was generated and simply stops extending.
create function private.extend_all_work_series()
returns integer language plpgsql security definer set search_path = '' as $$
declare
  v_row record;
  v_active boolean;
  v_today date;
  v_changed integer := 0;
begin
  for v_row in
    select s.id, s.user_id, p.timezone from public.work_series as s
    join public.profiles as p on p.id = s.user_id
    where s.active
  loop
    if not private.has_active_entitlement(v_row.user_id) then
      continue;
    end if;
    select s.active into v_active from public.work_series as s where s.id = v_row.id for update;
    if v_active then
      v_today := (pg_catalog.transaction_timestamp() at time zone v_row.timezone)::date;
      v_changed := v_changed + private.materialize_work_series(
        v_row.id, (v_today + interval '12 months')::date
      );
    end if;
  end loop;
  return v_changed;
end;
$$;
revoke execute on function private.extend_all_work_series()
  from public, anon, authenticated, service_role;

-- Occurrences are edited and deleted one at a time (series-wide edits wait for P03).
-- Their occurrence_key stays, so the worker never recreates an edited or deleted date.
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
    and w.deleted_at is null and w.import_id is null
    and ((w.source = 'manual' and w.series_id is null) or w.source = 'recurrence')
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
  where w.id = p_work_entry_id and w.user_id = v_user_id and w.import_id is null
    and ((w.source = 'manual' and w.series_id is null) or w.source = 'recurrence')
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

-- Agenda shows "Este trabalho se repete" and manages the series from the detail.
create or replace view public.agenda_work_projection with (security_invoker = true) as
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
  r.receipt_status,
  w.series_id,
  s.frequency as series_frequency,
  s.active as series_active
from public.work_entries as w
join public.work_locations as l on l.id = w.location_id and l.user_id = w.user_id
left join public.receivable_projection as r on r.work_entry_id = w.id
left join public.work_series as s on s.id = w.series_id and s.user_id = w.user_id
where w.deleted_at is null;
revoke all on public.agenda_work_projection from public, anon, authenticated, service_role;
grant select on public.agenda_work_projection to authenticated;

revoke execute on function public.create_work_series(
  uuid, public.work_series_frequency, public.work_entry_type, uuid, text, date, time,
  integer, text, bigint, integer
) from public, anon, service_role;
revoke execute on function public.stop_work_series(uuid) from public, anon, service_role;
grant execute on function public.create_work_series(
  uuid, public.work_series_frequency, public.work_entry_type, uuid, text, date, time,
  integer, text, bigint, integer
) to authenticated;
grant execute on function public.stop_work_series(uuid) to authenticated;

-- pg_cron runs in the main postgres database; disposable tests call the worker directly.
do $$
begin
  if current_database() = 'postgres' then
    create extension if not exists pg_cron with schema extensions;
    perform cron.schedule(
      'dokh-work-series-extension', '30 3 * * *',
      'select private.extend_all_work_series()'
    );
  end if;
end;
$$;
