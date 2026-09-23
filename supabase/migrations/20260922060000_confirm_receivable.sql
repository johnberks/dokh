-- 3.8: receipt is an explicit, one-way action. Due dates never set it.
-- Keep the first server-generated timestamp immutable for audit, including
-- when later service-role workflows update other receivable fields.
create function public.prevent_received_at_rewrite()
returns trigger language plpgsql set search_path = '' as $$
begin
  if old.received_at is not null and new.received_at is distinct from old.received_at then
    raise exception 'received_at cannot be changed after confirmation'
      using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger receivables_received_at_immutable
before update of received_at on public.receivables
for each row execute function public.prevent_received_at_rewrite();

revoke execute on function public.prevent_received_at_rewrite()
  from public, anon, authenticated, service_role;

-- Direct UPDATE remains closed to clients. The definer function is narrowly
-- scoped to this field, derives ownership from the verified JWT, and locks the
-- row so concurrent confirmations return the same original instant.
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
