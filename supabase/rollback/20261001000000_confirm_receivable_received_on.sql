-- Disposable migration test only. Restores the 3.8 signature (server time only).
drop function public.confirm_receivable_received(uuid, date);

create function public.confirm_receivable_received(p_receivable_id uuid)
returns table (receivable_id uuid, received_at timestamptz)
language plpgsql security definer set search_path = '' as $$
declare
  v_user_id uuid := auth.uid();
  v_receivable public.receivables;
begin
  if v_user_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  select r.* into v_receivable
  from public.receivables as r
  where r.id = p_receivable_id and r.user_id = v_user_id
  for update;
  if not found or v_receivable.invalidated_at is not null then
    raise exception 'receivable not found' using errcode = 'P0002';
  end if;

  if v_receivable.received_at is null then
    update public.receivables as r
    set received_at = pg_catalog.clock_timestamp()
    where r.id = v_receivable.id and r.user_id = v_user_id
    returning r.received_at into v_receivable.received_at;
  end if;

  return query select v_receivable.id, v_receivable.received_at;
end;
$$;

revoke execute on function public.confirm_receivable_received(uuid)
  from public, anon, service_role;
grant execute on function public.confirm_receivable_received(uuid) to authenticated;
