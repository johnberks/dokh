-- 3.3: professional occurrences and their single financial source of truth.
-- Direct client writes stay closed until transactional RPCs (3.7/3.9) and
-- server-side Premium entitlement checks (3.4/3.5) are implemented.
create type public.work_location_color_source as enum ('automatic', 'free_palette', 'premium_palette');
create type public.work_series_frequency as enum ('weekly', 'biweekly', 'monthly', 'custom');
create type public.work_entry_type as enum ('shift', 'procedure', 'appointment');
create type public.work_entry_source as enum ('manual', 'import', 'recurrence');

create table public.work_locations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (name = btrim(name) and name <> ''),
  city text,
  color_token text not null check (color_token in (
    'sage', 'bronze', 'blue', 'green', 'terra', 'violet', 'khaki', 'petrol', 'bronze_deep'
  )),
  color_source public.work_location_color_source not null default 'automatic',
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id)
);

create trigger work_locations_updated_at before update on public.work_locations
for each row execute function public.set_updated_at();

create index work_locations_user_active_name_idx
on public.work_locations (user_id, name) where archived_at is null;

create table public.work_series (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  frequency public.work_series_frequency not null,
  rrule text not null check (rrule = btrim(rrule) and rrule <> ''),
  timezone text not null,
  starts_on date not null,
  ends_on date check (ends_on >= starts_on),
  active boolean not null default true,
  materialized_until date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id),
  check (materialized_until is null or materialized_until >= starts_on),
  check (materialized_until is null or ends_on is null or materialized_until <= ends_on)
);

create trigger work_series_updated_at before update on public.work_series
for each row execute function public.set_updated_at();
create trigger work_series_timezone before insert or update on public.work_series
for each row execute function public.validate_profile_timezone();

create index work_series_user_materialized_idx
on public.work_series (user_id, materialized_until) where active;

create table public.residencies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  specialty text not null check (specialty = btrim(specialty) and specialty <> ''),
  institution text,
  level_label text,
  starts_on date not null,
  expected_ends_on date check (expected_ends_on >= starts_on),
  monthly_amount_cents bigint not null check (monthly_amount_cents > 0),
  payment_day smallint not null check (payment_day between 1 and 31),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id)
);

create trigger residencies_updated_at before update on public.residencies
for each row execute function public.set_updated_at();

create unique index residencies_one_active_per_user_idx
on public.residencies (user_id) where active;

create table public.work_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  type public.work_entry_type not null,
  location_id uuid not null,
  description text,
  work_date date not null,
  start_time time,
  duration_minutes integer check (duration_minutes > 0),
  timezone text not null,
  series_id uuid,
  occurrence_key text,
  source public.work_entry_source not null default 'manual',
  -- The import FK is added with the imports table in 3.4.
  import_id uuid,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id),
  unique (series_id, occurrence_key),
  foreign key (location_id, user_id) references public.work_locations (id, user_id) on delete cascade,
  foreign key (series_id, user_id) references public.work_series (id, user_id) on delete cascade,
  constraint work_entries_shift_fields check (
    type <> 'shift' or (start_time is not null and duration_minutes is not null)
  ),
  constraint work_entries_series_source check (
    (series_id is null and occurrence_key is null and source <> 'recurrence')
    or (series_id is not null and occurrence_key is not null
      and occurrence_key = btrim(occurrence_key) and occurrence_key <> '' and source = 'recurrence')
  )
);

create function public.validate_active_work_location()
returns trigger language plpgsql set search_path = pg_catalog as $$
begin
  if not exists (
    select 1 from public.work_locations
    where id = new.location_id and user_id = new.user_id and archived_at is null
  ) then
    raise check_violation using message = 'work location must be active and owned by the user';
  end if;
  return new;
end;
$$;

create trigger work_entries_active_location
before insert or update of location_id, user_id on public.work_entries
for each row execute function public.validate_active_work_location();
create trigger work_entries_updated_at before update on public.work_entries
for each row execute function public.set_updated_at();
create trigger work_entries_timezone before insert or update on public.work_entries
for each row execute function public.validate_profile_timezone();

create index work_entries_user_date_idx
on public.work_entries (user_id, work_date, start_time, created_at)
where deleted_at is null;

create table public.receivables (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  work_entry_id uuid,
  residency_id uuid,
  competence_month date not null check (competence_month = date_trunc('month', competence_month::timestamp)::date),
  amount_cents bigint not null check (amount_cents > 0),
  currency char(3) not null default 'BRL' check (currency = 'BRL'),
  expected_on date,
  received_at timestamptz,
  invalidated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint receivables_exactly_one_origin check ((work_entry_id is null) <> (residency_id is null)),
  foreign key (work_entry_id, user_id) references public.work_entries (id, user_id) on delete cascade,
  foreign key (residency_id, user_id) references public.residencies (id, user_id) on delete cascade,
  unique (work_entry_id),
  unique (residency_id, competence_month)
);

create trigger receivables_updated_at before update on public.receivables
for each row execute function public.set_updated_at();

create index receivables_user_expected_idx on public.receivables (user_id, expected_on)
where invalidated_at is null and expected_on is not null;
create index receivables_user_competence_idx on public.receivables (user_id, competence_month)
where invalidated_at is null;
create index receivables_user_received_idx on public.receivables (user_id, received_at)
where received_at is not null and invalidated_at is null;

alter table public.work_locations enable row level security;
alter table public.work_series enable row level security;
alter table public.work_entries enable row level security;
alter table public.residencies enable row level security;
alter table public.receivables enable row level security;

revoke all on public.work_locations, public.work_series, public.work_entries,
  public.residencies, public.receivables from public, anon, authenticated;
grant select on public.work_locations, public.work_series, public.work_entries,
  public.residencies, public.receivables to authenticated;
grant select, insert, update, delete on public.work_locations, public.work_series,
  public.work_entries, public.residencies, public.receivables to service_role;

create policy work_locations_owner_read on public.work_locations for select to authenticated
using ((select auth.uid()) = user_id);
create policy work_series_owner_read on public.work_series for select to authenticated
using ((select auth.uid()) = user_id);
create policy work_entries_owner_read on public.work_entries for select to authenticated
using ((select auth.uid()) = user_id);
create policy residencies_owner_read on public.residencies for select to authenticated
using ((select auth.uid()) = user_id);
create policy receivables_owner_read on public.receivables for select to authenticated
using ((select auth.uid()) = user_id);
