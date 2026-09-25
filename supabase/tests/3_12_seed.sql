do $$
declare
  v_today date := (now() at time zone 'America/Sao_Paulo')::date;
  v_premium uuid := 'd0d00000-0000-4000-8000-000000000001';
  v_free uuid := 'd0d00000-0000-4000-8000-000000000002';
  v_new uuid := 'd0d00000-0000-4000-8000-000000000003';
begin
  assert (select count(*) = 3 from auth.users where id in (v_premium, v_free, v_new)),
    'three synthetic Auth users required';
  assert (select count(*) = 3 from auth.identities where user_id in (v_premium, v_free, v_new)
    and provider = 'email'), 'email identities required for local sign-in';
  assert (select count(*) = 3 from auth.users where id in (v_premium, v_free, v_new)
    and email like '%@example.invalid'
    and encrypted_password = extensions.crypt('DokhLocal2026!', encrypted_password)),
    'users must have synthetic addresses and the documented local password';
  assert (select count(*) = 2 from public.profiles where id in (v_premium, v_free)
    and onboarding_completed_at is not null), 'completed profiles missing';
  assert (select onboarding_completed_at is null from public.profiles where id = v_new),
    'first-access profile must remain incomplete';
  assert (select count(*) = 0 from public.work_entries where user_id = v_new),
    'first access must have an empty agenda';
  assert (select count(*) = 0 from public.receivables where user_id = v_new),
    'first access must have empty finances';
  assert (select count(*) = 1 from public.subscription_entitlements
    where user_id = v_premium and is_active), 'Premium fixture missing';
  assert (select count(*) = 0 from public.subscription_entitlements
    where user_id = v_free), 'Free fixture must not have entitlement';
  assert (select count(*) = 1 from public.residencies where user_id = v_premium),
    'residency source missing';
  assert (select count(*) = 0 from public.work_entries
    where user_id = v_premium and series_id is not null),
    'residency must not become an Agenda recurrence';
  assert (select count(*) = 1 from public.receivables
    where user_id = v_premium and residency_id is not null),
    'Free residency receivable missing';
  assert (select count(*) = 1 from public.work_entries
    where user_id = v_premium and work_date > v_today),
    'next-work card needs a future work';
  assert (select count(*) = 5 from public.work_entries
    where user_id = v_premium), 'Premium agenda fixture count';
  assert (select count(*) = 5 from public.receivables
    where user_id = v_premium and work_entry_id is not null),
    'each work needs one receivable';
  assert (select count(*) = 1 from public.receivables
    where user_id = v_premium and work_entry_id is not null
      and expected_on = v_today and received_at is null),
    'review card for today missing';
  assert (select count(*) = 1 from public.receivables
    where user_id = v_premium and work_entry_id is not null
      and expected_on < v_today and received_at is null),
    'pending confirmation missing';
  assert (select count(*) = 1 from public.receivables
    where user_id = v_premium and expected_on is null),
    'undated review missing';
  assert (select count(*) = 1 from public.receivables
    where user_id = v_premium and received_at is not null),
    'received history missing';
  assert (select count(*) = 1 from public.receivables
    where user_id = v_free and expected_on is null),
    'Free undated state missing';
end $$;

set role authenticated;
select set_config('request.jwt.claim.sub', 'd0d00000-0000-4000-8000-000000000002', false);
do $$
begin
  assert (select count(*) = 2 from public.receivable_projection),
    'Free account must see exactly its two receivables';
  assert (select count(*) = 2 from public.agenda_work_projection),
    'Free account must see exactly its two works';
  assert (select count(*) = 0 from public.receivable_projection
    where user_id = 'd0d00000-0000-4000-8000-000000000001'),
    'Premium data leaked to Free account';
end $$;
reset role;
