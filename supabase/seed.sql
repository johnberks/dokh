-- Development-only synthetic fixtures. Applied by `supabase db reset --local`.
-- Never use `supabase db push --include-seed` against preview or production.
-- These addresses cannot receive mail; the shared password is intentionally local/test-only.
insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
select id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
  email, extensions.crypt('DokhLocal2026!', extensions.gen_salt('bf')),
  now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()
from (values
  ('d0d00000-0000-4000-8000-000000000001'::uuid, 'premium@example.invalid'),
  ('d0d00000-0000-4000-8000-000000000002'::uuid, 'free@example.invalid'),
  ('d0d00000-0000-4000-8000-000000000003'::uuid, 'novo@example.invalid')
) as fixtures(id, email)
on conflict (id) do nothing;

insert into auth.identities (provider_id, user_id, identity_data, provider, created_at, updated_at)
select id::text, id, jsonb_build_object('sub', id::text, 'email', email, 'email_verified', true),
  'email', now(), now()
from (values
  ('d0d00000-0000-4000-8000-000000000001'::uuid, 'premium@example.invalid'),
  ('d0d00000-0000-4000-8000-000000000002'::uuid, 'free@example.invalid'),
  ('d0d00000-0000-4000-8000-000000000003'::uuid, 'novo@example.invalid')
) as fixtures(id, email)
on conflict (provider_id, provider) do nothing;

insert into public.profiles (
  id, display_name, graduation_year, professional_status, specialty, city, timezone,
  onboarding_completed_at
) values
  ('d0d00000-0000-4000-8000-000000000001', 'Demo Premium', 2024,
    'resident', 'Clínica médica', 'São Paulo', 'America/Sao_Paulo', now()),
  ('d0d00000-0000-4000-8000-000000000002', 'Demo Free', 2024,
    'general_practitioner', null, 'São Paulo', 'America/Sao_Paulo', now()),
  ('d0d00000-0000-4000-8000-000000000003', 'Demo Novo', null,
    'general_practitioner', null, null, 'America/Sao_Paulo', null)
on conflict (id) do nothing;

insert into public.work_preferences (
  user_id, default_duration_minutes, default_start_time, default_payment_term_days
) values
  ('d0d00000-0000-4000-8000-000000000001', 720, '07:00', 30),
  ('d0d00000-0000-4000-8000-000000000002', 360, '08:00', 30)
on conflict (user_id) do nothing;

insert into public.notification_preferences (user_id) values
  ('d0d00000-0000-4000-8000-000000000001'),
  ('d0d00000-0000-4000-8000-000000000002')
on conflict (user_id) do nothing;

insert into public.subscription_entitlements (
  user_id, is_active, product_id, store, environment, last_event_id
) values (
  'd0d00000-0000-4000-8000-000000000001', true,
  'local-demo-monthly', 'app_store', 'sandbox', 'local-seed-premium'
)
on conflict (user_id) do nothing;

insert into public.work_locations (id, user_id, name, city, color_token, color_source) values
  ('d0d00000-0000-4000-8000-000000000101', 'd0d00000-0000-4000-8000-000000000001',
    'Hospital Exemplo', 'São Paulo', 'sage', 'automatic'),
  ('d0d00000-0000-4000-8000-000000000102', 'd0d00000-0000-4000-8000-000000000001',
    'Clínica Exemplo', 'São Paulo', 'bronze', 'free_palette'),
  ('d0d00000-0000-4000-8000-000000000201', 'd0d00000-0000-4000-8000-000000000002',
    'Unidade Exemplo', 'São Paulo', 'blue', 'automatic')
on conflict (id) do nothing;

insert into public.residencies (
  id, user_id, specialty, institution, level_label, starts_on,
  monthly_amount_cents, payment_day
) values (
  'd0d00000-0000-4000-8000-000000000701',
  'd0d00000-0000-4000-8000-000000000001',
  'Clínica médica', 'Instituição Exemplo', 'R2',
  date_trunc('month', (now() at time zone 'America/Sao_Paulo')::date)::date - interval '2 months',
  360000, 28
)
on conflict (id) do nothing;

