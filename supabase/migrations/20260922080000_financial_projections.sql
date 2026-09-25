-- 3.11: owner-scoped projections. Invoker views retain underlying table RLS.
create view public.receivable_projection with (security_invoker = true) as
select
  r.id as receivable_id,
  r.user_id,
  r.work_entry_id,
  r.residency_id,
  case when r.residency_id is not null then 'residency' else w.type::text end as origin,
  r.competence_month,
  r.amount_cents,
  r.expected_on,
  r.received_at,
  (r.received_at at time zone p.timezone)::date as received_local_date,
  r.invalidated_at,
  w.work_date,
  w.duration_minutes,
  w.deleted_at as work_deleted_at,
  case
    when r.invalidated_at is not null then 'invalidated'
    when r.received_at is not null then 'received'
    when r.expected_on is null then 'undated'
    when r.expected_on < (pg_catalog.transaction_timestamp() at time zone p.timezone)::date
      then 'confirmation_pending'
    when r.expected_on = (pg_catalog.transaction_timestamp() at time zone p.timezone)::date
      then 'due_today'
    else 'scheduled'
  end as receipt_status
from public.receivables as r
join public.profiles as p on p.id = r.user_id
left join public.work_entries as w on w.id = r.work_entry_id and w.user_id = r.user_id;
revoke all on public.receivable_projection from public, anon, authenticated, service_role;
grant select on public.receivable_projection to authenticated;

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

-- Two receipt measures stay explicit: confirmed among this month's expected
-- entries (hero partition) versus confirmations performed in this calendar month.
create function public.finance_month_projection(p_month date)
returns table (
  month_start date,
  has_expected_entries boolean,
  expected_total_cents bigint,
  received_of_expected_cents bigint,
  awaiting_of_expected_cents bigint,
  received_in_month_cents bigint,
  undated_count integer,
  undated_total_cents bigint,
  work_generated_cents bigint,
  work_count integer,
  work_duration_minutes bigint,
  hourly_value_cents numeric
)
language plpgsql stable security invoker set search_path = '' as $$
declare
  v_user_id uuid := auth.uid();
  v_premium boolean;
begin
  if v_user_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;
  if p_month is null or p_month <> pg_catalog.date_trunc('month', p_month::timestamp)::date then
    raise exception 'month must be its first day' using errcode = '22023';
  end if;
  select exists (
    select 1 from public.subscription_entitlements as e
    where e.user_id = v_user_id and e.is_active
      and (e.expires_at is null or e.expires_at > pg_catalog.transaction_timestamp())
  ) into v_premium;

  return query
  with items as (
    select r.* from public.receivable_projection as r
    where r.user_id = v_user_id and r.invalidated_at is null
      and (r.work_entry_id is null or r.work_deleted_at is null)
  ), sums as (
    select
      count(*) filter (where r.expected_on >= p_month
        and r.expected_on < (p_month + interval '1 month')::date)::integer as expected_count,
      coalesce(sum(r.amount_cents) filter (where r.expected_on >= p_month
        and r.expected_on < (p_month + interval '1 month')::date), 0)::bigint as expected_total,
      coalesce(sum(r.amount_cents) filter (where r.expected_on >= p_month
        and r.expected_on < (p_month + interval '1 month')::date
        and r.received_at is not null), 0)::bigint as received_of_expected,
      coalesce(sum(r.amount_cents) filter (where r.expected_on >= p_month
        and r.expected_on < (p_month + interval '1 month')::date
        and r.received_at is null), 0)::bigint as awaiting_of_expected,
      coalesce(sum(r.amount_cents) filter (where r.received_local_date >= p_month
        and r.received_local_date < (p_month + interval '1 month')::date), 0)::bigint as received_in_month,
      count(*) filter (where r.expected_on is null and r.received_at is null)::integer as undated_count,
      coalesce(sum(r.amount_cents) filter (where r.expected_on is null
        and r.received_at is null), 0)::bigint as undated_total,
      coalesce(sum(r.amount_cents) filter (where r.work_entry_id is not null
        and r.work_date >= p_month
        and r.work_date < (p_month + interval '1 month')::date), 0)::bigint as generated,
      count(distinct r.work_entry_id) filter (where r.work_date >= p_month
        and r.work_date < (p_month + interval '1 month')::date)::integer as works,
      coalesce(sum(r.duration_minutes) filter (where r.work_entry_id is not null
        and r.work_date >= p_month
        and r.work_date < (p_month + interval '1 month')::date), 0)::bigint as duration,
      coalesce(sum(r.amount_cents) filter (where r.work_entry_id is not null
        and r.duration_minutes is not null
        and r.work_date >= p_month
        and r.work_date < (p_month + interval '1 month')::date), 0)::numeric as hourly_numerator
    from items as r
  )
  select p_month, s.expected_count > 0, s.expected_total,
    s.received_of_expected, s.awaiting_of_expected, s.received_in_month,
    s.undated_count, s.undated_total, s.generated, s.works, s.duration,
    case when v_premium and s.duration > 0
      then s.hourly_numerator * 60 / s.duration else null::numeric end
  from sums as s;
