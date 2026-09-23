-- 3.9: monthly residency income is Free and independent of work_series.
-- All aggregate writes happen behind owner-scoped RPCs; no table DML grants change.
create function private.sync_residency_receivables(
  p_residency_id uuid, p_from_month date, p_today date
)
returns integer language plpgsql security invoker set search_path = '' as $$
declare
  v_residency public.residencies;
  v_month date;
  v_end_month date;
  v_expected_on date;
  v_changed integer := 0;
  v_count integer;
begin
  select * into strict v_residency from public.residencies where id = p_residency_id for update;
  if not v_residency.active then
    raise exception 'residency is inactive' using errcode = '22023';
  end if;
  v_end_month := pg_catalog.date_trunc('month',
    coalesce(v_residency.expected_ends_on, (p_today + interval '12 months')::date)::timestamp
  )::date;

  -- Months are generated from the configured start, with the payment day
  -- clamped to the final valid calendar day (including leap February).
  for v_month in
    select month_start::date
    from pg_catalog.generate_series(
      greatest(pg_catalog.date_trunc('month', v_residency.starts_on::timestamp)::date, p_from_month),
      v_end_month, interval '1 month'
    ) as month_start
  loop
    v_expected_on := v_month +
      (least(v_residency.payment_day::integer,
        extract(day from (v_month + interval '1 month - 1 day'))::integer) - 1);

    insert into public.receivables (
      user_id, residency_id, competence_month, amount_cents, expected_on
    ) values (
      v_residency.user_id, v_residency.id, v_month,
      v_residency.monthly_amount_cents, v_expected_on
    ) on conflict (residency_id, competence_month) do nothing;
    get diagnostics v_count = row_count;
    v_changed := v_changed + v_count;

    -- Only previously future, unreceived rows can be reconciled. Historical
    -- and received rows keep their original amount, date and audit state.
    update public.receivables as r
    set amount_cents = v_residency.monthly_amount_cents,
        expected_on = v_expected_on,
        invalidated_at = null
    where r.residency_id = v_residency.id
      and r.competence_month = v_month
      and r.received_at is null
      and r.expected_on > p_today
      and (r.amount_cents, r.expected_on, r.invalidated_at)
        is distinct from (v_residency.monthly_amount_cents, v_expected_on, null::timestamptz);
    get diagnostics v_count = row_count;
    v_changed := v_changed + v_count;
  end loop;

  -- Moving the start/end boundary removes only still-future projections.
  update public.receivables as r
  set invalidated_at = pg_catalog.clock_timestamp()
  where r.residency_id = v_residency.id
    and r.received_at is null and r.invalidated_at is null
    and r.expected_on > p_today
    and (r.competence_month < pg_catalog.date_trunc('month', v_residency.starts_on::timestamp)::date
      or r.competence_month > v_end_month);
  get diagnostics v_count = row_count;
  return v_changed + v_count;
end;
$$;
revoke execute on function private.sync_residency_receivables(uuid, date, date)
  from public, anon, authenticated, service_role;

create function public.create_or_update_residency(
  p_residency_id uuid,
  p_specialty text,
  p_institution text,
  p_level_label text,
  p_starts_on date,
  p_expected_ends_on date,
  p_monthly_amount_cents bigint,
  p_payment_day smallint
)
returns table (residency_id uuid, receivables_changed integer)
language plpgsql security definer set search_path = '' as $$
declare
  v_user_id uuid := auth.uid();
  v_residency public.residencies;
  v_today date;
  v_from_month date;
  v_new boolean := false;