-- Relative local dates keep the same UI states useful regardless of reset day.
insert into public.work_entries (
  id, user_id, type, location_id, description, work_date,
  start_time, duration_minutes, timezone
) values
  ('d0d00000-0000-4000-8000-000000000301', 'd0d00000-0000-4000-8000-000000000001',
    'shift', 'd0d00000-0000-4000-8000-000000000101', 'Plantão de demonstração',
    (now() at time zone 'America/Sao_Paulo')::date + 2, '07:00', 720, 'America/Sao_Paulo'),
  ('d0d00000-0000-4000-8000-000000000302', 'd0d00000-0000-4000-8000-000000000001',
    'procedure', 'd0d00000-0000-4000-8000-000000000102', 'Procedimento de demonstração',
    (now() at time zone 'America/Sao_Paulo')::date - 5, '10:00', 90, 'America/Sao_Paulo'),
  ('d0d00000-0000-4000-8000-000000000303', 'd0d00000-0000-4000-8000-000000000001',
    'appointment', 'd0d00000-0000-4000-8000-000000000102', 'Atendimento de demonstração',
    (now() at time zone 'America/Sao_Paulo')::date - 12, '14:00', 60, 'America/Sao_Paulo'),
  ('d0d00000-0000-4000-8000-000000000304', 'd0d00000-0000-4000-8000-000000000001',
    'shift', 'd0d00000-0000-4000-8000-000000000101', null,
    (now() at time zone 'America/Sao_Paulo')::date - 1, '19:00', 720, 'America/Sao_Paulo'),
  ('d0d00000-0000-4000-8000-000000000305', 'd0d00000-0000-4000-8000-000000000001',
    'shift', 'd0d00000-0000-4000-8000-000000000101', null,
    date_trunc('month', (now() at time zone 'America/Sao_Paulo')::date)::date - 8,
    '07:00', 720, 'America/Sao_Paulo'),
  ('d0d00000-0000-4000-8000-000000000401', 'd0d00000-0000-4000-8000-000000000002',
    'shift', 'd0d00000-0000-4000-8000-000000000201', null,
    (now() at time zone 'America/Sao_Paulo')::date + 3, '08:00', 360, 'America/Sao_Paulo'),
  ('d0d00000-0000-4000-8000-000000000402', 'd0d00000-0000-4000-8000-000000000002',
    'procedure', 'd0d00000-0000-4000-8000-000000000201', null,
    (now() at time zone 'America/Sao_Paulo')::date - 2, null, null, 'America/Sao_Paulo')
on conflict (id) do nothing;

insert into public.receivables (
  id, user_id, work_entry_id, residency_id, competence_month,
  amount_cents, expected_on, received_at
) values
  ('d0d00000-0000-4000-8000-000000000501', 'd0d00000-0000-4000-8000-000000000001',
    'd0d00000-0000-4000-8000-000000000301', null,
    date_trunc('month', ((now() at time zone 'America/Sao_Paulo')::date + 2)::timestamp)::date,
    180000, (now() at time zone 'America/Sao_Paulo')::date + 7, null),
  ('d0d00000-0000-4000-8000-000000000502', 'd0d00000-0000-4000-8000-000000000001',
    'd0d00000-0000-4000-8000-000000000302', null,
    date_trunc('month', ((now() at time zone 'America/Sao_Paulo')::date - 5)::timestamp)::date,
    95000, (now() at time zone 'America/Sao_Paulo')::date, null),
  ('d0d00000-0000-4000-8000-000000000503', 'd0d00000-0000-4000-8000-000000000001',
    'd0d00000-0000-4000-8000-000000000303', null,
    date_trunc('month', ((now() at time zone 'America/Sao_Paulo')::date - 12)::timestamp)::date,
    70000, (now() at time zone 'America/Sao_Paulo')::date - 3, null),
  ('d0d00000-0000-4000-8000-000000000504', 'd0d00000-0000-4000-8000-000000000001',
    'd0d00000-0000-4000-8000-000000000304', null,
    date_trunc('month', ((now() at time zone 'America/Sao_Paulo')::date - 1)::timestamp)::date,
    160000, null, null),
  ('d0d00000-0000-4000-8000-000000000505', 'd0d00000-0000-4000-8000-000000000001',
    'd0d00000-0000-4000-8000-000000000305', null,
    date_trunc('month', ((now() at time zone 'America/Sao_Paulo')::date - interval '1 month')::timestamp)::date,
    150000, date_trunc('month', (now() at time zone 'America/Sao_Paulo')::date)::date - 3,
    date_trunc('month', (now() at time zone 'America/Sao_Paulo')::date)::timestamptz - interval '2 days'),
  ('d0d00000-0000-4000-8000-000000000506', 'd0d00000-0000-4000-8000-000000000001',
    null, 'd0d00000-0000-4000-8000-000000000701',
    date_trunc('month', (now() at time zone 'America/Sao_Paulo')::date)::date,
    360000, date_trunc('month', (now() at time zone 'America/Sao_Paulo')::date)::date + 27, null),
  ('d0d00000-0000-4000-8000-000000000601', 'd0d00000-0000-4000-8000-000000000002',
    'd0d00000-0000-4000-8000-000000000401', null,
    date_trunc('month', ((now() at time zone 'America/Sao_Paulo')::date + 3)::timestamp)::date,
    80000, (now() at time zone 'America/Sao_Paulo')::date + 10, null),
  ('d0d00000-0000-4000-8000-000000000602', 'd0d00000-0000-4000-8000-000000000002',
    'd0d00000-0000-4000-8000-000000000402', null,
    date_trunc('month', ((now() at time zone 'America/Sao_Paulo')::date - 2)::timestamp)::date,
    45000, null, null)
on conflict (id) do nothing;
