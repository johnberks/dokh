-- 3.4: operational records. Only server workflows may change entitlements and
-- import previews; neither preview JSON nor issue payload creates domain data.
create type public.subscription_store as enum ('app_store', 'play_store');
create type public.subscription_environment as enum ('sandbox', 'production');
create type public.device_platform as enum ('ios', 'android');
create type public.import_source as enum ('plantaozinho', 'csv', 'compatible_file');
create type public.import_status as enum ('uploaded', 'parsing', 'ready', 'confirmed', 'failed', 'empty', 'cancelled');

create table public.subscription_entitlements (
  user_id uuid primary key references auth.users (id) on delete cascade,
  entitlement text not null default 'premium' check (entitlement = 'premium'),
  is_active boolean not null default false,
  product_id text not null check (product_id = btrim(product_id) and product_id <> ''),
  store public.subscription_store not null,
  expires_at timestamptz,
  environment public.subscription_environment not null,
  last_event_id text not null check (last_event_id = btrim(last_event_id) and last_event_id <> ''),
  updated_at timestamptz not null default now(),
  unique (environment, last_event_id)
);

create trigger subscription_entitlements_updated_at before update on public.subscription_entitlements
for each row execute function public.set_updated_at();

create table public.device_push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  expo_push_token text not null unique check (expo_push_token = btrim(expo_push_token) and expo_push_token <> ''),
  platform public.device_platform not null,
  device_id_hash text not null check (device_id_hash ~ '^[0-9a-f]{64}$'),
  last_seen_at timestamptz not null default now(),
  revoked_at timestamptz,
  unique (user_id, platform, device_id_hash)
);

create index device_push_tokens_user_live_idx on public.device_push_tokens (user_id, last_seen_at)
where revoked_at is null;

create table public.imports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  source public.import_source not null,
  storage_path text not null,
  original_filename text not null check (original_filename = btrim(original_filename) and original_filename <> ''),
  file_sha256 text not null check (file_sha256 ~ '^[0-9a-f]{64}$'),
  status public.import_status not null default 'uploaded',
  row_count integer not null default 0 check (row_count >= 0),
  valid_count integer not null default 0 check (valid_count >= 0),
  issue_count integer not null default 0 check (issue_count >= 0),
  summary jsonb not null default '{}'::jsonb check (jsonb_typeof(summary) = 'object'),
  confirmed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id),
  unique (user_id, file_sha256),
  unique (storage_path),
  check (storage_path like user_id::text || '/%' and storage_path !~ '(^|/)\.\.(/|$)'),
  check (valid_count + issue_count <= row_count),
  check ((status = 'confirmed') = (confirmed_at is not null))
);

create trigger imports_updated_at before update on public.imports
for each row execute function public.set_updated_at();
create index imports_user_created_idx on public.imports (user_id, created_at desc);

create table public.import_issues (
  id uuid primary key default gen_random_uuid(),
  import_id uuid not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  row_number integer not null check (row_number > 0),
  issue_code text not null check (issue_code = btrim(issue_code) and issue_code <> ''),
  payload jsonb not null default '{}'::jsonb check (jsonb_typeof(payload) = 'object'),
  resolved_at timestamptz,
  created_work_entry_id uuid,
  created_at timestamptz not null default now(),
  foreign key (import_id, user_id) references public.imports (id, user_id) on delete cascade,
  foreign key (created_work_entry_id, user_id) references public.work_entries (id, user_id)
    on delete set null (created_work_entry_id),
  unique (import_id, row_number, issue_code),
  check (created_work_entry_id is null or resolved_at is not null)
);

create index import_issues_user_open_idx on public.import_issues (user_id, import_id)
where resolved_at is null;

-- Idempotency at both file and normalized-row level. Preview JSON remains
-- operational metadata; only the later confirmation RPC may write Work.
alter table public.work_entries add column import_row_key text;
alter table public.work_entries add constraint work_entries_import_origin check (
  (source = 'import' and import_id is not null and import_row_key is not null
    and import_row_key = btrim(import_row_key) and import_row_key <> '')
  or (source <> 'import' and import_id is null and import_row_key is null)
);
alter table public.work_entries add constraint work_entries_import_owner
  foreign key (import_id, user_id) references public.imports (id, user_id);
create unique index work_entries_import_row_idx on public.work_entries (import_id, import_row_key)
where import_id is not null;

alter table public.subscription_entitlements enable row level security;
alter table public.device_push_tokens enable row level security;
alter table public.imports enable row level security;
alter table public.import_issues enable row level security;

revoke all on public.subscription_entitlements, public.device_push_tokens,
  public.imports, public.import_issues from public, anon, authenticated;
grant select on public.subscription_entitlements, public.imports, public.import_issues to authenticated;
grant select, insert, update, delete on public.device_push_tokens to authenticated;
grant select, insert, update, delete on public.subscription_entitlements,
  public.device_push_tokens, public.imports, public.import_issues to service_role;

create policy subscription_entitlements_owner_read on public.subscription_entitlements
for select to authenticated using ((select auth.uid()) = user_id);
create policy device_push_tokens_owner on public.device_push_tokens
for all to authenticated using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
create policy imports_owner_read on public.imports
for select to authenticated using ((select auth.uid()) = user_id);
create policy import_issues_owner_read on public.import_issues
for select to authenticated using ((select auth.uid()) = user_id);
