-- For disposable migration tests only; never roll back production data casually.
drop trigger profiles_residency_status on public.profiles;
drop function private.sync_residency_with_status();

alter table public.profiles drop constraint profiles_specialty_by_status;
alter table public.profiles add constraint profiles_specialty_by_status check (
  (professional_status = 'resident' and specialty is not null and specialty = btrim(specialty) and specialty <> '')
  or (professional_status = 'general_practitioner' and specialty is null)
);

create or replace function public.create_or_update_residency(
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
