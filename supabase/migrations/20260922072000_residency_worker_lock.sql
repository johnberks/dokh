-- Recheck activity after locking each residency: deactivation can race with
-- the scheduled worker's initial scan without failing the whole job.
create or replace function private.extend_all_residency_receivables()
returns integer language plpgsql security definer set search_path = '' as $$
declare
  v_row record;
  v_today date;
  v_active boolean;
  v_changed integer := 0;
begin
  for v_row in
    select r.id, p.timezone from public.residencies as r
    join public.profiles as p on p.id = r.user_id
    where r.active and r.expected_ends_on is null
  loop
    select r.active into v_active from public.residencies as r
    where r.id = v_row.id for update;
    if v_active then
      v_today := (pg_catalog.transaction_timestamp() at time zone v_row.timezone)::date;
      v_changed := v_changed + private.sync_residency_receivables(
        v_row.id, pg_catalog.date_trunc('month', v_today::timestamp)::date, v_today
      );
    end if;
  end loop;
  return v_changed;
end;
$$;
