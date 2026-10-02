-- 7.7: "Já recebi" ao registrar um Trabalho de hoje ou do passado. A confirmação continua
-- explícita (D34), mas aceita o dia em que o valor entrou: sem isso um recebimento de setembro
-- confirmado em outubro cairia no caixa de outubro. Sem data, mantém o horário do servidor.
drop function public.confirm_receivable_received(uuid);

create function public.confirm_receivable_received(
  p_receivable_id uuid,
  p_received_on date default null
)
returns table (receivable_id uuid, received_at timestamptz)
language plpgsql security definer set search_path = '' as $$
declare
  v_user_id uuid := auth.uid();
  v_receivable public.receivables;
  v_timezone text;
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
    if p_received_on is null then
      update public.receivables as r
      set received_at = pg_catalog.clock_timestamp()
      where r.id = v_receivable.id and r.user_id = v_user_id
      returning r.received_at into v_receivable.received_at;
    else
      -- O dia é local da pessoa: meio-dia no fuso do perfil, longe das viradas de data.
      select p.timezone into v_timezone from public.profiles as p where p.id = v_user_id;
      v_timezone := coalesce(v_timezone, 'America/Sao_Paulo');
      if p_received_on > (pg_catalog.clock_timestamp() at time zone v_timezone)::date then
        raise exception 'received date is in the future' using errcode = '22023';
      end if;
      update public.receivables as r
      set received_at = (p_received_on + time '12:00') at time zone v_timezone
      where r.id = v_receivable.id and r.user_id = v_user_id
      returning r.received_at into v_receivable.received_at;
    end if;
  end if;

  return query select v_receivable.id, v_receivable.received_at;
end;
$$;

revoke execute on function public.confirm_receivable_received(uuid, date)
  from public, anon, service_role;
grant execute on function public.confirm_receivable_received(uuid, date) to authenticated;