begin
  if v_user_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;
  select (pg_catalog.transaction_timestamp() at time zone p.timezone)::date into v_today
  from public.profiles as p where p.id = v_user_id;
  if v_today is null then
    raise exception 'profile with timezone required' using errcode = '22023';
  end if;
  -- Serializes two first-create calls for the same owner before either sees
  -- the active row; unique(active user) remains a second line of defense.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_user_id::text, 390));
  if p_residency_id is null then
    select * into v_residency from public.residencies
    where user_id = v_user_id and active for update;
  else
    select * into v_residency from public.residencies
    where id = p_residency_id and user_id = v_user_id and active for update;
    if not found then
      raise exception 'active residency not found' using errcode = 'P0002';
    end if;
  end if;

  if v_residency.id is null then
    insert into public.residencies (
      user_id, specialty, institution, level_label, starts_on,
      expected_ends_on, monthly_amount_cents, payment_day
    ) values (
      v_user_id, p_specialty, p_institution, p_level_label, p_starts_on,
      p_expected_ends_on, p_monthly_amount_cents, p_payment_day
    ) returning * into v_residency;
    v_new := true;
  elsif (v_residency.specialty, v_residency.institution, v_residency.level_label,
    v_residency.starts_on, v_residency.expected_ends_on,
    v_residency.monthly_amount_cents, v_residency.payment_day)
    is distinct from (p_specialty, p_institution, p_level_label, p_starts_on,
      p_expected_ends_on, p_monthly_amount_cents, p_payment_day) then
    update public.residencies as r
    set specialty = p_specialty, institution = p_institution,
        level_label = p_level_label, starts_on = p_starts_on,
        expected_ends_on = p_expected_ends_on,
        monthly_amount_cents = p_monthly_amount_cents,
        payment_day = p_payment_day
    where r.id = v_residency.id returning * into v_residency;
  end if;

  v_from_month := case when v_new
    then pg_catalog.date_trunc('month', v_residency.starts_on::timestamp)::date
    else pg_catalog.date_trunc('month', v_today::timestamp)::date end;
  residency_id := v_residency.id;
  receivables_changed := private.sync_residency_receivables(v_residency.id, v_from_month, v_today);
  return next;
end;
$$;
revoke execute on function public.create_or_update_residency(
  uuid, text, text, text, date, date, bigint, smallint
) from public, anon, service_role;
grant execute on function public.create_or_update_residency(
  uuid, text, text, text, date, date, bigint, smallint
) to authenticated;

create function public.generate_residency_receivables(p_residency_id uuid)
returns integer language plpgsql security definer set search_path = '' as $$
declare
  v_user_id uuid := auth.uid();
  v_today date;
begin
  if v_user_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;
  select (pg_catalog.transaction_timestamp() at time zone p.timezone)::date into v_today
  from public.profiles as p where p.id = v_user_id;
  if v_today is null then
    raise exception 'profile with timezone required' using errcode = '22023';
  end if;
  perform 1 from public.residencies
  where id = p_residency_id and user_id = v_user_id and active for update;
  if not found then
    raise exception 'active residency not found' using errcode = 'P0002';
  end if;
  return private.sync_residency_receivables(
    p_residency_id, pg_catalog.date_trunc('month', v_today::timestamp)::date, v_today
  );
end;
$$;
revoke execute on function public.generate_residency_receivables(uuid)
  from public, anon, service_role;
grant execute on function public.generate_residency_receivables(uuid) to authenticated;

create function public.deactivate_residency(p_residency_id uuid)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_user_id uuid := auth.uid();
  v_today date;
  v_residency public.residencies;
begin
  if v_user_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;
  select (pg_catalog.transaction_timestamp() at time zone p.timezone)::date into v_today
  from public.profiles as p where p.id = v_user_id;
  if v_today is null then
    raise exception 'profile with timezone required' using errcode = '22023';
  end if;
  select * into v_residency from public.residencies
  where id = p_residency_id and user_id = v_user_id for update;
  if not found then
    raise exception 'residency not found' using errcode = 'P0002';
  end if;
  if v_residency.active then
    update public.residencies set active = false where id = v_residency.id;
    update public.receivables as r
    set invalidated_at = pg_catalog.clock_timestamp()
    where r.residency_id = v_residency.id and r.received_at is null
      and r.invalidated_at is null and r.expected_on > v_today;
  end if;
  return v_residency.id;
end;
$$;
revoke execute on function public.deactivate_residency(uuid)
  from public, anon, service_role;
grant execute on function public.deactivate_residency(uuid) to authenticated;
