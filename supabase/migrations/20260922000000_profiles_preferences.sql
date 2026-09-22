-- 3.2: identity and user-owned preferences. No client-supplied owner is trusted.
create type public.professional_status as enum ('general_practitioner', 'resident');

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = pg_catalog
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create function public.validate_profile_timezone()
returns trigger
language plpgsql
set search_path = pg_catalog
as $$
begin
  if not exists (select 1 from pg_catalog.pg_timezone_names where name = new.timezone) then
    raise check_violation using message = 'timezone must be a recognized IANA zone';
  end if;
  return new;
end;
$$;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  -- The domain identifier is auth.users.id; expose it as user_id for the shared ownership rule.
  user_id uuid generated always as (id) stored not null unique,
  display_name text not null check (display_name = btrim(display_name) and display_name <> ''),
  graduation_year smallint check (graduation_year between 1900 and extract(year from current_date)::integer),
  professional_status public.professional_status not null,
  specialty text,
  city text,
  country_code char(2) not null default 'BR' check (country_code ~ '^[A-Z]{2}$'),
  locale text not null default 'pt-BR' check (locale <> '' and locale = btrim(locale)),
  -- Supplied by the device; a server default cannot infer the user's zone.
  timezone text not null,
  avatar_path text,
  onboarding_completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_specialty_by_status check (
    (professional_status = 'resident' and specialty is not null and specialty = btrim(specialty) and specialty <> '')
    or (professional_status = 'general_practitioner' and specialty is null)
  )
);

create trigger profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger profiles_timezone
before insert or update on public.profiles
for each row execute function public.validate_profile_timezone();

create table public.work_preferences (
  user_id uuid primary key references auth.users (id) on delete cascade,
  default_duration_minutes integer check (default_duration_minutes > 0),
  default_start_time time,
  default_payment_term_days smallint check (default_payment_term_days in (30, 60, 90)),
  updated_at timestamptz not null default now()
);

create trigger work_preferences_updated_at
before update on public.work_preferences
for each row execute function public.set_updated_at();

create table public.notification_preferences (
  user_id uuid primary key references auth.users (id) on delete cascade,
  receivable_due_day boolean not null default false,
  undated_weekly_reminder boolean not null default false,
  upcoming_work_reminder boolean not null default false,
  important_work_changes boolean not null default false,
  updated_at timestamptz not null default now()
);

create trigger notification_preferences_updated_at
before update on public.notification_preferences
for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.work_preferences enable row level security;
alter table public.notification_preferences enable row level security;

grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.work_preferences to authenticated;
grant select, insert, update, delete on public.notification_preferences to authenticated;

create policy profiles_owner on public.profiles
for all to authenticated using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy work_preferences_owner on public.work_preferences
for all to authenticated using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy notification_preferences_owner on public.notification_preferences
for all to authenticated using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
