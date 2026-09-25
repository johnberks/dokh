-- 6.1: Locais seguem a regra de 3.5 — o cliente só lê a tabela; toda escrita passa por
-- RPC. SECURITY DEFINER é necessário porque 3.5 fecha DML para `authenticated`; cada
-- função confere `auth.uid()` e só toca linhas da própria pessoa.
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

-- Paleta livre (automática ou escolhida) vs. ampliada, que exige Premium ativo (D49).
create function private.assert_work_location_color(
  p_user_id uuid, p_color_token text, p_color_source public.work_location_color_source
)
returns void
language plpgsql stable security invoker set search_path = '' as $$
begin
  if p_color_source = 'premium_palette' then
    if not exists (
      select 1 from public.subscription_entitlements as e
      where e.user_id = p_user_id and e.is_active
        and (e.expires_at is null or e.expires_at > pg_catalog.transaction_timestamp())
    ) then
      raise exception 'premium palette requires an active entitlement' using errcode = '42501';
    end if;
  elsif p_color_token is null or p_color_token not in ('sage', 'bronze', 'blue', 'green') then
    raise exception 'color is outside the free palette' using errcode = '22023';
  end if;
end;
$$;
revoke execute on function private.assert_work_location_color(
  uuid, text, public.work_location_color_source
) from public, anon, authenticated;

create function public.create_work_location(
  p_name text,
  p_city text,
  p_color_token text,
  p_color_source public.work_location_color_source
)
returns public.work_locations
language plpgsql security definer set search_path = '' as $$
declare
  v_user_id uuid := auth.uid();
  v_location public.work_locations;
begin
  if v_user_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;
  perform private.assert_work_location_color(v_user_id, p_color_token, p_color_source);

  insert into public.work_locations (user_id, name, city, color_token, color_source)
  values (
    v_user_id,
    pg_catalog.btrim(p_name),
    nullif(pg_catalog.btrim(p_city), ''),
    p_color_token,
    p_color_source
  )
  returning * into v_location;
  return v_location;
end;
$$;

-- Substitui nome, cidade e cor de um Local ativo. A cor só é revalidada quando muda:
-- quem perdeu o Premium continua podendo renomear um Local com cor da paleta ampliada.
create function public.update_work_location(
  p_location_id uuid,
  p_name text,
  p_city text,
  p_color_token text,
  p_color_source public.work_location_color_source
)
returns public.work_locations
language plpgsql security definer set search_path = '' as $$
declare
  v_user_id uuid := auth.uid();
  v_current public.work_locations;
  v_location public.work_locations;
begin
  if v_user_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  select l.* into v_current
  from public.work_locations as l
  where l.id = p_location_id and l.user_id = v_user_id and l.archived_at is null
  for update;
  if not found then
    raise exception 'work location not found' using errcode = 'P0002';
  end if;

  if v_current.color_token is distinct from p_color_token
    or v_current.color_source is distinct from p_color_source then
    perform private.assert_work_location_color(v_user_id, p_color_token, p_color_source);
  end if;

  update public.work_locations as l
  set name = pg_catalog.btrim(p_name),
      city = nullif(pg_catalog.btrim(p_city), ''),
      color_token = p_color_token,
      color_source = p_color_source
  where l.id = v_current.id
  returning l.* into v_location;
  return v_location;
end;
$$;

-- Arquivar preserva o histórico: Trabalhos antigos mantêm a referência. Repetir não falha.
create function public.archive_work_location(p_location_id uuid)
returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  update public.work_locations as l
  set archived_at = pg_catalog.transaction_timestamp()
  where l.id = p_location_id and l.user_id = v_user_id and l.archived_at is null;

  if not found and not exists (
    select 1 from public.work_locations as l
    where l.id = p_location_id and l.user_id = v_user_id
  ) then
    raise exception 'work location not found' using errcode = 'P0002';
  end if;
end;
$$;

revoke execute on function public.create_work_location(
  text, text, text, public.work_location_color_source
) from public, anon, authenticated, service_role;
revoke execute on function public.update_work_location(
  uuid, text, text, text, public.work_location_color_source
) from public, anon, authenticated, service_role;
revoke execute on function public.archive_work_location(uuid)
  from public, anon, authenticated, service_role;
grant execute on function public.create_work_location(
  text, text, text, public.work_location_color_source
) to authenticated;
grant execute on function public.update_work_location(
  uuid, text, text, text, public.work_location_color_source
) to authenticated;
grant execute on function public.archive_work_location(uuid) to authenticated;