end;
$$;
revoke execute on function public.finance_month_projection(date)
  from public, anon, service_role;
grant execute on function public.finance_month_projection(date) to authenticated;

-- Free retains the real source labels/structure, but detailed source amounts
-- are returned only for an active server entitlement.
create function public.finance_month_origins(p_month date)
returns table (origin text, amount_cents bigint)
language plpgsql stable security invoker set search_path = '' as $$
declare
  v_user_id uuid := auth.uid();
  v_premium boolean;
begin
  if v_user_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;
  if p_month is null or p_month <> pg_catalog.date_trunc('month', p_month::timestamp)::date then
    raise exception 'month must be its first day' using errcode = '22023';
  end if;
  select exists (
    select 1 from public.subscription_entitlements as e
    where e.user_id = v_user_id and e.is_active
      and (e.expires_at is null or e.expires_at > pg_catalog.transaction_timestamp())
  ) into v_premium;
  return query
  with origins(name, position) as (
    values ('shift'::text, 1), ('procedure'::text, 2),
      ('appointment'::text, 3), ('residency'::text, 4)
  ), sums as (
    select r.origin as name, sum(r.amount_cents)::bigint as total
    from public.receivable_projection as r
    where r.user_id = v_user_id and r.invalidated_at is null
      and (r.work_entry_id is null or r.work_deleted_at is null)
      and r.expected_on >= p_month
      and r.expected_on < (p_month + interval '1 month')::date
    group by r.origin
  )
  select o.name,
    case when v_premium then coalesce(s.total, 0)::bigint else null::bigint end
  from origins as o left join sums as s on s.name = o.name
  order by o.position;
end;
$$;
revoke execute on function public.finance_month_origins(date)
  from public, anon, service_role;
grant execute on function public.finance_month_origins(date) to authenticated;

-- The year series has only months backed by real expected/received entries.
-- A single historical month never yields an invented average or trend.
create function public.finance_year_projection(p_year integer)
returns table (
  month_start date,
  expected_total_cents bigint,
  received_of_expected_cents bigint,
  received_in_month_cents bigint,
  historical_month_count integer,
  historical_average_cents numeric
)
language plpgsql stable security invoker set search_path = '' as $$
declare
  v_user_id uuid := auth.uid();
  v_today date;
begin
  if v_user_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;
  if p_year is null or p_year < 1900 or p_year > 9999 then
    raise exception 'invalid year' using errcode = '22023';
  end if;
  select (pg_catalog.transaction_timestamp() at time zone p.timezone)::date into v_today
  from public.profiles as p where p.id = v_user_id;
  if v_today is null then
    raise exception 'profile with timezone required' using errcode = '22023';
  end if;
  return query
  with items as (
    select r.* from public.receivable_projection as r
    where r.user_id = v_user_id and r.invalidated_at is null
      and (r.work_entry_id is null or r.work_deleted_at is null)
  ), months as (
    select pg_catalog.date_trunc('month', r.expected_on::timestamp)::date as m
      from items as r where extract(year from r.expected_on) = p_year
    union
    select pg_catalog.date_trunc('month', r.received_local_date::timestamp)::date as m
      from items as r where extract(year from r.received_local_date) = p_year
  ), monthly as (
    select m.m,
      coalesce(sum(r.amount_cents) filter (where r.expected_on >= m.m
        and r.expected_on < (m.m + interval '1 month')::date), 0)::bigint as expected_total,
      coalesce(sum(r.amount_cents) filter (where r.expected_on >= m.m
        and r.expected_on < (m.m + interval '1 month')::date
        and r.received_at is not null), 0)::bigint as received_expected,
      coalesce(sum(r.amount_cents) filter (where r.received_local_date >= m.m
        and r.received_local_date < (m.m + interval '1 month')::date), 0)::bigint as received_cash
    from months as m
    left join items as r on (r.expected_on >= m.m
      and r.expected_on < (m.m + interval '1 month')::date)
      or (r.received_local_date >= m.m
      and r.received_local_date < (m.m + interval '1 month')::date)
    group by m.m
  ), history as (
    select count(*)::integer as n, avg(expected_total)::numeric as average_cents
    from monthly where m < pg_catalog.date_trunc('month', v_today::timestamp)::date
      and expected_total > 0
  )
  select m.m, m.expected_total, m.received_expected, m.received_cash,
    h.n, case when h.n >= 2 then h.average_cents else null::numeric end
  from monthly as m cross join history as h order by m.m;
end;
$$;
revoke execute on function public.finance_year_projection(integer)
  from public, anon, service_role;
grant execute on function public.finance_year_projection(integer) to authenticated;
