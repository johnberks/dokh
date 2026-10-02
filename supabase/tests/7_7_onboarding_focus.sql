-- Run in a disposable database after all migrations through 7.7 (onboarding focus).
begin;

insert into auth.users (id) values
  ('00000000-0000-0000-0000-000000000011'),
  ('00000000-0000-0000-0000-000000000022');
insert into public.profiles (id, display_name, professional_status, timezone) values
  ('00000000-0000-0000-0000-000000000011', 'Ana', 'general_practitioner', 'UTC'),
  ('00000000-0000-0000-0000-000000000022', 'Bia', 'general_practitioner', 'UTC');

do $$
declare v_denied boolean := false;
begin
  assert (select enum_range(null::public.onboarding_focus)::text[]
    = array['work', 'receivables', 'earnings']), 'focus values changed';
  assert (select onboarding_focus is null from public.profiles
    where id = '00000000-0000-0000-0000-000000000011'), 'existing profiles must stay without focus';
  begin
    update public.profiles set onboarding_focus = 'income'::public.onboarding_focus
    where id = '00000000-0000-0000-0000-000000000011';
  exception when invalid_text_representation then v_denied := true;
  end;
  assert v_denied, 'unknown focus accepted';
end $$;

set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000011', false);
update public.profiles set onboarding_focus = 'receivables'
where id in ('00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000022');
reset role;

do $$
begin
  assert (select onboarding_focus = 'receivables' from public.profiles
    where id = '00000000-0000-0000-0000-000000000011'), 'owner could not save focus';
  assert (select onboarding_focus is null from public.profiles
    where id = '00000000-0000-0000-0000-000000000022'), 'RLS let another user change focus';
end $$;

rollback;
