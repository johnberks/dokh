-- Extend the rolling 12-month Free residency horizon without app foregrounding.
-- The worker is private and runs as the migration/cron owner, never from a
-- client-provided user ID. Each residency uses its owner's IANA timezone.
create function private.extend_all_residency_receivables()
returns integer language plpgsql security definer set search_path = '' as $$
declare
  v_row record;
  v_today date;
  v_changed integer := 0;
begin
  for v_row in
    select r.id, p.timezone from public.residencies as r
    join public.profiles as p on p.id = r.user_id
    where r.active and r.expected_ends_on is null
  loop
    v_today := (pg_catalog.transaction_timestamp() at time zone v_row.timezone)::date;
    v_changed := v_changed + private.sync_residency_receivables(
      v_row.id, pg_catalog.date_trunc('month', v_today::timestamp)::date, v_today
    );
  end loop;
  return v_changed;
end;
$$;
revoke execute on function private.extend_all_residency_receivables()
  from public, anon, authenticated, service_role;

-- pg_cron is configured to run in the main postgres database. Disposable
-- migration tests use a separate database and verify the worker directly.
do $$
begin
  if current_database() = 'postgres' then
    create extension if not exists pg_cron with schema extensions;
    perform cron.schedule(
      'dokh-residency-extension', '15 3 * * *',
      'select private.extend_all_residency_receivables()'
    );
  end if;
end;
$$;
