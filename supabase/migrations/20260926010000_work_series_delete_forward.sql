-- 8.5: deleting a recurring Work offers "only this day" (delete_work_with_receivable)
-- or "this and the following". The latter ends the series and removes the chosen
-- occurrence plus every later one not yet received; earlier dates stay as history.
-- Deleting never requires Premium, and repeating the call changes nothing.
create function public.delete_work_series_from(p_work_entry_id uuid)
returns table (series_id uuid, removed integer)
language plpgsql security definer set search_path = '' as $$
declare
  v_user_id uuid := auth.uid();
  v_work public.work_entries;
  v_now timestamptz := pg_catalog.clock_timestamp();
  v_removed integer := 0;
begin
  if v_user_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;
  select w.* into v_work from public.work_entries as w
  where w.id = p_work_entry_id and w.user_id = v_user_id and w.series_id is not null
  for update;
  if not found then
    raise exception 'work occurrence not found' using errcode = 'P0002';
  end if;

  perform 1 from public.work_series as s
  where s.id = v_work.series_id and s.user_id = v_user_id
  for update;
  update public.work_series as s set active = false
  where s.id = v_work.series_id and s.user_id = v_user_id and s.active;

  with removed as (
    update public.work_entries as w set deleted_at = v_now
    where w.series_id = v_work.series_id and w.user_id = v_user_id
      and w.deleted_at is null and w.work_date >= v_work.work_date
      and (w.id = v_work.id or not exists (
        select 1 from public.receivables as r
        where r.work_entry_id = w.id and r.received_at is not null
      ))
    returning w.id
  )
  update public.receivables as r set invalidated_at = v_now
  from removed
  where r.work_entry_id = removed.id and r.invalidated_at is null;

  select count(*)::integer into v_removed from public.work_entries as w
  where w.series_id = v_work.series_id and w.deleted_at = v_now;
  return query select v_work.series_id, v_removed;
end;
$$;

revoke execute on function public.delete_work_series_from(uuid)
  from public, anon, service_role;
grant execute on function public.delete_work_series_from(uuid) to authenticated;
